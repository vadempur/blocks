import type { TransactionType, BlockType } from "../types";
import { BalanceManager } from "./balance-manager";
import { BlockchainDB } from "./blockchain-db";
import { RollbackManager } from "./rollback-manger";
import { BlockchainUtils } from "./blockchain-utils";
import {
  InvalidHeightError,
  InvalidTransactionSumError,
  GenesisBlockExistsError,
} from "../errors";

export class Blockchain extends BlockchainUtils {
  private db: BlockchainDB;
  balanceManager: BalanceManager;
  rollbackManager: RollbackManager;

  constructor(
    db?: BlockchainDB,
    balanceManager?: BalanceManager,
    rollbackManager?: RollbackManager
  ) {
    super();
    this.db = db || new BlockchainDB();
    this.balanceManager = balanceManager || new BalanceManager(this.db);
    this.rollbackManager = rollbackManager || new RollbackManager(this.db);

    //genesis block hydration
    // this.hydrateGenesisBlock();
    // this.hydrateMockData();
  }

  // hydrateGenesisBlock() {
  //   this.db.hydrate(genesisBlock);
  //   this.balanceManager.hydrate(genesisBlock);
  // }

  // hydrateMockData() {
  //   blocks.forEach((block) => this.addBlock(block));
  // }

  // getData() {
  //   return {
  //     // balance: Object.fromEntries(this.db.balanceCache),
  //     blocks: this.db.blocks,
  //   };
  // }

  async addBlock(block: BlockType) {
    if (block.height === 1) {
      return this.addGenesisBlock(block);
    }

    const currentHeight = await this.db.blocksRepo.count();
    if (block.height !== currentHeight + 1) {
      throw new InvalidHeightError(currentHeight + 1, block.height);
    }

    const validTransactions = await Promise.all(
      block.transactions.map((transaction) =>
        this.validateTransaction(transaction)
      )
    );

    const hasInvalidTransactions = validTransactions.some((result) => !result);

    if (hasInvalidTransactions) {
      for (const transaction of block.transactions) {
        const isValid = await this.validateTransaction(transaction);
        if (!isValid) {
          throw new InvalidTransactionSumError(transaction.id);
        }
      }
    }

    if (!this.validateBlockId(block)) {
      throw new Error("Invalid block id");
    }

    await Promise.all(
      block.transactions.map((transaction) =>
        this.balanceManager.processTransaction(transaction)
      )
    );

    const blocks = await this.db.blocksRepo.set(block.id, block);
    const latestBlock = await this.db.blocksRepo.getMaxHeightBlock();
    return latestBlock || block;
  }

  async validateHeight(height: number) {
    return height === (await this.db.blocksRepo.count()) + 1;
  }

  async validateTransaction(transaction: TransactionType) {
    let inputAmount = 0;
    let outputAmount = 0;

    if (transaction.inputs.length === 0) {
      return true;
    }

    for (const input of transaction.inputs) {
      const utxo = await this.db.getUtxoItem(input.txId, input.index);

      if (!utxo) {
        return false;
      }

      const inputValue =
        typeof utxo.output.value === "string"
          ? parseFloat(utxo.output.value)
          : utxo.output.value;
      inputAmount += inputValue;
    }

    transaction.outputs.forEach((output) => {
      outputAmount += output.value;
    });

    return inputAmount === outputAmount;
  }

  validateBlockId(block: BlockType) {
    return block.id === this.getBlockHash(block);
  }

  async addGenesisBlock(block: BlockType) {
    if ((await this.db.blocksRepo.count()) > 0) {
      throw new GenesisBlockExistsError();
    }

    if (!this.validateBlockId(block)) {
      throw new Error("Invalid block id");
    }

    await Promise.all(
      block.transactions.map((transaction) =>
        this.balanceManager.processTransaction(transaction)
      )
    );

    await this.db.blocksRepo.set(block.id, block);
    const latestBlock = await this.db.blocksRepo.getMaxHeightBlock();
    return latestBlock || block;
  }

  async getBalance(address: string) {
    return { balance: await this.db.getBalance(address) };
  }

  async getBlocksCount() {
    return this.db.blocksRepo.count();
  }

  async getBlocks() {
    return this.db.blocksRepo.getAll();
  }
}
