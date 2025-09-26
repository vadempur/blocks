import "reflect-metadata";
import Fastify from "fastify";
import { Blockchain } from "./services/blockchain";
import { AppDataSource } from "./data-source";
import { ValidationError } from "./errors";
import type { BlockType } from "./types";
import { postBlockSchema } from "./validations/post-block";
import { postRollbackSchema } from "./validations/post-rollback";
import { getBalanceSchema } from "./validations/get-balance";

const fastify = Fastify({ logger: true });

let blockchain: Blockchain;

fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof ValidationError) {
    reply.status(400).send({ error: error.message });
  } else {
    reply.status(500).send({ error: "Internal server error" });
  }
});

fastify.get("/", async (request, reply) => {
  try {
    const blocks = await blockchain.getBlocks();
    return reply.send({ blocks });
  } catch (error) {
    throw error;
  }
});

fastify.post("/hash", async (request, reply) => {
  try {
    const block: BlockType = request.body as BlockType;
    return blockchain.getBlockHash(block);
  } catch (error) {
    throw error;
  }
});

fastify.post(
  "/blocks",
  {
    schema: {
      body: postBlockSchema,
    },
  },
  async (request, reply) => {
    try {
      const block: BlockType = request.body as BlockType;
      const latestBlock = await blockchain.addBlock(block);
      reply.send({ success: true, block: latestBlock });
    } catch (error) {
      throw error;
    }
  }
);

fastify.post(
  "/rollback",
  {
    schema: {
      body: postRollbackSchema,
    },
  },
  async (request, reply) => {
    try {
      const { height } = request.body as { height: number };
      await blockchain.rollbackManager.rollbackToHeight(height);
      reply.header("Content-Type", "application/json");
      reply.send({ success: true });
    } catch (error) {
      throw error;
    }
  }
);

fastify.get(
  "/balances/:address",
  {
    schema: {
      params: getBalanceSchema,
    },
  },
  async (request, reply) => {
    try {
      const { address } = request.params as { address: string };
      const balance = await blockchain.getBalance(address);
      reply.header("Content-Type", "application/json");
      reply.send(balance);
    } catch (error) {
      throw error;
    }
  }
);

async function bootstrap() {
  console.log("Bootstrapping...");
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await AppDataSource.initialize();
      console.log("Database connected successfully");
      break;
    } catch (error) {
      retries++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log(
        `Database connection failed (attempt ${retries}/${maxRetries}):`,
        errorMessage
      );

      if (retries === maxRetries) {
        console.error("Max retries reached. Exiting...");
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  blockchain = new Blockchain();
}

try {
  await bootstrap();
  await fastify.listen({
    port: 3000,
    host: "0.0.0.0",
  });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
