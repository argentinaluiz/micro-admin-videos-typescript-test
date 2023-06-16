import { ValueObject } from "../value-objects";
import UniqueEntityId from "../value-objects/unique-entity-id.vo";

export abstract class Entity<
  EntityId extends ValueObject = any,
  Props = any,
  JsonProps = Required<{ id: any } & Props>
> {
  constructor(
    public readonly props: Props,
    public readonly entityId: EntityId
  ) {}

  get id() {
    return this.entityId.value;
  }

  abstract toJSON(): JsonProps;
}

export default Entity;
//entity para object
