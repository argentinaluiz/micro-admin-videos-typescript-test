import { InvalidYearError } from "../../errors/invalid-year.error";
import { Year } from "../year.vo";

//generate test for year.vo.ts
describe("Year Unit Tests", () => {
  it("should return error when year is not valid", () => {
    let [year, error] = Year.create(0).asArray();
    expect(year).toBeNull();
    expect(error).toBeInstanceOf(InvalidYearError);

    [year, error] = Year.create(-1).asArray();
    expect(year).toBeNull();
    expect(error).toBeInstanceOf(InvalidYearError);
  });

  it("should create a valid year", () => {
    const year1 = Year.with(2000);
    expect(year1.value).toBe(2000);

    const [year2, error] = Year.create(2000).asArray();
    expect(year2.value).toBe(2000);
    expect(error).toBeNull();
  });
});
