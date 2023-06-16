import { FieldsErrors } from "./@seedwork/domain/validators/validator-fields-interface";

declare global {
  namespace jest {
    interface Matchers<R> {
      containsErrorMessages: (expected: FieldsErrors) => R;
      toBeValueObject: (expected: ValueObject) => R;
    }
  }
}
