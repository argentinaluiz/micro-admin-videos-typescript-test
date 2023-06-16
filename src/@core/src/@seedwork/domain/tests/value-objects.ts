import { ValueObject } from "#seedwork/domain";

expect.extend({
  toBeValueObject(expected: ValueObject, received: ValueObject) {
    return expected.equals(received)
      ? { pass: true, message: () => "" }
      : {
          pass: false,
          message: () =>
            `The values object are not equal. Expected: ${JSON.stringify(
              expected
            )} | Received: ${JSON.stringify(received)}`,
        };
  },
});
