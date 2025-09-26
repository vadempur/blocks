import type { TransactionType } from "../types";
import type { BlockchainDB } from "./blockchain-db";
import { BlockchainUtils } from "./blockchain-utils";
import {
  InvalidRollbackHeightError,
  RollbackBelowGenesisError,
} from "../errors";

export class RollbackManager extends BlockchainUtils {
  constructor(private db: BlockchainDB) {
    super();
  }

  async rollbackToHeight(height: number) {
    let maxHeight = await this.db.blocksRepo.getMaxHeight();

    if (height >= maxHeight) {
      throw new InvalidRollbackHeightError(height, maxHeight);
    }

    if (height < 1) {
      throw new RollbackBelowGenesisError();
    }

    while (maxHeight > height) {
      const block = await this.db.blocksRepo.getMaxHeightBlock();
      if (!block) break;

      for (const tx of block.transactions.reverse()) {
        await this.processTransaction(tx);
      }

      await this.db.blocksRepo.delete(block.id);

      maxHeight--;
    }
  }

  async processTransaction(transaction: TransactionType): Promise<void> {
    if (transaction.outputs && transaction.outputs.length > 0) {
      await Promise.all(
        transaction.outputs.map((output) =>
          this.updateBalance(output.address, -output.value)
        )
      );
    }

    if (transaction.inputs && transaction.inputs.length > 0) {
      for (const input of transaction.inputs) {
        const tx = await this.db.transactionsRepo.get(input.txId);
        if (!tx) throw new Error(`Transaction not found: ${input.txId}`);
        if (!tx.outputs || !tx.outputs[input.index]) {
          throw new Error(`Output not found: ${input.txId}:${input.index}`);
        }

        const output = tx.outputs[input.index];
        await this.updateBalance(output.address, output.value);

        await this.db.utxoRepo.set(this.getUtxoKey(input.txId, input.index), {
          output,
          txId: input.txId,
          index: input.index,
        });
      }
    }
  }

  async updateBalance(address: string, delta: number): Promise<void> {
    const record = await this.db.balanceRepo.get(address);
    const currentBalance = record ? record.balance : 0;
    const newBalance = currentBalance + delta;
    await this.db.balanceRepo.set(address, {
      balance: newBalance,
      address: address,
    });
  }
}
