export class InvalidUuidError extends Error {
  constructor(invalidValue: any) {
    //super(message || "ID must be a valid UUID");
    super(`ID ${invalidValue} must be a valid UUID`);
    this.name = "InvalidUuidError";
  }
}

export default InvalidUuidError;