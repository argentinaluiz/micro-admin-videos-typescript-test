export class InvalidMinutesError extends Error {
  constructor(value: any) {
    super(`The minutes must be a positive integer, passed value: ${value}`);
  }
}
