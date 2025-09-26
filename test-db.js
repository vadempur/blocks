import { AppDataSource } from './src/data-source.ts';

async function testConnection() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection successful!');
    console.log('Database name:', AppDataSource.options.database);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
