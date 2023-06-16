import { GenreRepository } from "../../domain/repository/genre.repository";
import {
  GenreSimpleOutputMapper,
  GenreSimpleOutput,
} from "../dto/genre-output";
import { default as DefaultUseCase } from "../../../@seedwork/application/use-case";
import { EntityValidationError } from "../../../@seedwork/domain";
import { CategoriesIdsValidator } from "../../../category/application/validations/categories-ids.validator";
import { UnitOfWorkInterface } from "../../../@seedwork/domain/persistence/unit-of-work-interface";

export namespace UpdateGenreUseCase {
  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(
      private uow: UnitOfWorkInterface,
      private categoriesIdValidator: CategoriesIdsValidator
    ) {}

    async execute(input: Input): Promise<Output> {
      return this.uow.do(async (uow) => {
        const genreRepo = (await uow.getRepository(
          "GenreRepository"
        )) as GenreRepository.Repository;
        const entity = await genreRepo.findById(input.id);

        let [categoriesId, errorsCategoriesId] = (
          await this.categoriesIdValidator.validate(input.categories_id)
        ).asArray();

        try {
          entity.update(input.name);
          
          categoriesId
            ? entity.updateCategoriesId(categoriesId)
            : (function () {
                throw new EntityValidationError();
              })();

          input.is_active === true
            ? entity.activate()
            : input.is_active === false
            ? entity.deactivate()
            : null;
          
          await genreRepo.update(entity);
          return GenreSimpleOutputMapper.toOutput(entity);
        } catch (e) {
          this.handleError(e, errorsCategoriesId);
        }
      });
    }

    private handleError(e: Error, errorCategoriesId: Error[] | undefined) {
      if (e instanceof EntityValidationError) {
        e.setFromError("categories_id", errorCategoriesId);
      }

      throw e;
    }
  }

  export type Input = {
    id: string;
    name: string;
    categories_id?: string[];
    is_active?: boolean;
  };

  export type Output = GenreSimpleOutput;
}

export default UpdateGenreUseCase;
