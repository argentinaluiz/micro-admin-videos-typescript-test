import NotFoundError from "../../errors/not-found.error";
import UniqueEntityId from "../../value-objects/unique-entity-id.vo";
import { InMemoryRepository } from "../../persistence/in-memory.repository";
import { InvalidArgumentError } from "../../errors/invalid-argument.error";
import { AggregateRoot } from "../../entity";

type StubEntityProps = {
  name: string;
  price: number;
};

class StubEntityId extends UniqueEntityId {}

class StubEntity extends AggregateRoot<StubEntityId, StubEntityProps> {
  constructor(props: StubEntityProps, id?: StubEntityId) {
    super(props, id ?? new StubEntityId());
  }

  toJSON(): { id: string } & StubEntityProps {
    return {
      id: this.id,
      name: this.props.name,
      price: this.props.price,
    };
  }
}

class StubInMemoryRepository extends InMemoryRepository<
  StubEntity,
  StubEntityId
> {
  getEntity(): new (...args: any[]) => StubEntity {
    return StubEntity;
  }
}

describe("InMemoryRepository Unit Tests", () => {
  let repository: StubInMemoryRepository;
  beforeEach(() => (repository = new StubInMemoryRepository()));

  it("should inserts a new entity", async () => {
    const entity = new StubEntity({ name: "name value", price: 5 });
    await repository.insert(entity);
    expect(entity.toJSON()).toStrictEqual(repository.items[0].toJSON());
  });

  it("should throws error when entity not found", async () => {
    await expect(repository.findById("fake id")).rejects.toThrow(
      new NotFoundError("fake id", StubEntity)
    );

    await expect(
      repository.findById(
        new UniqueEntityId("9366b7dc-2d71-4799-b91c-c64adb205104")
      )
    ).rejects.toThrow(
      new NotFoundError("9366b7dc-2d71-4799-b91c-c64adb205104", StubEntity)
    );
  });

  it("should finds a entity by id", async () => {
    const entity = new StubEntity({ name: "name value", price: 5 });
    await repository.insert(entity);

    let entityFound = await repository.findById(entity.id);
    expect(entity.toJSON()).toStrictEqual(entityFound.toJSON());

    entityFound = await repository.findById(entity.entityId);
    expect(entity.toJSON()).toStrictEqual(entityFound.toJSON());
  });

  it('should finds entity by ids', async () => {
    const entity1 = new StubEntity({ name: "name value", price: 5 });
    const entity2 = new StubEntity({ name: "name value", price: 5 });
    const entity3 = new StubEntity({ name: "name value", price: 5 });
    repository.items = [entity1, entity2, entity3];

    const entitiesFound = await repository.findByIds([entity1.entityId, entity3.entityId]);
    expect(entitiesFound).toStrictEqual([entity1, entity3]);
  })

  it("should returns all entities", async () => {
    const entity = new StubEntity({ name: "name value", price: 5 });
    await repository.insert(entity);

    const entities = await repository.findAll();

    expect(entities).toStrictEqual([entity]);
  });

  it("should throws error on update when entity not found", () => {
    const entity = new StubEntity({ name: "name value", price: 5 });
    expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.id, StubEntity)
    );
  });

  it("should updates an entity", async () => {
    const entity = new StubEntity({ name: "name value", price: 5 });
    await repository.insert(entity);

    const entityUpdated = new StubEntity(
      { name: "updated", price: 1 },
      entity.entityId
    );
    await repository.update(entityUpdated);
    expect(entityUpdated.toJSON()).toStrictEqual(repository.items[0].toJSON());
  });

  it("should throws error on delete when entity not found", () => {
    expect(repository.delete("fake id")).rejects.toThrow(
      new NotFoundError("fake id", StubEntity)
    );

    expect(
      repository.delete(
        new UniqueEntityId("9366b7dc-2d71-4799-b91c-c64adb205104")
      )
    ).rejects.toThrow(
      new NotFoundError("9366b7dc-2d71-4799-b91c-c64adb205104", StubEntity)
    );
  });

  it("should deletes an entity", async () => {
    const entity = new StubEntity({ name: "name value", price: 5 });
    await repository.insert(entity);

    await repository.delete(entity.id);
    expect(repository.items).toHaveLength(0);

    await repository.insert(entity);

    await repository.delete(entity.entityId);
    expect(repository.items).toHaveLength(0);
  });

  it("should returns a list of existing entities ids", async () => {
    await expect(repository.existsById([])).rejects.toThrowError(
      new InvalidArgumentError("ids must be an array with at least one element")
    );

    let [existsIds, notExistsIds] = await repository.existsById([
      new StubEntityId(),
      new StubEntityId(),
    ]);
    expect(existsIds).toHaveLength(0);
    expect(notExistsIds).toHaveLength(2);
    expect(notExistsIds[0]).toBeInstanceOf(StubEntityId);
    expect(notExistsIds[1]).toBeInstanceOf(StubEntityId);

    const entity1 = new StubEntity({ name: "name value", price: 5 });
    await repository.insert(entity1);

    [existsIds, notExistsIds] = await repository.existsById([
      new StubEntityId(),
      entity1.entityId,
      new StubEntityId(),
    ]);
    expect(existsIds).toHaveLength(1);
    expect(notExistsIds).toHaveLength(2);
    expect(existsIds[0]).toStrictEqual(entity1.entityId);
    expect(notExistsIds[0]).toBeInstanceOf(StubEntityId);
    expect(notExistsIds[1]).toBeInstanceOf(StubEntityId);

    const entity2 = new StubEntity({ name: "name value", price: 5 });
    await repository.insert(entity2);

    [existsIds, notExistsIds] = await repository.existsById([
      new StubEntityId(),
      entity1.entityId,
      new StubEntityId(),
      entity2.entityId,
    ]);
    expect(existsIds).toHaveLength(2);
    expect(notExistsIds).toHaveLength(2);
    expect(existsIds[0]).toStrictEqual(entity1.entityId);
    expect(existsIds[1]).toStrictEqual(entity2.entityId);
    expect(notExistsIds[0]).toBeInstanceOf(StubEntityId);
    expect(notExistsIds[1]).toBeInstanceOf(StubEntityId);
  });
});
