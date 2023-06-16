import { ValueObject } from "../../../@seedwork/domain";
import { Either } from "../../../@seedwork/domain/utils/either";
import { InvalidCastMemberTypeError } from "../errors/invalid-cast-member-type.error";

export enum CastMemberTypesValues {
  DIRECTOR = 1,
  ACTOR = 2,
}

export class CastMemberType extends ValueObject<CastMemberTypesValues> {
  static readonly TYPES = CastMemberTypesValues;
  private constructor(value: CastMemberTypesValues) {
    super(value);
    this.validate();
  }

  static create(
    value: CastMemberTypesValues
  ): Either<CastMemberType, InvalidCastMemberTypeError> {
    try {
      return Either.ok(new CastMemberType(value));
    } catch (error) {
      return Either.fail(error);
    }
  }

  private validate() {
    const isValid =
      this.value === CastMemberTypesValues.DIRECTOR ||
      this.value === CastMemberTypesValues.ACTOR;
    if (!isValid) {
      throw new InvalidCastMemberTypeError(this.value);
    }
  }

  static createAnActor() {
    return CastMemberType.create(CastMemberTypesValues.ACTOR).ok;
  }

  static createADirector() {
    return CastMemberType.create(CastMemberTypesValues.DIRECTOR).ok;
  }
}
