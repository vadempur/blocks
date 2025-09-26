import { AppDataSource } from "../../data-source";
import { Transaction } from "../../entity/Transaction";
import type { TransactionType }  from "../../types";
import { Repository } from "../db.types";

export class TransactionRepo extends Repository<TransactionType> {
    constructor() {
        super(AppDataSource.getRepository(Transaction));
    }

    async get(key: string): Promise<TransactionType | undefined> {
        const entity = await this.model.findOne({
          where: { id: key },
          relations: ['inputs', 'outputs']
        });
        if (!entity) return undefined;
        return {
          id: entity.id,
          inputs: entity.inputs || [],
          outputs: entity.outputs || []
        };
    }

    async set(key: string, value: TransactionType): Promise<void> {
        await this.model.save({ id: key, inputs: value.inputs, outputs: value.outputs   });
        return;
    }

    async delete(key: string): Promise<void> {
        return this.model.delete({ id: key });
    }

    async count(): Promise<number> {
        return this.model.count();
    }
}
