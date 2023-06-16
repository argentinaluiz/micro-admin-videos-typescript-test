import request from 'supertest';
import { Genre, GenreRepository } from '@fc/micro-videos/genre/domain';
import { GENRE_PROVIDERS } from '../../src/genres/genres.providers';
import { UpdateGenreFixture } from '../../src/genres/fixtures';
import { GenresController } from '../../src/genres/genres.controller';
import { instanceToPlain } from 'class-transformer';
import { getConnectionToken } from '@nestjs/sequelize';
import { startApp } from '../../src/@share/testing/helpers';
import { Category, CategoryRepository } from '@fc/micro-videos/category/domain';
import { CATEGORY_PROVIDERS } from '../../src/categories/category.providers';

describe('GenresController (e2e)', () => {
  const uuid = '9366b7dc-2d71-4799-b91c-c64adb205104';

  describe('/genres/:id (PUT)', () => {
    describe('should a response error when id is invalid or not found', () => {
      const nestApp = startApp();
      const faker = Genre.fake().aGenre();
      const arrange = [
        {
          id: '88ff2587-ce5a-4769-a8c6-1d63d29c5f7a',
          send_data: { name: faker.name, categories_id: [1] },
          expected: {
            message:
              'Genre Not Found using ID (88ff2587-ce5a-4769-a8c6-1d63d29c5f7a)',
            statusCode: 404,
            error: 'Not Found',
          },
        },
        {
          id: 'fake id',
          send_data: { name: faker.name, categories_id: [1] },
          expected: {
            statusCode: 422,
            message: 'Validation failed (uuid  is expected)',
            error: 'Unprocessable Entity',
          },
        },
      ];

      test.each(arrange)(
        'when id is $id',
        async ({ id, send_data, expected }) => {
          return request(nestApp.app.getHttpServer())
            .put(`/genres/${id}`)
            .send(send_data)
            .expect(expected.statusCode)
            .expect(expected);
        },
      );
    });

    describe('should a response error with 422 when request body is invalid', () => {
      const app = startApp();
      const invalidRequest = UpdateGenreFixture.arrangeInvalidRequest();
      const arrange = Object.keys(invalidRequest).map((key) => ({
        label: key,
        value: invalidRequest[key],
      }));
      test.each(arrange)('when body is $label', ({ value }) => {
        return request(app.app.getHttpServer())
          .put(`/genres/${uuid}`)
          .send(value.send_data)
          .expect(422)
          .expect(value.expected);
      });
    });

    describe('should a response error with 422 when throw EntityValidationError', () => {
      const app = startApp({
        beforeInit: (app) => {
          app['config'].globalPipes = [];
        },
      });
      const validationError =
        UpdateGenreFixture.arrangeForEntityValidationError();
      const arrange = Object.keys(validationError).map((key) => ({
        label: key,
        value: validationError[key],
      }));
      let genreRepo: GenreRepository.Repository;
      let categoryRepo: CategoryRepository.Repository;

      beforeEach(() => {
        genreRepo = app.app.get<GenreRepository.Repository>(
          GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
        );
        categoryRepo = app.app.get<CategoryRepository.Repository>(
          CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
        );
      });
      test.each(arrange)('when body is $label', async ({ value }) => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        await genreRepo.insert(genre);
        return request(app.app.getHttpServer())
          .put(`/genres/${genre.id}`)
          .send(value.send_data)
          .expect(422)
          .expect(value.expected);
      });
    });

    describe('should update a cast member', () => {
      const app = startApp();
      const arrange = UpdateGenreFixture.arrangeForSave();
      let genre: GenreRepository.Repository;
      let categoryRepo: CategoryRepository.Repository;

      beforeEach(async () => {
        genre = app.app.get<GenreRepository.Repository>(
          GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
        );
        categoryRepo = app.app.get<CategoryRepository.Repository>(
          CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
        );
        const sequelize = app.app.get(getConnectionToken());
        await sequelize.sync({ force: true });
      });
      test.each(arrange)(
        'when body is $send_data',
        async ({ send_data, expected, relations }) => {
          const category = Category.fake().aCategory().build();
          await categoryRepo.bulkInsert([category, ...relations.categories]);
          const genreCreated = Genre.fake()
            .aGenre()
            .withCategoryId(category.entityId)
            .build();
          await genre.insert(genreCreated);

          const res = await request(app.app.getHttpServer())
            .put(`/genres/${genreCreated.id}`)
            .send(send_data)
            .expect(200);
          const keyInResponse = UpdateGenreFixture.keysInResponse();
          expect(Object.keys(res.body)).toStrictEqual(['data']);
          expect(Object.keys(res.body.data)).toStrictEqual(keyInResponse);
          const id = res.body.data.id;
          const genreUpdated = await genre.findById(id);
          const presenter = GenresController.genreToResponse(
            genreUpdated.toJSON(),
          );
          const serialized = instanceToPlain(presenter, {
            exposeUnsetFields: false,
          });
          expect(res.body.data).toStrictEqual({
            id: serialized.id,
            created_at: serialized.created_at,
            ...expected,
            categories_id: expect.arrayContaining(serialized.categories_id),
          });
        },
      );
    });
  });
});
