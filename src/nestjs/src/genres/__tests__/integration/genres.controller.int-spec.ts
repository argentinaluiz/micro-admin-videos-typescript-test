import { NotFoundError } from '@fc/micro-videos/@seedwork/domain';
import {
  CreateGenreUseCase,
  UpdateGenreUseCase,
  ListGenresUseCase,
  GetGenreUseCase,
  DeleteGenreUseCase,
} from '@fc/micro-videos/genre/application';
import { Genre, GenreRepository } from '@fc/micro-videos/genre/domain';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../../../config/config.module';
import { DatabaseModule } from '../../../database/database.module';
import { GenresController } from '../../genres.controller';
import { GenresModule } from '../../genres.module';
import { GENRE_PROVIDERS } from '../../genres.providers';
import { UnitOfWorkSequelize } from '@fc/micro-videos/@seedwork/infra';
import { Sequelize } from 'sequelize-typescript';
import { Category, CategoryRepository } from '@fc/micro-videos/category/domain';
import {
  GenreCollectionPresenter,
  GenrePresenter,
} from '../../presenter/genre.presenter';
import { getConnectionToken } from '@nestjs/sequelize';
import { CATEGORY_PROVIDERS } from '../../../categories/category.providers';
import { RepositoryContainer } from '../../../database/repository-container';
import { GenreSequelize } from '@fc/micro-videos/genre/infra';
import { CategorySequelize } from '@fc/micro-videos/category/infra';
import {
  CreateGenreFixture,
  ListGenresFixture,
  UpdateGenreFixture,
} from '../../fixtures';

