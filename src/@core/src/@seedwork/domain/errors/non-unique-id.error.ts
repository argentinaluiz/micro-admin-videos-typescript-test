export class NonUniqueIdError extends Error {
    constructor(invalidValue: any) {
      super(`The value '${invalidValue}' is not unique`);
      this.name = "NonUniqueIdError";
    }
  }
  
  export default NonUniqueIdError;