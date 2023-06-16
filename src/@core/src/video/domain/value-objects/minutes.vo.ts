import { ValueObject } from "../../../@seedwork/domain";
import { Either } from "../../../@seedwork/domain/utils/either";
import { InvalidMinutesError } from "../errors/invalid-minutes.error";

export class Minutes extends ValueObject<number> {
  private constructor(positiveValue: number) {
    super(positiveValue);
    this.validate();
  }

  static create(positiveValue: number): Either<Minutes, InvalidMinutesError> {
    try {
      return Either.ok(new Minutes(positiveValue));
    } catch (error) {
      return Either.fail(error);
    }
  }

  static with = (positiveValue: number) => new Minutes(positiveValue);

  private validate() {
    const isValid = Number.isInteger(this.value) && this.value > 0;
    if (!isValid) {
      throw new InvalidMinutesError(this.value);
    }
  }
}
