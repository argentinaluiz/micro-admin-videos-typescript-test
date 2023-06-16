import { InvalidMinutesError } from "../../errors/invalid-minutes.error";
import { Minutes } from "../minutes.vo";

//generate test for year.vo.ts
describe("Minutes Unit Tests", () => {
  it("should return error when minutes is not valid", () => {
    let [minutes, error] = Minutes.create(0).asArray();
    expect(minutes).toBeNull();
    expect(error).toBeInstanceOf(InvalidMinutesError);

    [minutes, error] = Minutes.create(-1).asArray();
    expect(minutes).toBeNull();
    expect(error).toBeInstanceOf(InvalidMinutesError);
  });

  it("should create a minutes year", () => {
    const minutes = Minutes.with(2000);
    expect(minutes.value).toBe(2000);

    const [year2, error] = Minutes.create(2000).asArray();
    expect(year2.value).toBe(2000);
    expect(error).toBeNull();
  });
});
