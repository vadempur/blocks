export abstract class Repository<T>{
    constructor(protected model: any){}

    abstract get(key: string): Promise<T | undefined>;   

    abstract set(key: string, value: T): Promise<void>;

    abstract delete(key: string): Promise<void>;

    abstract count(): Promise<number>;
}
