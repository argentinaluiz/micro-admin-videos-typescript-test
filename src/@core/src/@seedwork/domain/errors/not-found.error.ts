import { AggregateRoot } from "../entity";

export class NotFoundError extends Error {
  constructor(id: any[] | any, entityClass: new (...args: any[]) => AggregateRoot) {
    super(
      `${entityClass.name} Not Found using ID (${
        Array.isArray(id) ? id.join(", ") : id
      })`
    );
    this.name = "NotFoundError";
  }
}

export default NotFoundError;
