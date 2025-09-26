import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { expect } from 'vitest';

export const typeOrmMock = {
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
};

export const createTypeOrmMock = () => typeOrmMock;

export const createMockBlocksRepo = () => ({
  count: vi.fn(),
  set: vi.fn(),
  getAll: vi.fn(),
  getMaxHeight: vi.fn(),
  getMaxHeightBlock: vi.fn(),
  delete: vi.fn()
});

export const createMockBalanceRepo = () => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  count: vi.fn()
});

export const createMockUtxoRepo = () => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  count: vi.fn()
});

export const createMockTransactionRepo = () => ({
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn()
});

export const createMockInputRepo = () => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn()
});

export const createMockOutputRepo = () => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn()
});

export const createMockBlockchainDb = (
  blocksRepo = createMockBlocksRepo(),
  balanceRepo = createMockBalanceRepo(),
  utxoRepo = createMockUtxoRepo(),
  transactionRepo = createMockTransactionRepo(),
  inputRepo = createMockInputRepo(),
  outputRepo = createMockOutputRepo()
) => ({
  blocksRepo,
  balanceRepo,
  utxoRepo,
  transactionsRepo: transactionRepo,
  inputRepo,
  outputRepo,
  maxHeight: vi.fn(),
  getBalance: vi.fn(),
  getUtxoItem: vi.fn(),
  getUtxoKey: vi.fn((txId: string, index: number) => `${txId}:${index}`),
});

export const createMockBalanceManager = () => ({
  processTransaction: vi.fn()
});

export const createMockTransaction = (id: string, inputs: any[] = [], outputs: any[] = []) => ({
  id,
  inputs,
  outputs
});

export const createMockBlock = (height: number, transactions: any[] = []) => ({
  id: '',
  height,
  transactions
});

export const createMockUtxo = (txId: string, index: number, address: string, value: number) => ({
  txId,
  index,
  output: { address, value }
});

export const createGenesisBlock = () => ({
  id: '23e0a20a761cffa8dcef36034d07029c149417df16527aacc18159c501dfa464',
  height: 1,
  transactions: [createMockTransaction('genesis_tx', [], [{ address: 'addr1', value: 100 }])]
});

export const createEmptyBlock = (height: number) => ({
  id: '',
  height,
  transactions: []
});

export const createBlockWithTransaction = (height: number, txId: string) => ({
  id: '',
  height,
  transactions: [createMockTransaction(txId, [], [{ address: 'addr1', value: 100 }])]
});

export const createMultipleUtxos = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    txId: `tx${i}`,
    index: i,
    output: { address: `addr${i}`, value: 100 }
  }));
};

export const createMultipleTransactions = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `tx${i}`,
    inputs: [],
    outputs: [{ address: `addr${i}`, value: 100 }]
  }));
};

export const expectUtxoKey = (result: string, txId: string, index: number) => {
  expect(result).toBe(`${txId}:${index}`);
};

export const expectHashLength = (hash: string) => {
  expect(hash).toBeTypeOf('string');
  expect(hash).toHaveLength(64);
};

export const expectBalanceUpdate = (mockRepo: any, address: string, expectedBalance: number) => {
  expect(mockRepo.set).toHaveBeenCalledWith(address, {
    balance: expectedBalance,
    address
  });
};
