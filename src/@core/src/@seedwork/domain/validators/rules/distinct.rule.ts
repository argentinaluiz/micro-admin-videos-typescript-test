import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";
import { checkIsIterable } from "../../utils/array";

export function Distinct(
  fnEquality?: (a: any, b: any) => boolean,
  validationOptions?: ValidationOptions
): Function {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: "Distinct",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if (!value) {
            return true;
          }
          const isIterable = checkIsIterable(value);
          if (!isIterable) {
            return false;
          }

          if (!fnEquality) {
            const set = new Set();
            for (let item of value) {
              if (set.has(item)) {
                return false;
              }
              set.add(item);
            }
          }else{
            const set = new Set();
            const copy = 'values' in value ? value.values() : value;
            for (let item of copy) {
              const found = Array.from(set).find((x) => fnEquality(x, item));
              if (found) {
                return false;
              }
              set.add(item);
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          const isIterable = checkIsIterable(args.value);
          if (!isIterable) {
            return `${args.property} must be an iterable`;
          }
          return `${args.property} must not contains duplicate values`;
        },
      },
    });
  };
}
