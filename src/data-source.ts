import { DataSource } from 'typeorm';
import { Balance } from './entity/Balance';
import { Transaction as TxEntity } from './entity/Transaction';
import { Output } from './entity/Output';
import { Input } from './entity/Input';
import { Block } from './entity/Block';
import { Utxo } from './entity/Utxo';

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

let databaseConfig;

if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  databaseConfig = {
    url: process.env.DATABASE_URL,
    type: 'postgres' as const,
    synchronize: true,
    dropSchema: false,
    logging: true,
    entities: [Balance, TxEntity, Output, Input, Block, Utxo],
    migrations: [],
    subscribers: [],
  };
} else {
  console.log('Using individual environment variables for connection');
  databaseConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
    database: process.env.DB_NAME || 'mydatabase',
    synchronize: true,
    dropSchema: false,
    logging: true,
    entities: [Balance, TxEntity, Output, Input, Block, Utxo],
    migrations: [],
    subscribers: [],
  };
}

console.log('Database config object:', JSON.stringify(databaseConfig, null, 2));

export const AppDataSource = new DataSource(databaseConfig);
