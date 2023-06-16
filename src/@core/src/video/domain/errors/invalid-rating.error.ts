import { RatingValues } from "../value-objects/rating.vo";

export class InvalidRatingError extends Error {
  constructor(value: any) {
    super(
      `The rating must be one of the following values: ${Object.values(
        RatingValues
      ).join(", ")}, passed value: ${value}`
    );
  }
}
