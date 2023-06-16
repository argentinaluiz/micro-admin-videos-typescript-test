import { UnitOfWorkSequelize } from "./../unit-of-work-sequelize";
describe("UnitOfWorkSequelize Unit Tests", () => {
  const mockSequelize = {
    transaction: jest.fn(),
  };

  test("validateTransaction", async () => {
    const uow = new UnitOfWorkSequelize(
      { get: async () => {} },
      mockSequelize as any
    );
    expect(() => uow["validateTransaction"]()).toThrowError(
      "No transaction started"
    );
  });

  describe("start method", () => {
    it("should not start a transaction", async () => {
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      //@ts-expect-error - private property
      uow["transaction"] = {};
      await uow.start();
      expect(mockSequelize.transaction).not.toHaveBeenCalled();
    });

    it("should start a transaction", async () => {
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      await uow.start();
      expect(mockSequelize.transaction).toHaveBeenCalled();
    });
  });

  describe("commit method", () => {
    it("should throw an error if no transaction", async () => {
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      await expect(uow.commit()).rejects.toThrowError("No transaction started");
    });
    it("should commit a transaction", async () => {
      const mockTransaction = {
        commit: jest.fn(),
      };
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      //@ts-expect-error - private property
      uow["transaction"] = mockTransaction;
      await uow.commit();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe("rollback method", () => {
    it("should throw an error if no transaction", async () => {
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      await expect(uow.rollback()).rejects.toThrowError(
        "No transaction started"
      );
    });
    it("should rollback a transaction", async () => {
      const mockTransaction = {
        rollback: jest.fn(),
      };
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      //@ts-expect-error - private property
      uow["transaction"] = mockTransaction;
      await uow.rollback();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("getRepository method", () => {
    it("should throw an error if transaction is not defined", async () => {
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      await expect(() => uow.getRepository("repoName")).rejects.toThrowError(
        "No transaction started"
      );
    });
    it("should throw an error if no repository found", async () => {
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );
      //@ts-expect-error - private property
      uow["transaction"] = "fake";
      await expect(() => uow.getRepository("repoName")).rejects.toThrowError(
        "Repository repoName not found"
      );
    });
    it("should return a repository", async () => {
      const mockRepository = {
        setUnitOfWork: jest.fn(),
      };
      const mockContext = {
        get: jest.fn(async () => mockRepository),
      };
      const uow = new UnitOfWorkSequelize(mockContext, mockSequelize as any);
      //@ts-expect-error - private property
      uow["transaction"] = "fake";
      let repo = await uow.getRepository("repoName");
      expect(repo).toEqual(mockRepository);
      expect(mockContext.get).toHaveBeenCalledWith("repoName");
      expect(mockRepository.setUnitOfWork).toHaveBeenCalledWith(uow);
    });
  });

  describe("do method", () => {
    it("should commit a transaction using sequelize.transaction", async () => {
      mockSequelize.transaction = jest.fn((callback) => callback('fake transaction'));
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );

      const result = await uow.do(async (_uow) => {
        expect(uow).toEqual(_uow);
        expect(uow["transaction"]).toEqual("fake transaction");
        return "result";
      });
      expect(uow["transaction"]).toBeNull();
      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(result).toEqual("result");
    });

    it("should commit a transaction without sequelize.transaction", async () => {
      expect.assertions(5);
      mockSequelize.transaction = jest.fn((callback) => callback('another transaction'));
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );

      //@ts-expect-error - private property
      uow["transaction"] = "fake transaction";

      const result = await uow.do(async (_uow) => {
        expect(uow).toEqual(_uow);
        expect(uow["transaction"]).toEqual("fake transaction");
        return "result";
      });
      expect(uow["transaction"]).toBeNull();
      expect(mockSequelize.transaction).not.toHaveBeenCalled();
      expect(result).toEqual("result");
    });

    it("should rollback a transaction using sequelize.transaction", async () => {
      expect.assertions(5);
      mockSequelize.transaction = jest.fn((callback) => callback('fake transaction'));
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );

      try {
        await uow.do(async (_uow) => {
          expect(uow).toEqual(_uow);
          expect(uow["transaction"]).toEqual("fake transaction");
          throw new Error("error");
        });
      } catch (error) {
        expect(uow["transaction"]).toBeNull();
        expect(mockSequelize.transaction).toHaveBeenCalled();
        expect(error.message).toEqual("error");
      }
    });

    it("should rollback a transaction without sequelize.transaction", async () => {
      expect.assertions(5);
      mockSequelize.transaction = jest.fn((callback) => callback('fake transaction'));
      const uow = new UnitOfWorkSequelize(
        { get: async () => {} },
        mockSequelize as any
      );

      try {
        //@ts-expect-error - private property
        uow["transaction"] = "fake transaction";
        await uow.do(async (_uow) => {
          expect(uow).toEqual(_uow);
          expect(uow["transaction"]).toEqual("fake transaction");
          throw new Error("error");
        });
      } catch (error) {
        expect(uow["transaction"]).toBeNull();
        expect(mockSequelize.transaction).not.toHaveBeenCalled();
        expect(error.message).toEqual("error");
      }
    });
  });
});
