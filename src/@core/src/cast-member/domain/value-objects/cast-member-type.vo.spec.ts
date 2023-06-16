import { InvalidCastMemberTypeError } from "../errors/invalid-cast-member-type.error";
import { CastMemberType } from "./cast-member-type.vo";

describe("CastMemberType Unit Tests", () => {
  const validateSpy = jest.spyOn(
    CastMemberType.prototype as any,
    "validate"
  );

  it("should return error when type is invalid", () => {
    let [vo, error] = CastMemberType.create("1" as any);
    expect(vo).toBeNull();
    expect(error).toEqual(new InvalidCastMemberTypeError("1"));
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  it("should create a director", () => {
    let [vo, error] = CastMemberType.create(
      CastMemberType.TYPES.DIRECTOR
    ).asArray();
    expect(error).toBeNull();
    expect(vo).toBeInstanceOf(CastMemberType);
    expect(vo.value).toBe(CastMemberType.TYPES.DIRECTOR);

    vo = CastMemberType.createADirector();
    expect(error).toBeNull();
    expect(vo).toBeInstanceOf(CastMemberType);
    expect(vo.value).toBe(CastMemberType.TYPES.DIRECTOR);
  });

  it("should create an actor", () => {
    let [vo, error] = CastMemberType.create(
      CastMemberType.TYPES.ACTOR
    ).asArray();
    expect(error).toBeNull();
    expect(vo).toBeInstanceOf(CastMemberType);
    expect(vo.value).toBe(CastMemberType.TYPES.ACTOR);

    vo = CastMemberType.createAnActor();
    expect(error).toBeNull();
    expect(vo).toBeInstanceOf(CastMemberType);
    expect(vo.value).toBe(CastMemberType.TYPES.ACTOR);
  });
});
