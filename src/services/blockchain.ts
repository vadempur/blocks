import type { Transaction, Block } from "../types";
import { createHash } from "crypto";
import { BalanceManager } from "./balance-manager";

const genesisBlock:Block = {
    id:"0",
    height:1,
    transactions:[{
        id:"tx1",
        inputs:[],
        outputs:[{
            address:"add-shashi",
            value:100
        }
    ]
    }]
}

export class Blockchain {
    static balanceManager = new BalanceManager();
    //add genesis block
    
    blocks: Block[] = [genesisBlock];
    balances = new Map<string, number>();

    constructor() {
        genesisBlock.transactions.forEach(transaction => {
            Blockchain.balanceManager.processTransaction(transaction)
        });
    }


    addBlock(block: Block) {
        console.log(block,"block")

        if (block.height === 1) {
           return this.addGenesisBlock(block);
        }

        if (!this.validateHeight(block.height)) {
            throw new Error("Invalid block height");
        }

        const validTransactions = block.transactions.map(transaction =>
            this.validateTransaction(transaction));

        const hasInvalidTransactions = validTransactions.some(result => !result);


        if (hasInvalidTransactions) {
            throw new Error("Invalid transaction");
        }

        if (!this.validateBlockId(block)) {
            throw new Error("Invalid block id");
        }

        block.transactions.forEach(transaction => {
            Blockchain.balanceManager.processTransaction(transaction)
        });

        this.blocks.push(block);
        console.log(Blockchain.balanceManager.balanceCache,"balanceCache")
        return {balance:Object.fromEntries(Blockchain.balanceManager.balanceCache),blocks:this.blocks };
        
    }

    validateHeight(height: number) {
        return height === this.blocks.length + 1;
    }

    validateTransaction(transaction: Transaction) {
        let inputAmount = 0;
        let outputAmount = 0;

        transaction.inputs.forEach(input => {
             const utxo = Blockchain.balanceManager.getUtxoItem(input.txId, input.index);

             if (!utxo) {
                throw new Error("Invalid input");
             }

             inputAmount += utxo.output.value;

        })

        transaction.outputs.forEach(output => {
            outputAmount += output.value;
        });

        return inputAmount === outputAmount;

    }

    getHash(block:Block){
      let key = block.height.toString();     
      block.transactions.forEach(transaction => {
        key += transaction.id;
      })
      return createHash('sha256').update(key).digest('hex');
    }

    validateBlockId(block:Block){
      return block.id === this.getHash(block);
    }

    addGenesisBlock(block:Block){
        block.height = 1;
        //this.blocks.length = 0; validate genesis block
        //validate sha256
        this.blocks.push(block);
    }
         
}




