import type { Block, Output, Transaction } from "../types";
import {BlockchainUtils} from "./blockchain-utils";

export class BlockchainDB  extends BlockchainUtils {
    utxoSet: Map<string, { output: Output; txId: string; index: number }>;

    balanceCache: Map<string, number>;

    transactions: Map<string, Transaction>;

    blocks: Block[];

    balances = new Map<string, number>();

    constructor() {
        super();
        this.utxoSet = new Map();
        this.balanceCache = new Map();
        this.transactions = new Map();
        this.balances = new Map<string, number>();
        this.blocks = [];
        
    }

    hydrate(genesisBlock: Block){
        this.blocks = [genesisBlock];
    }

    get maxHeight(){
        return this.blocks.length;
    }

    getUtxoItem(txId: string, index: number): { output: Output; txId: string; index: number } | undefined {
        return this.utxoSet.get(this.getUtxoKey(txId, index));
      }

}

