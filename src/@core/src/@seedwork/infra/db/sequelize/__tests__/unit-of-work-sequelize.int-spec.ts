import { RepositoryInterface } from "./../../../../domain/persistence/repository-contracts";
import {
  Sequelize,
  Model,
  Column,
  Table,
  DataType,
} from "sequelize-typescript";
import { UnitOfWorkSequelize } from "../unit-of-work-sequelize";
import { UnitOfWorkInterface } from "../../../../domain/persistence/unit-of-work-interface";

@Table
class StubModel extends Model {
  @Column({ type: DataType.STRING })
  declare name: string;
}

//@ts-expect-error - use model as entity
class StubRepository implements RepositoryInterface<StubModel> {
  unitOfWork: UnitOfWorkInterface | null;

  constructor(public sequelize: Sequelize) {}

  setUnitOfWork(unitOfWork: UnitOfWorkInterface) {
    this.unitOfWork = unitOfWork;
  }
  async insert(entity: StubModel): Promise<void> {
    await entity.save({ transaction: this.unitOfWork?.getTransaction() });
  }
  bulkInsert(entities: StubModel[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  findById(id: string): Promise<StubModel> {
    return StubModel.findByPk(id, {
      transaction: this.unitOfWork?.getTransaction(),
    });
  }
  findAll(): Promise<StubModel[]> {
    throw new Error("Method not implemented.");
  }
  update(entity: StubModel): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

describe("UnitOfWorkSequelize Integration Tests", () => {
  let sequelize: Sequelize;
  let repository: StubRepository;
  let uow: UnitOfWorkSequelize;
  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      host: ":memory:",
    });
    sequelize.addModels([StubModel]);
    await sequelize.sync({ force: true });
    repository = new StubRepository(sequelize);
    uow = new UnitOfWorkSequelize(
      { get: async (name: string) => repository },
      sequelize
    );
  });

  describe("transaction manually", () => {
    it('should throw an error on commit if "start" is not called', async () => {
      expect.assertions(1);
      try {
        await uow.commit();
      } catch (e) {
        expect(e.message).toBe("No transaction started");
      }
    });

    it("should commit a transaction manually", async () => {
      await uow.start();
      let repo = await uow.getRepository(StubRepository);
      const model1 = new StubModel({ name: "test1" });
      const model2 = new StubModel({ name: "test2" });
      await repo.insert(model1);
      await repo.insert(model2);
      await uow.commit();
      const newModel1 = await repo.findById(model1.id);
      const newModel2 = await repo.findById(model2.id);
      expect(newModel1.name).toBe("test1");
      expect(newModel2.name).toBe("test2");

      await uow.start();
      repo = await uow.getRepository(StubRepository);
      const model3 = new StubModel({ name: "test3" });
      const model4 = new StubModel({ name: "test4" });
      await repo.insert(model3);
      await repo.insert(model4);
      await uow.commit();
      const newModel3 = await repo.findById(model3.id);
      const newModel4 = await repo.findById(model4.id);
      expect(newModel3.name).toBe("test3");
      expect(newModel4.name).toBe("test4");
    });

    it('should throw an error on rollback if "start" is not called', async () => {
      expect.assertions(1);
      try {
        await uow.rollback();
      } catch (e) {
        expect(e.message).toBe("No transaction started");
      }
    });

    it("should rollback a transaction manually", async () => {
      await uow.start();
      const repo = await uow.getRepository(StubRepository);
      const model1 = new StubModel({ name: "test1" });
      const model2 = new StubModel({ name: "test2" });
      await repo.insert(model1);
      await repo.insert(model2);
      await uow.rollback();
      const newModel1 = await repo.findById(model1.id);
      const newModel2 = await repo.findById(model2.id);
      expect(newModel1).toBeNull();
      expect(newModel2).toBeNull();

      await uow.start();
      const repo2 = await uow.getRepository(StubRepository);
      const model3 = new StubModel({ name: "test3" });
      const model4 = new StubModel({ name: "test4" });
      await repo2.insert(model3);
      await repo2.insert(model4);
      await uow.rollback();
      const newModel3 = await repo2.findById(model3.id);
      const newModel4 = await repo2.findById(model4.id);
      expect(newModel3).toBeNull();
      expect(newModel4).toBeNull();
    });
  });

  describe("transaction automatically", () => {
    it("should complete a transaction", async () => {
      const { newModel1, newModel2 } = await uow.do(async (uow) => {
        const repo = await uow.getRepository(StubRepository);
        const model1 = new StubModel({ name: "test1" });
        const model2 = new StubModel({ name: "test2" });
        await repo.insert(model1);
        await repo.insert(model2);
        const newModel1 = await repo.findById(model1.id);
        const newModel2 = await repo.findById(model2.id);
        return { newModel1, newModel2 };
      });

      expect(newModel1.name).toBe("test1");
      expect(newModel2.name).toBe("test2");

      const { newModel3, newModel4 } = await uow.do(async (uow) => {
        const repo = await uow.getRepository(StubRepository);
        const model3 = new StubModel({ name: "test3" });
        const model4 = new StubModel({ name: "test4" });
        await repo.insert(model3);
        await repo.insert(model4);
        const newModel3 = await repo.findById(model3.id);
        const newModel4 = await repo.findById(model4.id);
        return { newModel3, newModel4 };
      });

      expect(newModel3.name).toBe("test3");
      expect(newModel4.name).toBe("test4");
    });

    it("should rollback a transaction", async () => {
      let model1, model2;
      let result = uow.do(async (uow) => {
        const repo = await uow.getRepository(StubRepository);
        model1 = new StubModel({ name: "test1" });
        model2 = new StubModel({ name: "test2" });
        await repo.insert(model1);
        await repo.insert(model2);
        throw new Error("transaction error");
      });
      await expect(result).rejects.toThrowError("transaction error");
      let newModel1 = await repository.findById(model1.id);
      let newModel2 = await repository.findById(model2.id);
      expect(newModel1).toBeNull();
      expect(newModel2).toBeNull();

      result = uow.do(async (uow) => {
        const repo = await uow.getRepository(StubRepository);
        model1 = new StubModel({ name: "test1" });
        model2 = new StubModel({ name: "test2" });
        await repo.insert(model1);
        await repo.insert(model2);
        throw new Error("transaction error");
      });
      await expect(result).rejects.toThrowError("transaction error");
      newModel1 = await repository.findById(model1.id);
      newModel2 = await repository.findById(model2.id);
      expect(newModel1).toBeNull();
      expect(newModel2).toBeNull();
    });
  });
});
