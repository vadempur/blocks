import { AppDataSource } from "../../data-source";
import { Output } from "../../entity/Output";
import type { Output as OutputType } from "../../types";
import { Repository } from "../db.types";

export class OutputRepo extends Repository<OutputType> {
  constructor() {
    super(AppDataSource.getRepository(Output));
  }

  async get(key: string): Promise<OutputType | undefined> {
    const entity = await this.model.findOneBy({ id: key });
    if (!entity) return undefined;
    return {
      address: entity.address,
      value: entity.value
    };
  }

  async set(key: string, value: OutputType): Promise<void> {
    await this.model.save({
      id: key,
      address: value.address,
      value: value.value
    });
    return;
  }

  async delete(key: string): Promise<void> {
    return this.model.delete({ id: key });
  }

  async getAllByTransactionId(transactionId: string): Promise<OutputType[]> {
    const entities = await this.model.find({
      where: { transactionId: transactionId } as any
    });
    return entities.map((entity: any) => ({
      address: entity.address,
      value: entity.value
    }));
  }

  async getByTransactionAndAddress(transactionId: string, address: string): Promise<OutputType & { id: string } | undefined> {
    const entity = await this.model.findOne({
      where: { transactionId: transactionId, address: address } as any
    });
    if (!entity) return undefined;
    return {
      id: entity.id,
      address: entity.address,
      value: entity.value
    };
  }

  async count(): Promise<number> {
    return this.model.count();
  }
}