describe('GenresController Integration Tests', () => {
  let controller: GenresController;
  let genreRepo: GenreRepository.Repository;
  let categoryRepo: CategoryRepository.Repository;

  beforeEach(async () => {
    const models = [
      GenreSequelize.GenreModel,
      GenreSequelize.GenreCategoryModel,
      CategorySequelize.CategoryModel,
    ];

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        DatabaseModule.forRoot({ models }),
        GenresModule,
      ],
    })
      .overrideProvider('UnitOfWork')
      .useFactory({
        factory: (repoContainer: RepositoryContainer, sequelize: Sequelize) => {
          return new UnitOfWorkSequelize(repoContainer, sequelize);
        },
        inject: [RepositoryContainer, getConnectionToken()],
      })

      .compile();

    controller = module.get(GenresController);
    genreRepo = module.get(
      GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
    );
    categoryRepo = module.get(
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(controller['createUseCase']).toBeInstanceOf(
      CreateGenreUseCase.UseCase,
    );
    expect(controller['updateUseCase']).toBeInstanceOf(
      UpdateGenreUseCase.UseCase,
    );
    expect(controller['listUseCase']).toBeInstanceOf(ListGenresUseCase.UseCase);
    expect(controller['getUseCase']).toBeInstanceOf(GetGenreUseCase.UseCase);
    expect(controller['deleteUseCase']).toBeInstanceOf(
      DeleteGenreUseCase.UseCase,
    );
  });

  describe('should create a category', () => {
    const arrange = CreateGenreFixture.arrangeForSave();

    test.each(arrange)(
      'when body is $send_data',
      async ({ relations, send_data, expected }) => {
        await categoryRepo.bulkInsert(relations.categories);
        const presenter = await controller.create(send_data);
        const entity = await genreRepo.findById(presenter.id);

        const data = entity.toJSON();
        expect(data).toStrictEqual({
          id: presenter.id,
          created_at: presenter.created_at,
          ...expected,
          categories_id: expect.arrayContaining(expected.categories_id),
        });

        expect(presenter).toEqual(
          new GenrePresenter({
            ...data,
            categories_id: expect.arrayContaining(data.categories_id),
          }),
        );
      },
    );
  });

  describe('should update a category', () => {
    const arrange = UpdateGenreFixture.arrangeForSave();

    test.each(arrange)(
      'with request $send_data',
      async ({ entity, relations, send_data, expected }) => {
        await categoryRepo.bulkInsert(relations.categories);
        await genreRepo.insert(entity);
        const presenter = await controller.update(entity.id, send_data);
        const entityUpdated = await genreRepo.findById(presenter.id);

        const data = entityUpdated.toJSON();
        expect(data).toStrictEqual({
          id: presenter.id,
          created_at: presenter.created_at,
          ...expected,
          categories_id: expect.arrayContaining(data.categories_id),
        });
        expect(presenter).toEqual(
          new GenrePresenter({
            ...data,
            categories_id: expect.arrayContaining(data.categories_id),
          }),
        );
      },
    );
  });

  it('should delete a category', async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(category.entityId)
      .build();
    await genreRepo.insert(genre);
    const response = await controller.remove(genre.id);
    expect(response).not.toBeDefined();
    await expect(genreRepo.findById(genre.id)).rejects.toThrow(
      new NotFoundError(genre.id, Genre),
    );
  });

  it('should get a category', async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(category.entityId)
      .build();
    await genreRepo.insert(genre);
    const presenter = await controller.findOne(genre.id);

    expect(presenter.id).toBe(genre.id);
    expect(presenter.name).toBe(genre.name);
    expect(presenter.categories_id).toEqual(
      expect.arrayContaining(Array.from(genre.categories_id.keys())),
    );
    expect(presenter.created_at).toStrictEqual(genre.created_at);
  });

  describe('search method', () => {
    describe('should returns categories using query empty ordered by created_at', () => {
      const { relations, entitiesMap, arrange } =
        ListGenresFixture.arrangeIncrementedWithCreatedAt();

      beforeEach(async () => {
        await categoryRepo.bulkInsert(
          Array.from(relations.categories.values()),
        );
        await genreRepo.bulkInsert(Object.values(entitiesMap));
      });

      test.each(arrange)(
        'when send_data is $send_data',
        async ({ send_data, expected }) => {
          const presenter = await controller.search(send_data);
          const { entities, ...paginationProps } = expected;
          const expectedPresenter = new GenreCollectionPresenter({
            items: entities.map((e) => ({
              ...e.toJSON(),
              categories_id: expect.arrayContaining(
                Array.from(e.categories_id.keys()),
              ),
              categories: Array.from(e.categories_id.keys()).map((id) => ({
                id: relations.categories.get(id).id,
                name: relations.categories.get(id).name,
                created_at: relations.categories.get(id).created_at,
              })),
            })),
            ...paginationProps.meta,
          });
          presenter.data = presenter.data.map((item) => ({
            ...item,
            categories: expect.arrayContaining(item.categories),
          }));
          expect(presenter).toEqual(expectedPresenter);
        },
      );
    });

    describe('should returns output using pagination, sort and filter', () => {
      const { relations, entitiesMap, arrange } =
        ListGenresFixture.arrangeUnsorted();

      beforeEach(async () => {
        await categoryRepo.bulkInsert(
          Array.from(relations.categories.values()),
        );
        await genreRepo.bulkInsert(Object.values(entitiesMap));
      });

      test.each(arrange)(
        'when send_data is $label',
        async ({ send_data, expected }) => {
          const presenter = await controller.search(send_data);
          const { entities, ...paginationProps } = expected;
          const expectedPresenter = new GenreCollectionPresenter({
            items: entities.map((e) => ({
              ...e.toJSON(),
              categories_id: expect.arrayContaining(
                Array.from(e.categories_id.keys()),
              ),
              categories: Array.from(e.categories_id.keys()).map((id) => ({
                id: relations.categories.get(id).id,
                name: relations.categories.get(id).name,
                created_at: relations.categories.get(id).created_at,
              })),
            })),
            ...paginationProps.meta,
          });
          presenter.data = presenter.data.map((item) => ({
            ...item,
            categories: expect.arrayContaining(item.categories),
          }));
          expect(presenter).toEqual(expectedPresenter);
        },
      );
    });
  });
});
