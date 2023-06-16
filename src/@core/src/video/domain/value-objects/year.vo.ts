import { ValueObject } from "../../../@seedwork/domain";
import { Either } from "../../../@seedwork/domain/utils/either";
import { InvalidYearError } from "../errors/invalid-year.error";

export class Year extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
    this.validate();
  }

  static create(value: number): Either<Year, InvalidYearError> {
    try {
      return Either.ok(new Year(value));
    } catch (error) {
      return Either.fail(error);
    }
  }

  static with = (value: number) => new Year(value);

  private validate() {
    const isValid = Number.isInteger(this.value) && this.value > 0;
    if (!isValid) {
      throw new InvalidYearError(this.value);
    }
  }
}
