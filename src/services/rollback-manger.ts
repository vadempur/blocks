import type { Output, Transaction } from "../types";
import type {BlockchainDB} from "./blockchain-db";
import {BlockchainUtils} from "./blockchain-utils";

export class RollbackManager extends BlockchainUtils {
  constructor(private db: BlockchainDB) {
    super();
  }

  rollbackToHeight(height: number) {
    if (height >= this.db.maxHeight) {
      throw new Error("Invalid height");
    }

    while (this.db.maxHeight > height) {
      const block = this.db.blocks.pop();
      block!.transactions.forEach((transaction) => {
        this.processTransaction(transaction);
      });
    }
  }

  processTransaction(transaction: Transaction): void {
    transaction.outputs.forEach((output, index) => {
      this.updateBalance(output.address, -output.value);
      this.db.utxoSet.delete(this.getUtxoKey(transaction.id, index));
    });

    transaction.inputs.forEach((input) => {
      const tx = this.db.transactions.get(input.txId);
      const output = tx!.outputs[input.index];
      this.updateBalance(output.address, output.value);
      this.db.utxoSet.set(this.getUtxoKey(input.txId, input.index), {
        output,
        txId: input.txId,
        index: input.index,
      });
    });

    this.db.transactions.delete(transaction.id);
  }

  updateBalance(address: string, delta: number): void {
    const currentBalance = this.db.balanceCache.get(address) || 0;
    const newBalance = currentBalance + delta;
    this.db.balanceCache.set(address, newBalance);
  }
}

