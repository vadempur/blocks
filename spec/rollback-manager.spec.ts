import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RollbackManager } from '../src/services/rollback-manger';
import { BlockchainDB } from '../src/services/blockchain-db';
import type { TransactionType } from '../src/types';

vi.mock('../src/services/blockchain-db');

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

describe('RollbackManager', () => {
  let rollbackManager: RollbackManager;
  let mockBlockchainDb: any;

  beforeEach(() => {
    mockBlockchainDb = {
      blocksRepo: {
        getMaxHeight: vi.fn(),
        getMaxHeightBlock: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      transactionsRepo: {
        delete: vi.fn(),
        get: vi.fn()
      },
      utxoRepo: {
        delete: vi.fn(),
        set: vi.fn()
      },
      balanceRepo: {
        get: vi.fn(),
        set: vi.fn()
      },
      getUtxoKey: vi.fn((txId: string, index: number) => `${txId}:${index}`)
    };

    vi.mocked(BlockchainDB).mockImplementation(() => mockBlockchainDb);

    rollbackManager = new RollbackManager(mockBlockchainDb as any);
  });

  describe('constructor', () => {
    it('should initialize with blockchain DB', () => {
      expect(rollbackManager).toBeDefined();
    });
  });

  describe('rollbackToHeight', () => {
    it('should reject invalid height (greater than max)', async () => {
      mockBlockchainDb.blocksRepo.getMaxHeight.mockResolvedValue(3);

      await expect(rollbackManager.rollbackToHeight(5))
        .rejects.toThrow('Invalid rollback height. Cannot rollback to height 5 when current height is 2. Height must be less than current height.');
    });

    it('should reject invalid height (equal to max)', async () => {
      mockBlockchainDb.blocksRepo.getMaxHeight.mockResolvedValue(3);

      await expect(rollbackManager.rollbackToHeight(3))
        .rejects.toThrow('Invalid rollback height. Cannot rollback to height 3 when current height is 2. Height must be less than current height.');
    });

    it('should reject invalid height (equal to max)', async () => {
      mockBlockchainDb.blocksRepo.getMaxHeight.mockResolvedValue(1);

      await expect(rollbackManager.rollbackToHeight(1))
        .rejects.toThrow('Invalid rollback height. Cannot rollback to height 1 when current height is 0. Height must be less than current height.');
    });
  });

  describe('processTransaction', () => {
    it('should undo outputs (subtract from balances)', async () => {
      const transaction: TransactionType = {
        id: 'tx1',
        inputs: [],
        outputs: [
          { address: 'addr1', value: 100 },
          { address: 'addr2', value: 50 }
        ]
      };

      mockBlockchainDb.balanceRepo.get
        .mockResolvedValueOnce({ address: 'addr1', balance: 200 })
        .mockResolvedValueOnce({ address: 'addr2', balance: 100 });

      await rollbackManager.processTransaction(transaction);

      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('addr1', {
        balance: 100,
        address: 'addr1'
      });
      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('addr2', {
        balance: 50,
        address: 'addr2'
      });
    });

    it('should recreate inputs (add back to balances)', async () => {
      const transaction: TransactionType = {
        id: 'tx1',
        inputs: [
          { txId: 'prev_tx', index: 0 },
          { txId: 'prev_tx2', index: 1 }
        ],
        outputs: []
      };

      const prevTransaction1 = {
        id: 'prev_tx',
        inputs: [],
        outputs: [
          { address: 'addr1', value: 100 }
        ]
      };

      const prevTransaction2 = {
        id: 'prev_tx2',
        inputs: [],
        outputs: [
          { address: 'addr2', value: 50 },
          { address: 'addr3', value: 30 } 
        ]
      };

      mockBlockchainDb.transactionsRepo.get
        .mockResolvedValueOnce(prevTransaction1)
        .mockResolvedValueOnce(prevTransaction2);

      mockBlockchainDb.balanceRepo.get
        .mockResolvedValueOnce({ address: 'addr1', balance: 50 })
        .mockResolvedValueOnce({ address: 'addr3', balance: 80 }); 

      await rollbackManager.processTransaction(transaction);

      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('addr1', {
        balance: 150,
        address: 'addr1'
      });
      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('addr3', {
        balance: 110,
        address: 'addr3'
      });
    });

    it('should handle coinbase transactions (no inputs)', async () => {
      const transaction: TransactionType = {
        id: 'coinbase_tx',
        inputs: [],
        outputs: [{ address: 'miner', value: 50 }]
      };

      mockBlockchainDb.balanceRepo.get.mockResolvedValue({ address: 'miner', balance: 100 });

      await rollbackManager.processTransaction(transaction);

      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('miner', {
        balance: 50,
        address: 'miner'
      });
    });

    it('should handle transactions with no outputs', async () => {
      const transaction: TransactionType = {
        id: 'tx_no_outputs',
        inputs: [{ txId: 'prev_tx', index: 0 }],
        outputs: []
      };

      const prevTransaction = {
        id: 'prev_tx',
        inputs: [],
        outputs: [{ address: 'addr1', value: 100 }]
      };

      mockBlockchainDb.transactionsRepo.get.mockResolvedValue(prevTransaction);
      mockBlockchainDb.balanceRepo.get.mockResolvedValue({ address: 'addr1', balance: 50 });

      await rollbackManager.processTransaction(transaction);

      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('addr1', {
        balance: 150,
        address: 'addr1'
      });
    });
  });

  describe('updateBalance', () => {
    it('should update existing balance', async () => {
      mockBlockchainDb.balanceRepo.get.mockResolvedValue({ address: 'addr1', balance: 100 });

      await rollbackManager.updateBalance('addr1', 50);

      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('addr1', {
        balance: 150,
        address: 'addr1'
      });
    });

    it('should create new balance when address does not exist', async () => {
      mockBlockchainDb.balanceRepo.get.mockResolvedValue(null);

      await rollbackManager.updateBalance('new_addr', 100);

      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('new_addr', {
        balance: 100,
        address: 'new_addr'
      });
    });

    it('should handle negative balances', async () => {
      mockBlockchainDb.balanceRepo.get.mockResolvedValue({ address: 'addr1', balance: 100 });

      await rollbackManager.updateBalance('addr1', -150);

      expect(mockBlockchainDb.balanceRepo.set).toHaveBeenCalledWith('addr1', {
        balance: -50,
        address: 'addr1'
      });
    });
  });

  describe('BlockchainUtils inheritance', () => {
    it('should inherit BlockchainUtils methods', () => {
      const result = rollbackManager.getUtxoKey('tx123', 0);
      expect(result).toBe('tx123:0');
    });

    it('should have access to inherited methods', () => {
      const mockBlock = {
        id: '',
        height: 1,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      const hash = rollbackManager.getBlockHash(mockBlock);
      expect(hash).toBeTypeOf('string');
      expect(hash).toHaveLength(64);
    });
  });
});
