import request from 'supertest';
import { GenreRepository } from '@fc/micro-videos/genre/domain';
import { GENRE_PROVIDERS } from '../../src/genres/genres.providers';
import { CreateGenreFixture } from '../../src/genres/fixtures';
import { GenresController } from '../../src/genres/genres.controller';
import { instanceToPlain } from 'class-transformer';
import { startApp } from '../../src/@share/testing/helpers';
import { CategoryRepository } from '@fc/micro-videos/category/domain';
import { CATEGORY_PROVIDERS } from '../../src/categories/category.providers';

describe('GenresController (e2e)', () => {
  describe('/genres (POST)', () => {
    describe('should a response error with 422 when request body is invalid', () => {
      const app = startApp();
      const invalidRequest = CreateGenreFixture.arrangeInvalidRequest();
      const arrange = Object.keys(invalidRequest).map((key) => ({
        label: key,
        value: invalidRequest[key],
      }));
      test.each(arrange)('when body is $label', ({ value }) => {
        return request(app.app.getHttpServer())
          .post('/genres')
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
        CreateGenreFixture.arrangeForEntityValidationError();
      const arrange = Object.keys(validationError).map((key) => ({
        label: key,
        value: validationError[key],
      }));
      test.each(arrange)('when body is $label', ({ value }) => {
        return request(app.app.getHttpServer())
          .post('/genres')
          .send(value.send_data)
          .expect(422)
          .expect(value.expected);
      });
    });

    describe('should create a cast member', () => {
      const app = startApp();
      const arrange = CreateGenreFixture.arrangeForSave();
      let genreRepo: GenreRepository.Repository;
      let categoryRepo: CategoryRepository.Repository;
      beforeEach(async () => {
        genreRepo = app.app.get<GenreRepository.Repository>(
          GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
        );
        categoryRepo = app.app.get<CategoryRepository.Repository>(
          CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
        );
      });
      test.each(arrange)(
        'when body is $send_data',
        async ({ relations, send_data, expected }) => {
          await categoryRepo.bulkInsert(relations.categories);
          const res = await request(app.app.getHttpServer())
            .post('/genres')
            .send(send_data)
            .expect(201);
          const keyInResponse = CreateGenreFixture.keysInResponse();
          expect(Object.keys(res.body)).toStrictEqual(['data']);
          expect(Object.keys(res.body.data)).toStrictEqual(keyInResponse);
          const id = res.body.data.id;
          const genreCreated = await genreRepo.findById(id);
          const presenter = GenresController.genreToResponse(
            genreCreated.toJSON(),
          );
          const serialized = instanceToPlain(presenter);
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
