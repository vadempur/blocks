import type { Transaction, Block, Output } from "../types";
import { BalanceManager } from "./balance-manager";
import { BlockchainDB } from "./blockchain-db";
import { RollbackManager } from "./rollback-manger";
import { BlockchainUtils } from "./blockchain-utils";
import { blocks } from "../blocks.data";

const genesisBlock: Block = {
  id: "0",
  height: 1,
  transactions: [
    {
      id: "tx1",
      inputs: [],
      outputs: [
        {
          address: "add-shashi",
          value: 100,
        },
      ],
    },
  ],
};

export class Blockchain extends BlockchainUtils {
  private db: BlockchainDB;
  balanceManager: BalanceManager;
  rollbackManager: RollbackManager;

  constructor() {
    super();
    this.db = new BlockchainDB();
    this.balanceManager = new BalanceManager(this.db);
    this.rollbackManager = new RollbackManager(this.db);

    //genesis block hydration
    this.hydrateGenesisBlock();
    this.hydrateMockData();
  }

  hydrateGenesisBlock() {
    this.db.hydrate(genesisBlock);
    this.balanceManager.hydrate(genesisBlock);
  }

  hydrateMockData() {
    blocks.forEach((block) => this.addBlock(block));
  }

  getData() {
    return {
      balance: Object.fromEntries(this.db.balanceCache),
      blocks: this.db.blocks,
    };
  }

  addBlock(block: Block) {
    if (block.height === 1) {
      return this.addGenesisBlock(block);
    }

    if (!this.validateHeight(block.height)) {
      throw new Error("Invalid block height");
    }

    const validTransactions = block.transactions.map((transaction) =>
      this.validateTransaction(transaction)
    );

    const hasInvalidTransactions = validTransactions.some((result) => !result);

    if (hasInvalidTransactions) {
      throw new Error("Invalid transaction");
    }

    if (!this.validateBlockId(block)) {
      throw new Error("Invalid block id");
    }

    block.transactions.forEach((transaction) => {
      this.balanceManager.processTransaction(transaction);
    });

    this.db.blocks.push(block);
    return {
      blocks: this.db.blocks,
    };
  }

  validateHeight(height: number) {
    console.log(height, "height");

    return height === this.db.blocks.length + 1;
  }

  validateTransaction(transaction: Transaction) {
    let inputAmount = 0;
    let outputAmount = 0;

    transaction.inputs.forEach((input) => {
      const utxo = this.db.getUtxoItem(input.txId, input.index);

      if (!utxo) {
        throw new Error("Invalid input");
      }

      inputAmount += utxo.output.value;
    });

    transaction.outputs.forEach((output) => {
      outputAmount += output.value;
    });

    return inputAmount === outputAmount;
  }

  validateBlockId(block: Block) {
    return block.id === this.getHash(block);
  }

  addGenesisBlock(block: Block) {
    if (this.db.maxHeight) {
      throw new Error("Genesis block already exists");
    }

    if (!this.validateBlockId(block)) {
      throw new Error("Invalid block id");
    }

    block.transactions.forEach((transaction) => {
      this.balanceManager.processTransaction(transaction);
    });

    this.db.blocks.push(block);

    return {
      blocks: this.db.blocks,
    };
  }
}
