import { AppDataSource } from "../../data-source";
import { Block } from "../../entity/Block";
import type { BlockType } from "../../types";
import { Repository } from "../db.types";

export class BlocksRepo extends Repository<BlockType> {
  constructor() {
    super(AppDataSource.getRepository(Block));
  }

  async get(key: string): Promise<BlockType | undefined> {
    return this.model.findOneBy({ id: key });
  }

  async set(key: string, value: BlockType): Promise<void> {
    return this.model.save({
      id: key,
      height: value.height,
      transactions: value.transactions,
    });
  }

  async delete(key: string): Promise<void> {
    return this.model.delete({ id: key });
  }

  async count(): Promise<number> {
    return this.model.count();
  }

  async getMaxHeightBlock(): Promise<BlockType | undefined> {
    const entity = await this.model
      .createQueryBuilder("block")
      .leftJoinAndSelect("block.transactions", "transactions")
      .leftJoinAndSelect("transactions.inputs", "inputs")
      .leftJoinAndSelect("transactions.outputs", "outputs")
      .orderBy("block.height", "DESC")
      .getOne();

    if (!entity) return undefined;

    return {
      id: entity.id,
      height: entity.height,
      transactions: entity.transactions.map((tx: any) => ({
        id: tx.id,
        inputs: tx.inputs.map((input: any) => ({
          txId: input.txId,
          index: input.index
        })),
        outputs: tx.outputs.map((output: any) => ({
          address: output.address,
          value: output.value
        }))
      }))
    };
  }

  async getMaxHeight(): Promise<number> {
    const block = await this.getMaxHeightBlock();
    return block ? block.height : 0;
  }

  async getAll(): Promise<BlockType[]> {
    const blocks = await this.model.find({
      relations: ['transactions', 'transactions.inputs', 'transactions.outputs']
    });

    return blocks.map((block: Block) => ({
      id: block.id,
      height: block.height,
      transactions: block.transactions.map((tx: any) => ({
        id: tx.id,
        inputs: tx.inputs.map((input: any) => ({
          txId: input.txId,
          index: input.index
        })),
        outputs: tx.outputs.map((output: any) => ({
          address: output.address,
          value: output.value
        }))
      }))
    }));
  }
}
