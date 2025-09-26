import { AppDataSource } from "../../data-source";
import { Input } from "../../entity/Input";
import type { Input as InputType } from "../../types";
import { Repository } from "../db.types";

export class InputRepo extends Repository<InputType> {
  constructor() {
    super(AppDataSource.getRepository(Input));
  }

  async get(key: string): Promise<InputType | undefined> {
    const entity = await this.model.findOneBy({ id: key });
    if (!entity) return undefined;
    return {
      id: entity.id,
      txId: entity.txId,
      index: entity.index
    };
  }

  async set(key: string, value: InputType): Promise<void> {
    await this.model.save({
      id: key,
      txId: value.txId,
      index: value.index
    });
    return;
  }

  async delete(key: string): Promise<void> {
    return this.model.delete({ id: key });
  }

  async count(): Promise<number> {
    return this.model.count();
  }
}
