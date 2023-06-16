import { InvalidRatingError } from "../../errors/invalid-rating.error";
import { Rating, RatingValues } from "../rating.vo";

describe("Rating Unit Tests", () => {
  it("should return error when rating is not valid", () => {
    let [rating, error] = Rating.create("0" as any).asArray();
    expect(rating).toBeNull();
    expect(error).toBeInstanceOf(InvalidRatingError);

    [rating, error] = Rating.create("-1" as any).asArray();
    expect(rating).toBeNull();
    expect(error).toBeInstanceOf(InvalidRatingError);
  });

  it("should create a valid rating", () => {
    const rating = Rating.with("L" as RatingValues);
    expect(rating.value).toBe("L");

    const [rating2, error] = Rating.create("L" as RatingValues).asArray();
    expect(rating2.value).toBe("L");
    expect(error).toBeNull();
  });
});
