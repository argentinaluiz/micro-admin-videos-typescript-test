import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";
import { checkIsIterable } from "../../utils/array";

export function IterableNotEmpty(
  validationOptions?: ValidationOptions
): Function {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: "IterableNotEmpty",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          return (
            value && checkIsIterable(value) && Array.from(value).length > 0
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} should not be empty`;
        },
      },
    });
  };
}
