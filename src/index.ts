import 'reflect-metadata';
import Fastify from 'fastify';
import { Pool } from 'pg';
import { createHash } from 'crypto';
import { Blockchain } from './services/blockchain';

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.post('/hash', async (request, reply) => {
  const block: any = request.body;
  return blockchain.getHash(block);
});


const blockchain = new Blockchain();



console.log(JSON.stringify(blockchain.blocks),"blockchain");


fastify.post('/blocks', async (request, reply) => {
  try {
    const block: any = request.body;
    blockchain.addBlock(block);
    console.log(blockchain.blocks,"addedblock");
    reply.header("Content-Type", "application/json");
    reply.send(blockchain);
  } catch (error) {
    reply.send(error);
  }
  
});

// async function testPostgres(pool: Pool) {
//   // const id = randomUUID();
//   const name = 'Satoshi';
//   const email = 'Nakamoto';

//   await pool.query(`DELETE FROM users;`);

//   await pool.query(`
//     INSERT INTO users (id, name, email)
//     VALUES ($1, $2, $3);
//   `, [id, name, email]);

//   const { rows } = await pool.query(`
//     SELECT * FROM users;
//   `);

//   console.log('USERS', rows);
// }

async function createTables(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    );
  `);
}

async function bootstrap() {
  console.log('Bootstrapping...');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  await createTables(pool);
  // await testPostgres(pool);
}

try {
  await bootstrap();
  await fastify.listen({
    port: 3000,
    host: '0.0.0.0'
  })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
};

function sha256(arg0: string) {
  throw new Error('Function not implemented.');
}
