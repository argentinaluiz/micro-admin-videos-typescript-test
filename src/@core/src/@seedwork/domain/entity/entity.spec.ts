import UniqueEntityId from "../value-objects/unique-entity-id.vo";
import Entity from "./entity";
import { validate as uuidValidate } from "uuid";

class StubEntityId extends UniqueEntityId{

}

class StubEntity extends Entity<StubEntityId, { prop1: string; prop2: number }> {
  toJSON(): Required<{ id: string; } & { prop1: string; prop2: number; }> {
    return {
      id: this.id,
      prop1: this.props.prop1,
      prop2: this.props.prop2,
    };
  }
}

describe("Entity Unit Tests", () => {
  it("should set props and id", () => {
    const arrange = { prop1: "prop1 value", prop2: 10 };
    const entity = new StubEntity(arrange, new StubEntityId());
    expect(entity.props).toStrictEqual(arrange);
    expect(entity.entityId).toBeInstanceOf(StubEntityId);
    expect(uuidValidate(entity.id)).toBeTruthy();
  });

  it("should accept a valid uuid", () => {
    const arrange = { prop1: "prop1 value", prop2: 10 };
    const entityId = new StubEntityId();
    const entity = new StubEntity(arrange, entityId);
    expect(entity.entityId).toBeInstanceOf(StubEntityId);
    expect(entity.id).toBe(entityId.value);
  });

  it("should convert an entity to a JavaScript Object", () => {
    const arrange = { prop1: "prop1 value", prop2: 10 };
    const uniqueEntityId = new UniqueEntityId();
    const entity = new StubEntity(arrange, uniqueEntityId);
    expect(entity.toJSON()).toStrictEqual({
      id: entity.id,
      ...arrange,
    });
  });
});
