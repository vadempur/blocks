import type { BlockType, Output, TransactionType, UTXO } from "../types";
import { BlockchainUtils } from "./blockchain-utils";
import { UTXORepo } from "../db/repos/utxo.repo";
import { BalanceRepo } from "../db/repos/balance.repo";
import { BlocksRepo } from "../db/repos/blocks.repo";
import { TransactionRepo } from "../db/repos/transaction.repo";
import { InputRepo } from "../db/repos/input.repo";
import { OutputRepo } from "../db/repos/output.repo";

export class BlockchainDB extends BlockchainUtils {
  readonly utxoRepo;
  readonly balanceRepo;
  readonly blocksRepo;
  readonly transactionsRepo;
  readonly inputRepo;
  readonly outputRepo;

  // blocks: BlockType[];

  constructor(
    utxoRepo?: any,
    balanceRepo?: any,
    blocksRepo?: any,
    transactionsRepo?: any,
    inputRepo?: any,
    outputRepo?: any
  ) {
    super();
    this.utxoRepo = utxoRepo !== undefined ? utxoRepo : new UTXORepo();
    this.balanceRepo =
      balanceRepo !== undefined ? balanceRepo : new BalanceRepo();
    this.blocksRepo = blocksRepo !== undefined ? blocksRepo : new BlocksRepo();
    this.transactionsRepo =
      transactionsRepo !== undefined ? transactionsRepo : new TransactionRepo();
    this.inputRepo = inputRepo !== undefined ? inputRepo : new InputRepo();
    this.outputRepo = outputRepo !== undefined ? outputRepo : new OutputRepo();
  }

  // hydrate(genesisBlock: BlockType){
  //     this.blocks = [genesisBlock];
  // }

  async maxHeight(): Promise<number> {
    return await this.blocksRepo.count();
  }

  async getUtxoItem(txId: string, index: number): Promise<UTXO | undefined> {
    return this.utxoRepo.get(this.getUtxoKey(txId, index));
  }

  async getBalance(address: string): Promise<number | undefined> {
    const balance = await this.balanceRepo.get(address);
    return balance ? balance.balance : 0;
  }
}
