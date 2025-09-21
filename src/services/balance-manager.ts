import type { Output, Input, Transaction } from "../types";

/**
 * Specialized class for managing balances using UTXO (Unspent Transaction Output) model
 */
export class BalanceManager {
  // Tracks all unspent transaction outputs (key: 'txId:index')
  private utxoSet: Map<string, { output: Output; txId: string; index: number }> = new Map();
  
  // Cache for quick balance lookups (address -> balance)
   balanceCache: Map<string, number> = new Map();

  /**
   * Processes a transaction and updates UTXO set + balances
   */
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
  }

  /**
   * Handles spending inputs (removes from UTXO set, updates balances)
   */
  private handleInputs(inputs: Input[]): void {
    for (const input of inputs) {
      this.spendInput(input);
    }
  }

  /**
   * Handles creating outputs (adds to UTXO set, updates balances)
   */
  private handleOutputs(transactionId: string, outputs: Output[]): void {
    outputs.forEach((output, index) => {
      this.createOutput(transactionId, index, output);
    });
  }

  /**
   * Spends a specific input by removing it from UTXO set
   */
  private spendInput(input: Input): void {
    const utxoKey = this.getUtxoKey(input.txId, input.index);
    const utxo = this.utxoSet.get(utxoKey);

    if (!utxo) {
      throw new Error(`Cannot spend input: UTXO ${utxoKey} not found`);
    }

    // Remove from UTXO set (mark as spent)
    this.utxoSet.delete(utxoKey);
    
    // Update balance: subtract value from the address that owned this UTXO
    this.updateBalance(utxo.output.address, -utxo.output.value);
    
    console.log(`Spent ${utxo.output.value} from ${utxo.output.address}`);
  }

  /**
   * Creates a new output and adds it to UTXO set
   */
  private createOutput(transactionId: string, index: number, output: Output): void {
    const utxoKey = this.getUtxoKey(transactionId, index);
    
    // Add to UTXO set
    this.utxoSet.set(utxoKey, {
      output,
      txId: transactionId,
      index
    });
    
    // Update balance: add value to the recipient address
    this.updateBalance(output.address, output.value);
    
    console.log(`Created output: ${output.value} to ${output.address}`);
  }

  /**
   * Updates the balance for an address and maintains the cache
   */
  private updateBalance(address: string, delta: number): void {
    const currentBalance = this.balanceCache.get(address) || 0;
    const newBalance = currentBalance + delta;    
    this.balanceCache.set(address, newBalance);
  }

  getBalance(address: string): number {
    return this.balanceCache.get(address) || 0;
  }

  /**
   * Gets all UTXOs for a specific address (useful for building transactions)
   */
  getUtxosForAddress(address: string): { txId: string; index: number; value: number }[] {
    const utxos: { txId: string; index: number; value: number }[] = [];
    
    for (const [key, utxo] of this.utxoSet) {
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

  /**
   * Gets the total number of UTXOs in the system
   */
  getUtxoCount(): number {
    return this.utxoSet.size;
  }

  /**
   * Validates if an input can be spent (exists in UTXO set)
   */
  canSpendInput(txId: string, index: number): boolean {
    return this.utxoSet.has(this.getUtxoKey(txId, index));
  }

  /**
   * Helper method to generate UTXO key
   */
   getUtxoKey(txId: string, index: number): string {
    return `${txId}:${index}`;
  }

  /**
   * Rollback a transaction (reverse its effects)
   */
  rollbackTransaction(transaction: Transaction): void {
    console.log(`Rolling back transaction: ${transaction.id}`);
    
    // Reverse outputs first (remove them)
    transaction.outputs.forEach((_, index) => {
      this.rollbackOutput(transaction.id, index);
    });
    
    // Reverse inputs (add them back)
    transaction.inputs.forEach(input => {
      this.rollbackInput(input);
    });
  }

  /**
   * Rollback an output (remove it from UTXO set and subtract from balance)
   */
  private rollbackOutput(txId: string, index: number): void {
    const utxoKey = this.getUtxoKey(txId, index);
    const utxo = this.utxoSet.get(utxoKey);
    
    if (utxo) {
      this.utxoSet.delete(utxoKey);
      this.updateBalance(utxo.output.address, -utxo.output.value);
      console.log(`Rolled back output: ${utxo.output.value} from ${utxo.output.address}`);
    }
  }

  /**
   * Rollback an input (add it back to UTXO set and add to balance)
   */
  private rollbackInput(input: Input): void {
    // This would typically require storing spent UTXOs history
    // For now, we'll assume we have a way to get the original output data
    // In a real implementation, you'd need to store spent UTXOs temporarily
    console.warn('Input rollback requires additional spent UTXO history storage');
  }

 
  debugUtxos(): void {
    console.log('UTXO Set');
    for (const [key, utxo] of this.utxoSet) {
      console.log(`${key}: ${utxo.output.value} -> ${utxo.output.address}`);
    }
  }

  debugBalances(): void {
    console.log('Balances');
    for (const [address, balance] of this.balanceCache) {
      console.log(`${address}: ${balance}`);
    }
  }

  getUtxoItem(txId: string, index: number): { output: Output; txId: string; index: number } | undefined {
    return this.utxoSet.get(this.getUtxoKey(txId, index));
  }
}