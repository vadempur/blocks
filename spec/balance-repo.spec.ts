import { describe, it, expect, beforeEach, vi } from "vitest";
import { BalanceRepo } from "../src/db/repos/balance.repo";
import { AppDataSource } from "../src/data-source";

vi.mock("../src/data-source", () => ({
  AppDataSource: {
    getRepository: vi.fn()
  },
}));

vi.mock("typeorm", () => ({
  Entity: vi.fn(),
  PrimaryColumn: vi.fn(),
  Column: vi.fn((type?: any) => vi.fn()),
  ManyToOne: vi.fn(),
  OneToMany: vi.fn(),
  ManyToMany: vi.fn(),
  JoinColumn: vi.fn(),
  OneToOne: vi.fn(),
  CreateDateColumn: vi.fn(),
  UpdateDateColumn: vi.fn(),
  VersionColumn: vi.fn(),
  Index: vi.fn(),
  Unique: vi.fn(),
  Check: vi.fn(),
  Exclusion: vi.fn(),
  Generated: vi.fn(),
  ObjectIdColumn: vi.fn(),
  BaseEntity: vi.fn(),
  Repository: vi.fn(),
  DataSource: vi.fn(),
  PrimaryGeneratedColumn: vi.fn(),
  ObjectId: vi.fn(),
  ColumnTypes: {
    VARCHAR: 'varchar',
    INT: 'int',
    FLOAT: 'float',
    TEXT: 'text',
    BOOLEAN: 'boolean',
    TIMESTAMP: 'timestamp',
    DATE: 'date'
  },
  __decorate: vi.fn(),
  __metadata: vi.fn(),
  Reflect: {
    getMetadata: vi.fn(),
    defineMetadata: vi.fn(),
    hasMetadata: vi.fn(),
    hasOwnMetadata: vi.fn(),
    getOwnMetadata: vi.fn(),
    getOwnMetadataKeys: vi.fn(),
    deleteMetadata: vi.fn(),
    metadata: vi.fn()
  }
}));

describe("BalanceRepo", () => {
  let balanceRepo: BalanceRepo;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findOneBy: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepository);

    balanceRepo = new BalanceRepo();
  });

  describe("get", () => {
    it("should return balance record when found", async () => {
      const mockBalance = {
        address: "addr1",
        balance: 100,
      };

      mockRepository.findOneBy.mockResolvedValue(mockBalance);

      const result = await balanceRepo.get("addr1");

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        address: "addr1",
      });
      expect(result).toEqual(mockBalance);
    });

    it("should return null when balance not found", async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await balanceRepo.get("nonexistent");

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        address: "nonexistent",
      });
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should save balance record", async () => {
      const balanceData = {
        address: "addr1",
        balance: 100,
      };

      mockRepository.save.mockResolvedValue(balanceData);

      await balanceRepo.set("addr1", balanceData);

      expect(mockRepository.save).toHaveBeenCalledWith({
        address: "addr1",
        balance: 100,
      });
    });

    it("should handle save errors", async () => {
      const balanceData = {
        address: "addr1",
        balance: 100,
      };

      const error = new Error("Save failed");
      mockRepository.save.mockRejectedValue(error);

      await expect(balanceRepo.set("addr1", balanceData)).rejects.toThrow(
        "Save failed"
      );
    });
  });

  describe("delete", () => {
    it("should delete balance record", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await balanceRepo.delete("addr1");

      expect(mockRepository.delete).toHaveBeenCalledWith({ address: "addr1" });
    });
  });

  describe("count", () => {
    it("should return total count of balance records", async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await balanceRepo.count();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe("constructor", () => {
    it("should initialize with correct repository", () => {
      expect(AppDataSource.getRepository).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });
});
