import { ValueObject } from "../../../@seedwork/domain";
import { Either } from "../../../@seedwork/domain/utils/either";
import { InvalidRatingError } from "../errors/invalid-rating.error";

export enum RatingValues{
  RL = 'L',
  R10 = '10',
  R12 = '12',
  R14 = '14',
  R16 = '16',
  R18 = '18',
}

export class Rating extends ValueObject<RatingValues> {
  private constructor(value: RatingValues) {
    super(value);
    this.validate();
  }

  private validate() {
    const isValid = Object.values(RatingValues).includes(this.value);
    if (!isValid) {
      throw new InvalidRatingError(this.value);
    }
  }

  static create(value: RatingValues): Either<Rating, InvalidRatingError> {
    try {
      return Either.ok(new Rating(value));
    } catch (error) {
      return Either.fail(error);
    }
  }

  static create10(): Rating {
    return new Rating(RatingValues.R10);
  }

  static create12(): Rating {
    return new Rating(RatingValues.R12);
  }

  static create14(): Rating {
    return new Rating(RatingValues.R14);
  }

  static create16(): Rating {
    return new Rating(RatingValues.R16);
  }

  static create18(): Rating {
    return new Rating(RatingValues.R18);
  }

  static with = (value: RatingValues) => new Rating(value);
}
