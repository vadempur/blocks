import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UTXORepo } from '../src/db/repos/utxo.repo';
import { AppDataSource } from '../src/data-source';
import type { UTXO } from '../src/types';

vi.mock('../src/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn()
  }
}));

vi.mock('typeorm', () => ({
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

describe('UTXORepo', () => {
  let utxoRepo: UTXORepo;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findOneBy: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    };

    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepository);

    utxoRepo = new UTXORepo();
  });

  describe('get', () => {
    it('should return UTXO when found', async () => {
      const mockEntity = {
        txId: 'tx123',
        index: 0,
        address: 'addr1',
        value: 100
      };

      const expectedUTXO: UTXO = {
        txId: 'tx123',
        index: 0,
        output: { address: 'addr1', value: 100 }
      };

      mockRepository.findOneBy.mockResolvedValue(mockEntity);

      const result = await utxoRepo.get('tx123:0');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'tx123:0' });
      expect(result).toEqual(expectedUTXO);
    });

    it('should return undefined when UTXO not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await utxoRepo.get('nonexistent:0');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'nonexistent:0' });
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should save UTXO with flattened output data', async () => {
      const utxo: UTXO = {
        txId: 'tx123',
        index: 0,
        output: { address: 'addr1', value: 100 }
      };

      mockRepository.save.mockResolvedValue(utxo);

      await utxoRepo.set('tx123:0', utxo);

      expect(mockRepository.save).toHaveBeenCalledWith({
        id: 'tx123:0',
        txId: 'tx123',
        index: 0,
        address: 'addr1',
        value: 100
      });
    });

    it('should handle save errors', async () => {
      const utxo: UTXO = {
        txId: 'tx123',
        index: 0,
        output: { address: 'addr1', value: 100 }
      };

      const error = new Error('Save failed');
      mockRepository.save.mockRejectedValue(error);

      await expect(utxoRepo.set('tx123:0', utxo)).rejects.toThrow('Save failed');
    });
  });

  describe('delete', () => {
    it('should delete UTXO by key', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await utxoRepo.delete('tx123:0');

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 'tx123:0' });
    });
  });

  describe('count', () => {
    it('should return total count of UTXO records', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await utxoRepo.count();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });

  describe('UTXO transformation', () => {
    it('should correctly transform database entity to UTXO format', async () => {
      const mockEntity = {
        txId: 'tx123',
        index: 0,
        address: 'addr1',
        value: 100
      };

      mockRepository.findOneBy.mockResolvedValue(mockEntity);

      const result = await utxoRepo.get('tx123:0');

      const expected: UTXO = {
        txId: 'tx123',
        index: 0,
        output: { address: 'addr1', value: 100 }
      };

      expect(result).toEqual(expected);
    });

    it('should handle null database entity', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await utxoRepo.get('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('constructor', () => {
    it('should initialize with correct repository', () => {
      expect(AppDataSource.getRepository).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
