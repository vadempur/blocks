import type { BlockType } from "../types";
import { createHash } from "crypto";

export class BlockchainUtils {
  getUtxoKey(txId: string, index: number): string {
    if (!txId || typeof txId !== 'string') {
      throw new Error('Transaction ID must be a non-empty string');
    }
    if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index must be a non-negative integer');
    }
    return `${txId}:${index}`;
  }

  getBlockHash(block: BlockType): string {
    if (!block || !Array.isArray(block.transactions)) {
      throw new Error('Invalid block provided');
    }

    let key = block.height.toString();
    block.transactions.forEach((transaction) => {
      key += transaction.id;
    });

    return createHash("sha256").update(key).digest("hex");
  }

  validateBlockId(block: BlockType): boolean {
    if (!block || !block.id) {
      return false;
    }
    try {
      const calculatedHash = this.getBlockHash(block);
      return block.id === calculatedHash;
    } catch (error) {
      console.error('Error validating block ID:', error);
      return false;
    }
  }
}
