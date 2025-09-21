import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres', // update as needed
  password: 'postgres', // update as needed
  database: 'blockchain', // update as needed
  synchronize: true,
  logging: false,
  entities: [__dirname + '/entity/*.ts'],
  migrations: [],
  subscribers: [],
});
