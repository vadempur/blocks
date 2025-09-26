import type { Output, Input, TransactionType, BlockType } from "../types";
import type { BlockchainDB } from "./blockchain-db";
import { BlockchainUtils } from "./blockchain-utils";

export class BalanceManager extends BlockchainUtils {
  constructor(private db: BlockchainDB) {
    super();
  }

  hydrate(genesisBlock: BlockType) {
    genesisBlock.transactions.forEach((transaction) => {
      void this.processTransaction(transaction);
    });
  }

  async processTransaction(transaction: TransactionType): Promise<void> {
    if (transaction.inputs.length === 0) {
      await this.handleOutputs(transaction.id, transaction.outputs);
    } else {
      transaction.inputs.forEach((input, index) => {
        input.id = `${transaction.id}:${index}`;
      });
      await this.handleInputs(transaction.inputs);
      await this.handleOutputs(transaction.id, transaction.outputs);
    }

    await this.db.transactionsRepo.set(transaction.id, transaction);
  }

  private async handleInputs(inputs: Input[]): Promise<void> {
    for (const input of inputs) {
      await this.spendInput(input);
    }
  }

  private async handleOutputs(
    transactionId: string,
    outputs: Output[]
  ): Promise<void> {
    for (const [index, output] of outputs.entries()) {
      await this.createOutput(transactionId, index, output);
    }
  }

  private async spendInput(input: Input): Promise<void> {
    const utxoKey = this.getUtxoKey(input.txId, input.index);
    const utxo = await this.db.utxoRepo.get(utxoKey);

    if (!utxo) {
      throw new Error(`Cannot spend input: UTXO ${utxoKey} not found`);
    }

    await this.db.utxoRepo.delete(utxoKey);

    await this.updateBalance(utxo.output.address, -utxo.output.value);
  }

  private async createOutput(
    transactionId: string,
    index: number,
    output: Output
  ): Promise<void> {
    const utxoKey = this.getUtxoKey(transactionId, index);

    await this.db.utxoRepo.set(utxoKey, {
      output,
      txId: transactionId,
      index,
    });

    await this.updateBalance(output.address, output.value);
  }

  private async updateBalance(address: string, delta: number): Promise<void> {
    const record = await this.db.balanceRepo.get(address);
    const currentBalance = record ? record.balance : 0;
    const newBalance = currentBalance + delta;
    await this.db.balanceRepo.set(address, { balance: newBalance, address });
  }

  async getBalance(address: string): Promise<number> {
    const record = await this.db.balanceRepo.get(address);
    return record ? record.balance : 0;
  }
}
