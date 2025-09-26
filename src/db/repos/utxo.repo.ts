import { AppDataSource } from "../../data-source";
import { Utxo } from "../../entity/Utxo";
import type { UTXO } from "../../types";
import { Repository } from "../db.types";

export class UTXORepo extends Repository<UTXO> {
  constructor() {
    super(AppDataSource.getRepository(Utxo));
  }

  async get(key: string): Promise<UTXO | undefined> {
    const entity = await this.model.findOneBy({ id: key });
    if (!entity) return undefined;
    return {
      txId: entity.txId,
      index: entity.index,
      output: { address: entity.address, value: entity.value },
    };
  }

  async set(key: string, value: UTXO): Promise<void> {
    await this.model.save({
      id: key,
      txId: value.txId,
      index: value.index,
      address: value.output.address,
      value: value.output.value,
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
