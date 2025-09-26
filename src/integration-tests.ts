import { Blockchain } from "./services/blockchain";
import { AppDataSource } from "./data-source";
import { createHash } from "crypto";

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class IntegrationTester {
  private results: TestResult[] = [];
  private blockchain: Blockchain;

  constructor() {
    this.blockchain = new Blockchain();
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  async test(name: string, testFn: () => Promise<any>): Promise<void> {
    console.log(`🧪 Running: ${name}`);
    try {
      const result = await testFn();
      this.results.push({
        test: name,
        passed: true,
        details: result,
      });
      console.log(`✅ PASSED: ${name}`);
    } catch (error) {
      this.results.push({
        test: name,
        passed: false,
        error: this.getErrorMessage(error),
      });
      console.log(`❌ FAILED: ${name} - ${this.getErrorMessage(error)}`);
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting Integration Tests for Blockchain System\n");

    await this.testDatabaseConnection();
    await this.testGenesisBlock();
    await this.testMultipleBlocks();
    await this.testBalanceCalculations();
    await this.testRollbackToGenesis();
    await this.testRollbackToMiddle();
    await this.testInvalidOperations();
    await this.testEdgeCases();

    this.printSummary();
  }

  private printSummary(): void {
    console.log("\n📊 TEST SUMMARY");
    console.log("=".repeat(50));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log("❌ FAILED TESTS:");
      this.results
        .filter((r) => !r.passed)
        .forEach((result) => {
          console.log(`  - ${result.test}: ${result.error}`);
        });
    }

    console.log("\n" + "=".repeat(50));
  }

  private async testDatabaseConnection(): Promise<void> {
    await this.test("Database Connection", async () => {
      (AppDataSource as any).options.dropSchema = true;
      await AppDataSource.initialize();
      return { connected: true };
    });
  }

  private async testGenesisBlock(): Promise<void> {
    await this.test("Genesis Block Creation", async () => {
      const genesisTxId = "genesis_tx1";
      const genesisKey = "1" + genesisTxId;
      const genesisHash = createHash("sha256").update(genesisKey).digest("hex");

      const genesisBlock = {
        id: genesisHash,
        height: 1,
        transactions: [
          {
            id: genesisTxId,
            inputs: [],
            outputs: [{ address: "addr1", value: 100 }],
          },
        ],
      };

      await this.clearDatabase();

      const result = await this.blockchain.addBlock(genesisBlock);

      const blocks = await this.blockchain.getBlocks();
      if (blocks.length !== 1) {
        throw new Error(`Expected 1 block, got ${blocks.length}`);
      }

      const genesisBlockFromDb = blocks[0];
      if (genesisBlockFromDb.transactions.length !== 1) {
        throw new Error(
          `Expected 1 transaction, got ${genesisBlockFromDb.transactions.length}`
        );
      }

      return {
        blockCount: blocks.length,
        genesisTransaction: genesisBlockFromDb.transactions[0].id,
        genesisOutput: genesisBlockFromDb.transactions[0].outputs[0],
      };
    });
  }

  private async testMultipleBlocks(): Promise<void> {
    await this.test("Multiple Block Addition", async () => {
      const blocks = await this.blockchain.getBlocks();
      const genesisBlock = blocks[0];
      const genesisTxId = genesisBlock.transactions[0].id;

      const block2TxId = "tx2";
      const block2Key = "2" + block2TxId;
      const block2Hash = createHash("sha256").update(block2Key).digest("hex");

      const block2 = {
        id: block2Hash,
        height: 2,
        transactions: [
          {
            id: block2TxId,
            inputs: [{ txId: genesisTxId, index: 0 }],
            outputs: [
              { address: "addr2", value: 50 },
              { address: "addr3", value: 50 },
            ],
          },
        ],
      };

      await this.blockchain.addBlock(block2);

      const block3TxId = "tx3";
      const block3Key = "3" + block3TxId;
      const block3Hash = createHash("sha256").update(block3Key).digest("hex");

      const block3 = {
        id: block3Hash,
        height: 3,
        transactions: [
          {
            id: block3TxId,
            inputs: [{ txId: block2TxId, index: 1 }], 
            outputs: [
              { address: "addr4", value: 25 },
              { address: "addr5", value: 25 },
            ],
          },
        ],
      };

      await this.blockchain.addBlock(block3);

      const finalBlocks = await this.blockchain.getBlocks();
      if (finalBlocks.length !== 3) {
        throw new Error(`Expected 3 blocks, got ${finalBlocks.length}`);
      }

      return {
        blockCount: finalBlocks.length,
        heights: finalBlocks.map((b: { height: any }) => b.height),
        transactionCount: finalBlocks.reduce(
          (sum: any, b: { transactions: string | any[] }) =>
            sum + b.transactions.length,
          0
        ),
      };
    });
  }

  private async testBalanceCalculations(): Promise<void> {
    await this.test("Balance Calculations", async () => {
      const addr1Balance = await this.blockchain.getBalance("addr1");
      console.log(`addr1 balance: ${addr1Balance.balance}`);

      const addr2Balance = await this.blockchain.getBalance("addr2");
      console.log(`addr2 balance: ${addr2Balance.balance}`);

      const addr3Balance = await this.blockchain.getBalance("addr3");
      console.log(`addr3 balance: ${addr3Balance.balance}`);

      const addr4Balance = await this.blockchain.getBalance("addr4");
      console.log(`addr4 balance: ${addr4Balance.balance}`);

      const addr5Balance = await this.blockchain.getBalance("addr5");
      console.log(`addr5 balance: ${addr5Balance.balance}`);

      if (addr1Balance.balance !== 0) {
        throw new Error(
          `Expected addr1 balance 0, got ${addr1Balance.balance}`
        );
      }

      if (addr2Balance.balance !== 50) {
        throw new Error(
          `Expected addr2 balance 50, got ${addr2Balance.balance}`
        );
      }

      if (addr3Balance.balance !== 0) {
        throw new Error(
          `Expected addr3 balance 0, got ${addr3Balance.balance}`
        );
      }

      if (addr4Balance.balance !== 25) {
        throw new Error(
          `Expected addr4 balance 25, got ${addr4Balance.balance}`
        );
      }

      if (addr5Balance.balance !== 25) {
        throw new Error(
          `Expected addr5 balance 25, got ${addr5Balance.balance}`
        );
      }

      return {
        addr1: addr1Balance.balance,
        addr2: addr2Balance.balance,
        addr3: addr3Balance.balance,
        addr4: addr4Balance.balance,
        addr5: addr5Balance.balance,
      };
    });
  }

  private async testRollbackToGenesis(): Promise<void> {
    await this.test("Rollback to Genesis (Height 1)", async () => {
      const initialBlockCount = await this.blockchain.getBlocksCount();

      await this.blockchain.rollbackManager.rollbackToHeight(1);

      const finalBlockCount = await this.blockchain.getBlocksCount();
      if (finalBlockCount !== 1) {
        throw new Error(
          `Expected 1 block after rollback, got ${finalBlockCount}`
        );
      }

      const blocks = await this.blockchain.getBlocks();
      const genesisBlock = blocks[0];
      if (genesisBlock.height !== 1) {
        throw new Error(
          `Expected genesis block at height 1, got height ${genesisBlock.height}`
        );
      }

      return {
        initialBlocks: initialBlockCount,
        finalBlocks: finalBlockCount,
        genesisBlockHeight: genesisBlock.height,
      };
    });
  }

  private async testRollbackToMiddle(): Promise<void> {
    await this.test("Rollback to Middle Height", async () => {
      const blocks = await this.blockchain.getBlocks();
      const genesisBlock = blocks[0];
      const genesisTxId = genesisBlock.transactions[0].id;

      const block2TxId = "rollback_tx2";
      const block2Key = "2" + block2TxId;
      const block2Hash = createHash("sha256").update(block2Key).digest("hex");

      const block2 = {
        id: block2Hash,
        height: 2,
        transactions: [
          {
            id: block2TxId,
            inputs: [{ txId: genesisTxId, index: 0 }],
            outputs: [{ address: "rollback_addr", value: 100 }],
          },
        ],
      };

      await this.blockchain.addBlock(block2);
      const initialBlockCount = await this.blockchain.getBlocksCount();

      await this.blockchain.rollbackManager.rollbackToHeight(1);

      const finalBlockCount = await this.blockchain.getBlocksCount();
      if (finalBlockCount !== 1) {
        throw new Error(
          `Expected 1 block after rollback, got ${finalBlockCount}`
        );
      }

      return {
        initialBlocks: initialBlockCount,
        finalBlocks: finalBlockCount,
      };
    });
  }

  private async testInvalidOperations(): Promise<void> {
    await this.test("Invalid Operations Handling", async () => {
      const errors: string[] = [];

      try {
        const invalidBlock = {
          id: "invalid",
          height: 10,
          transactions: [],
        };
        await this.blockchain.addBlock(invalidBlock);
        errors.push("Should have rejected invalid height");
      } catch (error) {
        if (!this.getErrorMessage(error).includes("Invalid block height")) {
          errors.push(
            `Wrong error for invalid height: ${this.getErrorMessage(error)}`
          );
        }
      }

      try {
        await this.blockchain.rollbackManager.rollbackToHeight(10);
        errors.push("Should have rejected invalid rollback height");
      } catch (error) {
        if (!this.getErrorMessage(error).includes("Invalid rollback height")) {
          errors.push(
            `Wrong error for invalid rollback: ${this.getErrorMessage(error)}`
          );
        }
      }

      if (errors.length > 0) {
        throw new Error(`Invalid operations test failed: ${errors.join(", ")}`);
      }

      return { handledCorrectly: errors.length === 0 };
    });
  }

  private async testEdgeCases(): Promise<void> {
    await this.test("Edge Cases", async () => {
      try {
        await this.blockchain.rollbackManager.rollbackToHeight(1);
      } catch (error) {
        if (!this.getErrorMessage(error).includes("Invalid rollback height")) {
          throw error;
        }
      }

      try {
        await this.blockchain.rollbackManager.rollbackToHeight(999);
        throw new Error("Should have failed for invalid rollback height");
      } catch (error) {
        if (!this.getErrorMessage(error).includes("Invalid rollback height")) {
          throw error;
        }
      }

      return {
        rollbackAtTargetHeight: "handled",
        invalidRollbackHeight: "properly rejected",
      };
    });
  }

  private async clearDatabase(): Promise<void> {
    try {
      const currentBlockCount = await this.blockchain.getBlocksCount();
      console.log(
        `Clearing database: current block count = ${currentBlockCount}`
      );

      if (currentBlockCount > 1) {
        console.log("Rolling back to height 1...");
        await this.blockchain.rollbackManager.rollbackToHeight(1);
      } else if (currentBlockCount === 1) {
        const blocks = await this.blockchain.getBlocks();
        if (blocks.length === 1 && blocks[0].height === 1) {
          console.log("Already at genesis state, nothing to clear");
          return;
        }
      }

      const finalBlocks = await this.blockchain.getBlocks();
      const finalBlockCount = await this.blockchain.getBlocksCount();
      console.log(
        `After clearing: ${finalBlockCount} blocks, ${finalBlocks.length} blocks in array`
      );

      if (finalBlockCount !== 1) {
        console.log("Warning: Database may not be properly cleared");
      }
    } catch (error) {
      console.log("Database cleanup warning:", error);
    }
  }
}

export { IntegrationTester };

if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}
