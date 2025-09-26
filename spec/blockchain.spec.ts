import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UTXORepo } from '../src/db/repos/utxo.repo';
import { BalanceRepo } from '../src/db/repos/balance.repo';
import { BlocksRepo } from '../src/db/repos/blocks.repo';
import { TransactionRepo } from '../src/db/repos/transaction.repo';
import { Blockchain } from '../src/services/blockchain';
import { BalanceManager } from '../src/services/balance-manager';
import { BlockchainDB } from '../src/services/blockchain-db';
import { AppDataSource } from '../src/data-source';
import {
  createMockBlockchainDb,
  createMockBalanceManager,
  createGenesisBlock,
  createEmptyBlock,
  createBlockWithTransaction
} from './test-utils';
import type { BlockType, TransactionType } from '../src/types';

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

vi.mock('../src/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn().mockReturnValue({
      findOneBy: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      find: vi.fn().mockResolvedValue([])
    })
  }
}));

describe('Blockchain', () => {
  let blockchain: Blockchain;
  let mockBalanceManager: any;
  let mockBlockchainDb: any;

  beforeEach(() => {
    mockBalanceManager = createMockBalanceManager();

    const mockBlocksRepo = {
      count: vi.fn(),
      set: vi.fn(),
      getAll: vi.fn(),
      getMaxHeight: vi.fn(),
      getMaxHeightBlock: vi.fn(),
      delete: vi.fn()
    };

    const mockBalanceRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    };

    const mockUtxoRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    };

    const mockTransactionRepo = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn()
    };

    const mockInputRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
    };

    const mockOutputRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
    };

    mockBlockchainDb = createMockBlockchainDb(
      mockBlocksRepo,
      mockBalanceRepo,
      mockUtxoRepo,
      mockTransactionRepo,
      mockInputRepo,
      mockOutputRepo
    );

    blockchain = new Blockchain(
      new BlockchainDB(mockUtxoRepo, mockBalanceRepo, mockBlocksRepo, mockTransactionRepo, mockInputRepo, mockOutputRepo),
      mockBalanceManager
    );
  });

  describe('constructor', () => {
    it('should initialize all dependencies', () => {
      expect(blockchain.balanceManager).toBeDefined();
      expect(blockchain.rollbackManager).toBeDefined();
    });
  });

  describe('addBlock', () => {
    it('should add genesis block (height 1)', async () => {
      const genesisBlock: BlockType = {
        id: '23e0a20a761cffa8dcef36034d07029c149417df16527aacc18159c501dfa464',
        height: 1,
        transactions: [{
          id: 'genesis_tx',
          inputs: [],
          outputs: [{ address: 'addr1', value: 100 }]
        }]
      };

      let callCount = 0;
      mockBlockchainDb.blocksRepo.count.mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? 0 : 1);
      });
      mockBalanceManager.processTransaction.mockResolvedValue(undefined);
      mockBlockchainDb.blocksRepo.set.mockResolvedValue(1);

      const result = await blockchain.addBlock(genesisBlock);

      expect(mockBalanceManager.processTransaction).toHaveBeenCalledWith(genesisBlock.transactions[0]);
      expect(mockBlockchainDb.blocksRepo.set).toHaveBeenCalledWith('23e0a20a761cffa8dcef36034d07029c149417df16527aacc18159c501dfa464', genesisBlock);
      expect(result).toEqual(genesisBlock);
    });

    it('should validate block height for non-genesis blocks', async () => {
      const invalidBlock: BlockType = {
        id: 'e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683',
        height: 6,
        transactions: []
      };

      mockBlockchainDb.blocksRepo.count.mockImplementation(() => {
        console.log('blocksRepo.count called');
        return Promise.resolve(4);
      });

      await expect(blockchain.addBlock(invalidBlock))
        .rejects.toThrow('Invalid block height');
    });

    it('should validate transactions', async () => {
      const block: BlockType = {
        id: 'block_hash',
        height: 2,
        transactions: [{
          id: 'tx1',
          inputs: [{ txId: 'nonexistent', index: 0 }],
          outputs: [{ address: 'addr1', value: 100 }]
        }]
      };

      mockBlockchainDb.blocksRepo.count.mockResolvedValue(1);
      mockBlockchainDb.getUtxoItem.mockResolvedValue(null);

      await expect(blockchain.addBlock(block))
        .rejects.toThrow('Invalid transaction');
    });

    it('should validate block ID', async () => {
      const block: BlockType = {
        id: 'wrong_hash',
        height: 2,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      mockBlockchainDb.blocksRepo.count.mockResolvedValue(1);
      vi.spyOn(blockchain, 'getBlockHash').mockReturnValue('correct_hash');

      await expect(blockchain.addBlock(block))
        .rejects.toThrow('Invalid block id');
    });

    it.skip('should process regular block with valid transactions', async () => {
      const block: BlockType = {
        id: 'b68c0cfb1305c636d83f28b7c033e26a155aabf427ccb25ee6d551a139908192',
        height: 2,
        transactions: [{
          id: 'tx1',
          inputs: [],
          outputs: [{ address: 'addr1', value: 100 }]
        }]
      };

      mockBlockchainDb.blocksRepo.count.mockResolvedValue(1);
      mockBlockchainDb.blocksRepo.count.mockResolvedValueOnce(2);
      mockBalanceManager.processTransaction.mockResolvedValue(undefined);
      mockBlockchainDb.blocksRepo.set.mockResolvedValue(undefined);

      const result = await blockchain.addBlock(block);

      expect(mockBalanceManager.processTransaction).toHaveBeenCalledWith(block.transactions[0]);
      expect(mockBlockchainDb.blocksRepo.set).toHaveBeenCalledWith('b68c0cfb1305c636d83f28b7c033e26a155aabf427ccb25ee6d551a139908192', block);
      expect(result).toEqual(block);
    });
  });

  describe('validateHeight', () => {
    it('should return true for next valid height', async () => {
      mockBlockchainDb.blocksRepo.count.mockResolvedValue(1);

      const result = await blockchain.validateHeight(2);

      expect(result).toBe(true);
    });

    it('should return false for invalid height', async () => {
      mockBlockchainDb.blocksRepo.count.mockResolvedValue(1);

      const result = await blockchain.validateHeight(3);

      expect(result).toBe(false);
    });
  });

  describe('validateTransaction', () => {
    it('should validate coinbase transaction (no inputs)', async () => {
      const transaction: TransactionType = {
        id: 'tx1',
        inputs: [],
        outputs: [{ address: 'addr1', value: 100 }]
      };

      const result = await blockchain.validateTransaction(transaction);

      expect(result).toBe(true);
    });

    it('should validate transaction with valid inputs', async () => {
      const transaction: TransactionType = {
        id: 'tx1',
        inputs: [{ txId: 'prev_tx', index: 0 }],
        outputs: [{ address: 'addr1', value: 100 }]
      };

      mockBlockchainDb.utxoRepo.get.mockResolvedValue({
        txId: 'prev_tx',
        index: 0,
        output: { address: 'addr2', value: 100 }
      });

      const result = await blockchain.validateTransaction(transaction);

      expect(result).toBe(true);
    });

    it('should reject transaction with invalid input', async () => {
      const transaction: TransactionType = {
        id: 'tx1',
        inputs: [{ txId: 'nonexistent', index: 0 }],
        outputs: [{ address: 'addr1', value: 100 }]
      };

      mockBlockchainDb.utxoRepo.get.mockResolvedValue(null);

      const result = await blockchain.validateTransaction(transaction);

      expect(result).toBe(false);
    });

    it('should reject transaction with insufficient input amount', async () => {
      const transaction: TransactionType = {
        id: 'tx1',
        inputs: [{ txId: 'prev_tx', index: 0 }],
        outputs: [{ address: 'addr1', value: 150 }]
      };

      mockBlockchainDb.utxoRepo.get.mockResolvedValue({
        txId: 'prev_tx',
        index: 0,
        output: { address: 'addr2', value: 100 }
      });

      const result = await blockchain.validateTransaction(transaction);

      expect(result).toBe(false);
    });
  });

  describe('validateBlockId', () => {
    it('should validate correct block ID', () => {
      const block: BlockType = {
        id: 'correct_hash',
        height: 1,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      vi.spyOn(blockchain, 'getBlockHash').mockReturnValue('correct_hash');

      const result = blockchain.validateBlockId(block);

      expect(result).toBe(true);
    });

    it('should reject incorrect block ID', () => {
      const block: BlockType = {
        id: 'wrong_hash',
        height: 1,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      vi.spyOn(blockchain, 'getBlockHash').mockReturnValue('correct_hash');

      const result = blockchain.validateBlockId(block);

      expect(result).toBe(false);
    });
  });

  describe('addGenesisBlock', () => {
    it('should add genesis block when no blocks exist', async () => {
      const genesisBlock: BlockType = {
        id: '23e0a20a761cffa8dcef36034d07029c149417df16527aacc18159c501dfa464',
        height: 1,
        transactions: [{
          id: 'genesis_tx',
          inputs: [],
          outputs: [{ address: 'addr1', value: 100 }]
        }]
      };

      let callCount = 0;
      mockBlockchainDb.blocksRepo.count.mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? 0 : 1);
      });
      mockBalanceManager.processTransaction.mockResolvedValue(undefined);
      mockBlockchainDb.blocksRepo.set.mockResolvedValue(1);

      const result = await blockchain.addGenesisBlock(genesisBlock);

      expect(result).toEqual(genesisBlock);
    });

    it('should reject genesis block when blocks already exist', async () => {
      const genesisBlock: BlockType = {
        id: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
        height: 1,
        transactions: []
      };

      mockBlockchainDb.blocksRepo.count.mockResolvedValue(1);

      await expect(blockchain.addGenesisBlock(genesisBlock))
        .rejects.toThrow('Genesis block already exists');
    });
  });

  describe('getBalance', () => {
    it('should delegate to blockchain DB', async () => {
      mockBlockchainDb.balanceRepo.get.mockResolvedValue({
        address: 'addr1',
        balance: 100
      });

      const result = await blockchain.getBalance('addr1');

      expect(mockBlockchainDb.balanceRepo.get).toHaveBeenCalledWith('addr1');
      expect(result.balance).toBe(100);
    });
  });

  describe('getBlocksCount', () => {
    it('should return block count from repository', async () => {
      mockBlockchainDb.blocksRepo.count.mockResolvedValue(5);

      const result = await blockchain.getBlocksCount();

      expect(mockBlockchainDb.blocksRepo.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('getBlocks', () => {
    it('should return all blocks from repository', async () => {
      const mockBlocks = [
        { id: 'block1', height: 1, transactions: [] },
        { id: 'block2', height: 2, transactions: [] }
      ];

      mockBlockchainDb.blocksRepo.getAll.mockResolvedValue(mockBlocks);

      const result = await blockchain.getBlocks();

      expect(mockBlockchainDb.blocksRepo.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockBlocks);
    });
  });
});
