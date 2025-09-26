import { describe, it, expect, beforeEach, vi } from "vitest";
import { BalanceManager } from "../src/services/balance-manager";
import { BlockchainDB } from "../src/services/blockchain-db";
import {
  createMockBlockchainDb,
} from './test-utils';
import type { TransactionType, Input, Output } from "../src/types";

vi.mock("../src/services/blockchain-db");

vi.mock("typeorm", () => ({
  Entity: vi.fn(),
  PrimaryColumn: vi.fn(),
  Column: vi.fn((type?: any) => vi.fn()),
  ManyToOne: vi.fn(),
  OneToMany: vi.fn(),
  ManyToMany: vi.fn(),
  JoinColumn: vi.fn(),
  OneToOne: vi.fn(),
  CreateDateColumn: vi.fn(),
  UpdateDateColumn: vi.fn(),
  VersionColumn: vi.fn(),
  Index: vi.fn(),
  Unique: vi.fn(),
  Check: vi.fn(),
  Exclusion: vi.fn(),
  Generated: vi.fn(),
  ObjectIdColumn: vi.fn(),
  BaseEntity: vi.fn(),
  Repository: vi.fn(),
  DataSource: vi.fn(),
  PrimaryGeneratedColumn: vi.fn(),
  ObjectId: vi.fn(),
  ColumnTypes: {
    VARCHAR: 'varchar',
    INT: 'int',
    FLOAT: 'float',
    TEXT: 'text',
    BOOLEAN: 'boolean',
    TIMESTAMP: 'timestamp',
    DATE: 'date'
  },
  __decorate: vi.fn(),
  __metadata: vi.fn(),
  Reflect: {
    getMetadata: vi.fn(),
    defineMetadata: vi.fn(),
    hasMetadata: vi.fn(),
    hasOwnMetadata: vi.fn(),
    getOwnMetadata: vi.fn(),
    getOwnMetadataKeys: vi.fn(),
    deleteMetadata: vi.fn(),
    metadata: vi.fn()
  }
}));

