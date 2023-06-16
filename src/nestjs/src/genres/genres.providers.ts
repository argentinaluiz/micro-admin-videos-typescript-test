/* eslint-disable @typescript-eslint/no-namespace */
import { UnitOfWorkInterface } from '@fc/micro-videos/@seedwork/domain';
import {
  CreateGenreUseCase,
  UpdateGenreUseCase,
  GetGenreUseCase,
  ListGenresUseCase,
  DeleteGenreUseCase,
} from '@fc/micro-videos/genre/application';
import { GenreRepository } from '@fc/micro-videos/genre/domain';
import {
  GenreInMemoryRepository,
  GenreSequelize,
} from '@fc/micro-videos/genre/infra';
import { getModelToken } from '@nestjs/sequelize';
import { CATEGORY_PROVIDERS } from '../categories/category.providers';
import { CategoriesIdsValidator } from '@fc/micro-videos/category/application';
import { CategoryRepository } from '@fc/micro-videos/category/domain';

export namespace GENRE_PROVIDERS {
  export namespace REPOSITORIES {
    export const GENRE_IN_MEMORY_REPOSITORY = {
      provide: 'GenreInMemoryRepository',
      useClass: GenreInMemoryRepository,
    };

    export const GENRE_SEQUELIZE_REPOSITORY = {
      provide: 'GenreSequelizeRepository',
      useFactory: (
        genreModel: typeof GenreSequelize.GenreModel,
        genreCategoryModel: typeof GenreSequelize.GenreCategoryModel,
      ) => {
        return new GenreSequelize.GenreRepository(
          genreModel,
          genreCategoryModel,
        );
      },
      inject: [
        getModelToken(GenreSequelize.GenreModel),
        getModelToken(GenreSequelize.GenreCategoryModel),
      ],
    };

    export const GENRE_REPOSITORY = {
      provide: 'GenreRepository',
      useExisting: 'GenreSequelizeRepository',
    };
  }

  export namespace USE_CASES {
    export const CREATE_GENRE_USE_CASE = {
      provide: CreateGenreUseCase.UseCase,
      useFactory: (
        unitOfWork: UnitOfWorkInterface,
        categoriesIdValidator: CategoriesIdsValidator,
      ) => {
        return new CreateGenreUseCase.UseCase(
          unitOfWork,
          categoriesIdValidator,
        );
      },
      inject: [
        'UnitOfWork',
        CATEGORY_PROVIDERS.VALIDATIONS.CATEGORIES_IDS_VALIDATOR.provide,
      ],
    };

    export const UPDATE_GENRE_USE_CASE = {
      provide: UpdateGenreUseCase.UseCase,
      useFactory: (
        unitOfWork: UnitOfWorkInterface,
        categoriesIdValidator: CategoriesIdsValidator,
      ) => {
        return new UpdateGenreUseCase.UseCase(
          unitOfWork,
          categoriesIdValidator,
        );
      },
      inject: [
        'UnitOfWork',
        CATEGORY_PROVIDERS.VALIDATIONS.CATEGORIES_IDS_VALIDATOR.provide,
      ],
    };

    export const LIST_CATEGORIES_USE_CASE = {
      provide: ListGenresUseCase.UseCase,
      useFactory: (
        genreRepo: GenreRepository.Repository,
        categoryRepo: CategoryRepository.Repository,
      ) => {
        return new ListGenresUseCase.UseCase(genreRepo, categoryRepo);
      },
      inject: [
        REPOSITORIES.GENRE_REPOSITORY.provide,
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      ],
    };

    export const GET_GENRE_USE_CASE = {
      provide: GetGenreUseCase.UseCase,
      useFactory: (
        genreRepo: GenreRepository.Repository,
        categoryRepo: CategoryRepository.Repository,
      ) => {
        return new GetGenreUseCase.UseCase(genreRepo, categoryRepo);
      },
      inject: [
        REPOSITORIES.GENRE_REPOSITORY.provide,
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      ],
    };

    export const DELETE_GENRE_USE_CASE = {
      provide: DeleteGenreUseCase.UseCase,
      useFactory: (unitOfWork: UnitOfWorkInterface) => {
        return new DeleteGenreUseCase.UseCase(unitOfWork);
      },
      inject: ['UnitOfWork'],
    };
  }
}
