import { ValidatorAppInterface } from "../../../@seedwork/application/validators/validator-app-interface";
import {
  Either,
  InvalidUuidError,
  NotFoundError,
} from "../../../@seedwork/domain";
import { Category, CategoryId, CategoryRepository } from "../../domain";

export class CategoriesIdsValidator implements ValidatorAppInterface {
  constructor(private categoryRepo: CategoryRepository.Repository) {}

  async validate(
    categories_id: string[]
  ): Promise<Either<CategoryId[], InvalidUuidError[] | NotFoundError[]>> {
    let eitherResult = Either.ok(categories_id)
      .chain((value) => {
        return !value
          ? Either.fail([new InvalidUuidError(value)])
          : Either.ok(Array.isArray(value) ? value : [value]);
      })
      .chainEach<CategoryId[], InvalidUuidError[]>((id) => {
        return Either.safe(() => new CategoryId(id));
      });

    if (eitherResult.isFail()) {
      return eitherResult;
    }

    const [, notExistsCategoriesId] = await this.categoryRepo.existsById(
      eitherResult.ok
    );
    return notExistsCategoriesId.length > 0
      ? Either.fail(
          notExistsCategoriesId.map((c) => new NotFoundError(c.value, Category))
        )
      : eitherResult;
  }
}
