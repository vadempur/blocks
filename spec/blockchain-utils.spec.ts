import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockchainUtils } from '../src/services/blockchain-utils';
import type { BlockType } from '../src/types';

describe('BlockchainUtils', () => {
  let utils: BlockchainUtils;

  beforeEach(() => {
    utils = new BlockchainUtils();
  });

  describe('getUtxoKey', () => {
    it('should generate correct UTXO key format', () => {
      const result = utils.getUtxoKey('tx123', 0);
      expect(result).toBe('tx123:0');
    });

    it('should handle different transaction IDs and indices', () => {
      expect(utils.getUtxoKey('genesis', 0)).toBe('genesis:0');
      expect(utils.getUtxoKey('tx456', 5)).toBe('tx456:5');
      expect(utils.getUtxoKey('abc123def', 10)).toBe('abc123def:10');
    });

    it('should throw error with empty transaction ID', () => {
      expect(() => utils.getUtxoKey('', 0)).toThrow('Transaction ID must be a non-empty string');
    });
  });

  describe('getHash', () => {
    it('should generate SHA256 hash for block', () => {
      const block: BlockType = {
        id: '',
        height: 1,
        transactions: [
          { id: 'tx1', inputs: [], outputs: [] }
        ]
      };

      const hash = utils.getBlockHash(block);
      expect(hash).toBeTypeOf('string');
      expect(hash).toHaveLength(64); 
    });

    it('should generate different hashes for different heights', () => {
      const block1: BlockType = {
        id: '',
        height: 1,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      const block2: BlockType = {
        id: '',
        height: 2,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      const hash1 = utils.getBlockHash(block1);
      const hash2 = utils.getBlockHash(block2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different transactions', () => {
      const block1: BlockType = {
        id: '',
        height: 1,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      const block2: BlockType = {
        id: '',
        height: 1,
        transactions: [{ id: 'tx2', inputs: [], outputs: [] }]
      };

      const hash1 = utils.getBlockHash(block1);
      const hash2 = utils.getBlockHash(block2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate same hash for identical blocks', () => {
      const block1: BlockType = {
        id: '',
        height: 1,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      const block2: BlockType = {
        id: '',
        height: 1,
        transactions: [{ id: 'tx1', inputs: [], outputs: [] }]
      };

      const hash1 = utils.getBlockHash(block1);
      const hash2 = utils.getBlockHash(block2);

      expect(hash1).toBe(hash2);
    });

    it('should handle multiple transactions', () => {
      const block: BlockType = {
        id: '',
        height: 1,
        transactions: [
          { id: 'tx1', inputs: [], outputs: [] },
          { id: 'tx2', inputs: [], outputs: [] },
          { id: 'tx3', inputs: [], outputs: [] }
        ]
      };

      const hash = utils.getBlockHash(block);
      expect(hash).toBeTypeOf('string');
      expect(hash).toHaveLength(64);
    });

    it('should handle empty transactions array', () => {
      const block: BlockType = {
        id: '',
        height: 1,
        transactions: []
      };

      const hash = utils.getBlockHash(block);
      expect(hash).toBeTypeOf('string');
      expect(hash).toHaveLength(64);
    });
  });
});
