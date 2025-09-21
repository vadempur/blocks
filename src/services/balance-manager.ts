import type { Output, Input, Transaction, Block } from "../types";
import type {BlockchainDB} from "./blockchain-db";
import {BlockchainUtils} from "./blockchain-utils";


export class BalanceManager extends BlockchainUtils {


  constructor(private db:BlockchainDB) {
    super();
  }

  hydrate(genesisBlock: Block){
    genesisBlock.transactions.forEach((transaction) => {
      this.processTransaction(transaction);
    });
  }


  processTransaction(transaction: Transaction): void {
    console.log(`Processing transaction: ${transaction.id}`);

    if (transaction.inputs.length === 0) {
      // Coinbase transaction: only create outputs
      this.handleOutputs(transaction.id, transaction.outputs);
    } else {
      // Regular transaction: spend inputs and create outputs
      this.handleInputs(transaction.inputs);
      this.handleOutputs(transaction.id, transaction.outputs);
    }

    this.db.transactions.set(transaction.id, transaction);

  }

  private handleInputs(inputs: Input[]): void {
    for (const input of inputs) {
      this.spendInput(input);
    }
  }

  private handleOutputs(transactionId: string, outputs: Output[]): void {
    outputs.forEach((output, index) => {
      this.createOutput(transactionId, index, output);
    });
  }

  private spendInput(input: Input): void {
    const utxoKey = this.getUtxoKey(input.txId, input.index);
    const utxo = this.db.utxos.get(utxoKey);

    if (!utxo) {
      throw new Error(`Cannot spend input: UTXO ${utxoKey} not found`);
    }

    // Remove from UTXO set (mark as spent)
    this.db.utxos.delete(utxoKey);
    
    // Update balance: subtract value from the address that owned this UTXO
    this.updateBalance(utxo.output.address, -utxo.output.value);
    
    console.log(`Spent ${utxo.output.value} from ${utxo.output.address}`);
  }

  private createOutput(transactionId: string, index: number, output: Output): void {
    const utxoKey = this.getUtxoKey(transactionId, index);
    
    this.db.utxos.set(utxoKey, {
      output,
      txId: transactionId,
      index
    });
    
    this.updateBalance(output.address, output.value);
    
    console.log(`Created output: ${output.value} to ${output.address}`);
  }


  private updateBalance(address: string, delta: number): void {
    const currentBalance = this.db.balanceCache.get(address) || 0;
    const newBalance = currentBalance + delta;    
    this.db.balanceCache.set(address, newBalance);
  }

  getBalance(address: string): number {
    return this.db.balanceCache.get(address) || 0;
  }


  getUtxosForAddress(address: string): { txId: string; index: number; value: number }[] {
    const utxos: { txId: string; index: number; value: number }[] = [];
    
    for (const [key, utxo] of this.db.utxos) {
      if (utxo.output.address === address) {
        utxos.push({
          txId: utxo.txId,
          index: utxo.index,
          value: utxo.output.value
        });
      }
    }
    
    return utxos;
  }

 
  debugUtxos(): void {
    console.log('UTXO Set');
    for (const [key, utxo] of this.db.utxos) {
      console.log(`${key}: ${utxo.output.value} -> ${utxo.output.address}`);
    }
  }

  debugBalances(): void {
    console.log('Balances');
    for (const [address, balance] of this.db.balanceCache) {
      console.log(`${address}: ${balance}`);
    }
  }

}