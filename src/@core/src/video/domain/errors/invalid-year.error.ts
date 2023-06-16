export class InvalidYearError extends Error {
  constructor(value: any) {
    super(`The year must be a positive integer, passed value: ${value}`);
  }
}
