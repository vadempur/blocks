
export interface Output {
  address: string;
  value: number;
}

export interface Input {
  id?: string;
  txId: string;
  index: number;
}

export interface TransactionType {
  id: string;
  inputs: Array<Input>;
  outputs: Array<Output>;
}

export interface BlockType {
  id: string;
  height: number;
  transactions: Array<TransactionType>;
}

export interface BalanceType {
    address: string;
    balance: number;
}

export interface UTXO {
    output: Output;
    txId: string;
    index: number;
}