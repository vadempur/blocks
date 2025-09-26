import { describe, it, expect, beforeEach, vi } from "vitest";
import { BlockchainDB } from "../src/services/blockchain-db";
import { UTXORepo } from "../src/db/repos/utxo.repo";
import { BalanceRepo } from "../src/db/repos/balance.repo";
import { BlocksRepo } from "../src/db/repos/blocks.repo";
import { TransactionRepo } from "../src/db/repos/transaction.repo";
import { InputRepo } from "../src/db/repos/input.repo";
import { OutputRepo } from "../src/db/repos/output.repo";
import {
  createMockUtxoRepo,
  createMockBalanceRepo,
  createMockBlocksRepo,
  createMockTransactionRepo,
  createMockInputRepo,
  createMockOutputRepo,
  createMockBlock,
  expectHashLength
} from './test-utils';
import type { UTXO } from "../src/types";

vi.mock("../src/db/repos/utxo.repo");
vi.mock("../src/db/repos/balance.repo");
vi.mock("../src/db/repos/blocks.repo");
vi.mock("../src/db/repos/transaction.repo");
vi.mock("../src/db/repos/input.repo");
vi.mock("../src/db/repos/output.repo");

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

describe("BlockchainDB", () => {
  let blockchainDb: BlockchainDB;
  let mockUtxoRepo: any;
  let mockBalanceRepo: any;
  let mockBlocksRepo: any;
  let mockTransactionRepo: any;
  let mockInputRepo: any;
  let mockOutputRepo: any;

  beforeEach(() => {
    mockUtxoRepo = createMockUtxoRepo();
    mockBalanceRepo = createMockBalanceRepo();
    mockBlocksRepo = createMockBlocksRepo();
    mockTransactionRepo = createMockTransactionRepo();
    mockInputRepo = createMockInputRepo();
    mockOutputRepo = createMockOutputRepo();

    vi.mocked(UTXORepo).mockImplementation(() => mockUtxoRepo);
    vi.mocked(BalanceRepo).mockImplementation(() => mockBalanceRepo);
    vi.mocked(BlocksRepo).mockImplementation(() => mockBlocksRepo);
    vi.mocked(TransactionRepo).mockImplementation(() => mockTransactionRepo);
    vi.mocked(InputRepo).mockImplementation(() => mockInputRepo);
    vi.mocked(OutputRepo).mockImplementation(() => mockOutputRepo);

    blockchainDb = new BlockchainDB();
  });

  describe("constructor", () => {
    it("should initialize all repositories", () => {
      expect(blockchainDb.utxoRepo).toBeDefined();
      expect(blockchainDb.balanceRepo).toBeDefined();
      expect(blockchainDb.blocksRepo).toBeDefined();
      expect(blockchainDb.transactionsRepo).toBeDefined();
      expect(blockchainDb.inputRepo).toBeDefined();
      expect(blockchainDb.outputRepo).toBeDefined();
    });

    it("should create new instances of each repository", () => {
      const blockchainDb2 = new BlockchainDB();
      expect(blockchainDb.utxoRepo).toBeDefined();
      expect(blockchainDb.balanceRepo).toBeDefined();
      expect(blockchainDb2.utxoRepo).toBeDefined();
      expect(blockchainDb2.balanceRepo).toBeDefined();
    });
  });

  describe("maxHeight", () => {
    it("should return max height from blocks repository", async () => {
      mockBlocksRepo.count.mockResolvedValue(5);

      const result = await blockchainDb.maxHeight();

      expect(mockBlocksRepo.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it("should handle repository errors", async () => {
      const error = new Error("Repository error");
      mockBlocksRepo.count.mockRejectedValue(error);

      await expect(blockchainDb.maxHeight()).rejects.toThrow(
        "Repository error"
      );
    });
  });

  describe("getUtxoItem", () => {
    it("should return UTXO for valid txId and index", async () => {
      const expectedUTXO: UTXO = {
        txId: "tx123",
        index: 0,
        output: { address: "addr1", value: 100 },
      };

      mockUtxoRepo.get.mockResolvedValue(expectedUTXO);

      const result = await blockchainDb.getUtxoItem("tx123", 0);

      expect(mockUtxoRepo.get).toHaveBeenCalledWith("tx123:0");
      expect(result).toEqual(expectedUTXO);
    });

    it("should return undefined for non-existent UTXO", async () => {
      mockUtxoRepo.get.mockResolvedValue(undefined);

      const result = await blockchainDb.getUtxoItem("nonexistent", 0);

      expect(mockUtxoRepo.get).toHaveBeenCalledWith("nonexistent:0");
      expect(result).toBeUndefined();
    });
  });

  describe("getBalance", () => {
    it("should return balance for existing address", async () => {
      const mockBalance = { address: "addr1", balance: 100 };
      mockBalanceRepo.get.mockResolvedValue(mockBalance);

      const result = await blockchainDb.getBalance("addr1");

      expect(mockBalanceRepo.get).toHaveBeenCalledWith("addr1");
      expect(result).toBe(100);
    });

    it("should return 0 for non-existent address", async () => {
      mockBalanceRepo.get.mockResolvedValue(null);

      const result = await blockchainDb.getBalance("nonexistent");

      expect(mockBalanceRepo.get).toHaveBeenCalledWith("nonexistent");
      expect(result).toBe(0);
    });

    it("should handle repository errors", async () => {
      const error = new Error("Repository error");
      mockBalanceRepo.get.mockRejectedValue(error);

      await expect(blockchainDb.getBalance("addr1")).rejects.toThrow(
        "Repository error"
      );
    });
  });

  describe("repository delegation", () => {
    it("should delegate utxoRepo calls correctly", async () => {
      const utxo: UTXO = {
        txId: "tx123",
        index: 0,
        output: { address: "addr1", value: 100 },
      };

      mockUtxoRepo.get.mockResolvedValue(utxo);
      mockUtxoRepo.count.mockResolvedValue(5);

      const result1 = await blockchainDb.utxoRepo.get("tx123:0");
      const result2 = await blockchainDb.utxoRepo.count();

      expect(result1).toEqual(utxo);
      expect(result2).toBe(5);
    });

    it("should delegate balanceRepo calls correctly", async () => {
      const mockBalance = { address: "addr1", balance: 100 };

      mockBalanceRepo.get.mockResolvedValue(mockBalance);
      mockBalanceRepo.count.mockResolvedValue(3);

      const result1 = await blockchainDb.balanceRepo.get("addr1");
      const result2 = await blockchainDb.balanceRepo.count();

      expect(result1).toEqual(mockBalance);
      expect(result2).toBe(3);
    });

    it("should delegate blocksRepo calls correctly", async () => {
      const mockBlocks = [{ id: "block1", height: 1, transactions: [] }];

      mockBlocksRepo.getAll.mockResolvedValue(mockBlocks);
      mockBlocksRepo.count.mockResolvedValue(1);

      const result1 = await blockchainDb.blocksRepo.getAll();
      const result2 = await blockchainDb.blocksRepo.count();

      expect(result1).toEqual(mockBlocks);
      expect(result2).toBe(1);
    });
  });

  describe("BlockchainUtils inheritance", () => {
    it("should inherit BlockchainUtils methods", () => {
      const result = blockchainDb.getUtxoKey("tx123", 0);
      expect(result).toBe("tx123:0");
    });

    it("should have access to inherited methods", () => {
      const mockBlock = createMockBlock(1, [{ id: "tx1", inputs: [], outputs: [] }]);

      const hash = blockchainDb.getBlockHash(mockBlock);
      expectHashLength(hash);
    });
  });
});
