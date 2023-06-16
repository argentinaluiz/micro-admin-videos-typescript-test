import { FieldsErrors } from "#seedwork/domain";

export class LoadEntityError extends Error {
  constructor(public error: FieldsErrors, message?: string) {
    const newMessage = message ?? "An entity not be loaded";
    super(newMessage + " " + JSON.stringify(error));
    this.name = "LoadEntityError";
  }
}
