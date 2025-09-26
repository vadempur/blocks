import { AppDataSource } from "../../data-source";
import { Balance } from "../../entity/Balance";
import type { BalanceType } from "../../types";
import { Repository } from "../db.types";

export class BalanceRepo extends Repository<Balance> {
    constructor() {
        super(AppDataSource.getRepository(Balance));
    }

    async get(key: string): Promise<BalanceType | undefined> {
        return this.model.findOneBy({ address: key });
    }

    async set(key: string, value: BalanceType): Promise<void> {
        await this.model.save({ address: key, balance: value.balance });
        return;
    }

    async delete(key: string): Promise<void> {
        return this.model.delete({ address: key });
    }

    async count(): Promise<number> {
        return this.model.count();
      }
}
