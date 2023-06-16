import { Genre } from "../../domain/entities/genre";
import { default as DefaultUseCase } from "../../../@seedwork/application/use-case";
import { EntityValidationError } from "../../../@seedwork/domain";
import { GenreSimpleOutput, GenreSimpleOutputMapper } from "../dto";
import { CategoriesIdsValidator } from "../../../category/application/validations/categories-ids.validator";
import { UnitOfWorkInterface } from "../../../@seedwork/domain/persistence/unit-of-work-interface";

export namespace CreateGenreUseCase {
  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(
      private uow: UnitOfWorkInterface,
      private categoriesIdValidator: CategoriesIdsValidator
    ) {}

    async execute(input: Input): Promise<Output> {
      let [categoriesId, errorsCategoriesId] = (
        await this.categoriesIdValidator.validate(input.categories_id)
      ).asArray();

      try {
        const { name, is_active } = input;
        const entity = Genre.create({
          name,
          categories_id: errorsCategoriesId ? [] : categoriesId,
          is_active,
        });
        await this.uow.do(async (uow) => {
          const genreRepo = await uow.getRepository("GenreRepository");
          await genreRepo.insert(entity);
        });
        return GenreSimpleOutputMapper.toOutput(entity);
      } catch (e) {
        this.handleError(e, errorsCategoriesId);
      }
    }

    private handleError(e: Error, errorCategoriesId: Error[] | undefined) {
      if (e instanceof EntityValidationError) {
        e.setFromError("categories_id", errorCategoriesId);
      }

      throw e;
    }
  }

  export type Input = {
    name: string;
    categories_id: string[];
    is_active?: boolean;
  };

  export type Output = GenreSimpleOutput;
}

export default CreateGenreUseCase;