describe("BalanceManager", () => {
  let balanceManager: BalanceManager;
  let mockBlockchainDb: any;
  let mockUtxoRepo: any;
  let mockBalanceRepo: any;

  beforeEach(() => {
    mockUtxoRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    mockBalanceRepo = {
      get: vi.fn(),
      set: vi.fn(),
    };

    mockBlockchainDb = createMockBlockchainDb(
      undefined, 
      mockBalanceRepo,
      mockUtxoRepo,
      undefined, 
      undefined, 
      undefined  
    );

    vi.mocked(BlockchainDB).mockImplementation(() => mockBlockchainDb);

    balanceManager = new BalanceManager(mockBlockchainDb as any);
  });

  describe("getBalance", () => {
    it("should return balance for existing address", async () => {
      mockBalanceRepo.get.mockResolvedValue({ address: "addr1", balance: 100 });

      const result = await balanceManager.getBalance("addr1");

      expect(mockBalanceRepo.get).toHaveBeenCalledWith("addr1");
      expect(result).toBe(100);
    });

    it("should return 0 for non-existent address", async () => {
      mockBalanceRepo.get.mockResolvedValue(null);

      const result = await balanceManager.getBalance("nonexistent");

      expect(mockBalanceRepo.get).toHaveBeenCalledWith("nonexistent");
      expect(result).toBe(0);
    });
  });

  describe("updateBalance", () => {
    it("should update existing balance", async () => {
      mockBalanceRepo.get.mockResolvedValue({ address: "addr1", balance: 100 });

      await (balanceManager as any).updateBalance("addr1", 50);

      expect(mockBalanceRepo.get).toHaveBeenCalledWith("addr1");
      expect(mockBalanceRepo.set).toHaveBeenCalledWith("addr1", {
        balance: 150,
        address: "addr1",
      });
    });

    it("should create new balance when address does not exist", async () => {
      mockBalanceRepo.get.mockResolvedValue(null);

      await (balanceManager as any).updateBalance("new_addr", 100);

      expect(mockBalanceRepo.get).toHaveBeenCalledWith("new_addr");
      expect(mockBalanceRepo.set).toHaveBeenCalledWith("new_addr", {
        balance: 100,
        address: "new_addr",
      });
    });

    it("should handle negative balances", async () => {
      mockBalanceRepo.get.mockResolvedValue({ address: "addr1", balance: 100 });

      await (balanceManager as any).updateBalance("addr1", -150);

      expect(mockBalanceRepo.set).toHaveBeenCalledWith("addr1", {
        balance: -50,
        address: "addr1",
      });
    });
  });

  describe("createOutput", () => {
    it("should create UTXO and update balance", async () => {
      const output: Output = { address: "addr1", value: 100 };

      mockBalanceRepo.get.mockResolvedValue({ address: "addr1", balance: 50 });

      await (balanceManager as any).createOutput("tx123", 0, output);

      expect(mockUtxoRepo.set).toHaveBeenCalledWith("tx123:0", {
        output,
        txId: "tx123",
        index: 0,
      });
      expect(mockBalanceRepo.set).toHaveBeenCalledWith("addr1", {
        balance: 150,
        address: "addr1",
      });
    });
  });

  describe("spendInput", () => {
    it("should spend UTXO and update balance", async () => {
      const input: Input = { txId: "tx123", index: 0 };
      const utxo = {
        output: { address: "addr1", value: 100 },
        txId: "tx123",
        index: 0,
      };

      mockUtxoRepo.get.mockResolvedValue(utxo);
      mockBalanceRepo.get.mockResolvedValue({ address: "addr1", balance: 150 });

      await (balanceManager as any).spendInput(input);

      expect(mockUtxoRepo.delete).toHaveBeenCalledWith("tx123:0");
      expect(mockBalanceRepo.set).toHaveBeenCalledWith("addr1", {
        balance: 50,
        address: "addr1",
      });
    });

    it("should throw error for non-existent UTXO", async () => {
      const input: Input = { txId: "nonexistent", index: 0 };

      mockUtxoRepo.get.mockResolvedValue(null);

      await expect((balanceManager as any).spendInput(input)).rejects.toThrow(
        "Cannot spend input: UTXO nonexistent:0 not found"
      );
    });
  });

  describe("handleOutputs", () => {
    it("should create multiple outputs", async () => {
      const outputs: Output[] = [
        { address: "addr1", value: 50 },
        { address: "addr2", value: 30 },
      ];

      mockBalanceRepo.get
        .mockResolvedValueOnce({ address: "addr1", balance: 100 })
        .mockResolvedValueOnce({ address: "addr2", balance: 50 });

      await (balanceManager as any).handleOutputs("tx123", outputs);

      expect(mockUtxoRepo.set).toHaveBeenCalledWith(
        "tx123:0",
        expect.any(Object)
      );
      expect(mockUtxoRepo.set).toHaveBeenCalledWith(
        "tx123:1",
        expect.any(Object)
      );
      expect(mockBalanceRepo.set).toHaveBeenCalledWith(
        "addr1",
        expect.any(Object)
      );
      expect(mockBalanceRepo.set).toHaveBeenCalledWith(
        "addr2",
        expect.any(Object)
      );
    });
  });

  describe("handleInputs", () => {
    it("should spend multiple inputs", async () => {
      const inputs: Input[] = [
        { txId: "tx123", index: 0 },
        { txId: "tx456", index: 1 },
      ];

      const utxo1 = {
        output: { address: "addr3", value: 50 },
        txId: "tx123",
        index: 0,
      };
      const utxo2 = {
        output: { address: "addr4", value: 30 },
        txId: "tx456",
        index: 1,
      };

      mockUtxoRepo.get
        .mockResolvedValueOnce(utxo1)
        .mockResolvedValueOnce(utxo2);

      mockBalanceRepo.get
        .mockResolvedValueOnce({ address: "addr3", balance: 100 })
        .mockResolvedValueOnce({ address: "addr4", balance: 80 });

      await (balanceManager as any).handleInputs(inputs);

      expect(mockUtxoRepo.delete).toHaveBeenCalledWith("tx123:0");
      expect(mockUtxoRepo.delete).toHaveBeenCalledWith("tx456:1");
      expect(mockBalanceRepo.set).toHaveBeenCalledWith(
        "addr3",
        expect.any(Object)
      );
      expect(mockBalanceRepo.set).toHaveBeenCalledWith(
        "addr4",
        expect.any(Object)
      );
    });
  });

  describe("processTransaction", () => {
    it("should process coinbase transaction (no inputs)", async () => {
      const transaction: TransactionType = {
        id: "tx_coinbase",
        inputs: [],
        outputs: [{ address: "addr1", value: 100 }],
      };

      mockBalanceRepo.get.mockResolvedValue({ address: "addr1", balance: 50 });

      await balanceManager.processTransaction(transaction);

      expect(mockUtxoRepo.set).toHaveBeenCalledWith(
        "tx_coinbase:0",
        expect.any(Object)
      );
      expect(mockBalanceRepo.set).toHaveBeenCalledWith("addr1", {
        balance: 150,
        address: "addr1",
      });
    });

    it("should process regular transaction (with inputs)", async () => {
      const transaction: TransactionType = {
        id: "tx_regular",
        inputs: [{ txId: "prev_tx", index: 0 }],
        outputs: [{ address: "addr1", value: 100 }],
      };

      const prevUtxo = {
        output: { address: "addr2", value: 100 },
        txId: "prev_tx",
        index: 0,
      };

      mockUtxoRepo.get.mockResolvedValue(prevUtxo);
      mockBalanceRepo.get
        .mockResolvedValueOnce({ address: "addr2", balance: 200 })
        .mockResolvedValueOnce({ address: "addr1", balance: 50 });

      await balanceManager.processTransaction(transaction);

      expect(mockUtxoRepo.delete).toHaveBeenCalledWith("prev_tx:0");
      expect(mockUtxoRepo.set).toHaveBeenCalledWith(
        "tx_regular:0",
        expect.any(Object)
      );
      expect(mockBalanceRepo.set).toHaveBeenCalledWith("addr2", {
        balance: 100,
        address: "addr2",
      });
      expect(mockBalanceRepo.set).toHaveBeenCalledWith("addr1", {
        balance: 150,
        address: "addr1",
      });
    });

    it("should handle transaction with multiple inputs and outputs", async () => {
      const transaction: TransactionType = {
        id: "tx_multi",
        inputs: [
          { txId: "prev_tx1", index: 0 },
          { txId: "prev_tx2", index: 0 },
        ],
        outputs: [
          { address: "addr1", value: 50 },
          { address: "addr2", value: 30 },
        ],
      };

      const utxo1 = {
        output: { address: "addr3", value: 50 },
        txId: "prev_tx1",
        index: 0,
      };
      const utxo2 = {
        output: { address: "addr4", value: 30 },
        txId: "prev_tx2",
        index: 0,
      };

      mockUtxoRepo.get
        .mockResolvedValueOnce(utxo1)
        .mockResolvedValueOnce(utxo2);

      mockBalanceRepo.get
        .mockResolvedValueOnce({ address: "addr3", balance: 100 })
        .mockResolvedValueOnce({ address: "addr4", balance: 80 })
        .mockResolvedValueOnce({ address: "addr1", balance: 50 })
        .mockResolvedValueOnce({ address: "addr2", balance: 30 });

      await (balanceManager as any).processTransaction(transaction);

      expect(mockUtxoRepo.delete).toHaveBeenCalledWith("prev_tx1:0");
      expect(mockUtxoRepo.delete).toHaveBeenCalledWith("prev_tx2:0");
      expect(mockUtxoRepo.set).toHaveBeenCalledWith(
        "tx_multi:0",
        expect.any(Object)
      );
      expect(mockUtxoRepo.set).toHaveBeenCalledWith(
        "tx_multi:1",
        expect.any(Object)
      );
    });
  });
});
