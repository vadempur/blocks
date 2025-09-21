import type { Block } from "../types";
import { createHash } from "crypto";

export class BlockchainUtils {
  getUtxoKey(txId: string, index: number): string {
    return `${txId}:${index}`;
  }

  getHash(block: Block) {
    let key = block.height.toString();
    block.transactions.forEach((transaction) => {
      key += transaction.id;
    });

    return createHash("sha256").update(key).digest("hex");
  }
}
