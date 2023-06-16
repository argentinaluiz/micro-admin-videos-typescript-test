import request from 'supertest';
import { GenreRepository } from '@fc/micro-videos/genre/domain';
import { GENRE_PROVIDERS } from '../../src/genres/genres.providers';
import { ListGenresFixture } from '../../src/genres/fixtures';
import { GenresController } from '../../src/genres/genres.controller';
import { instanceToPlain } from 'class-transformer';
import { startApp } from '../../src/@share/testing/helpers';
import qs from 'qs';
import { CategoryRepository } from '@fc/micro-videos/category/domain';
import { CATEGORY_PROVIDERS } from '../../src/categories/category.providers';

describe('GenresController (e2e)', () => {
  describe('/genres (GET)', () => {
    describe('should return cast members sorted by created_at when request query is empty', () => {
      let genreRepo: GenreRepository.Repository;
      let categoryRepo: CategoryRepository.Repository;
      const nestApp = startApp();
      const { relations, entitiesMap, arrange } =
        ListGenresFixture.arrangeIncrementedWithCreatedAt();

      beforeEach(async () => {
        genreRepo = nestApp.app.get<GenreRepository.Repository>(
          GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
        );
        categoryRepo = nestApp.app.get<CategoryRepository.Repository>(
          CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
        );
        await categoryRepo.bulkInsert(
          Array.from(relations.categories.values()),
        );
        await genreRepo.bulkInsert(Object.values(entitiesMap));
      });

      test.each(arrange)(
        'when send_data is $label',
        async ({ send_data, expected }) => {
          const queryParams = new URLSearchParams(send_data as any).toString();
          let data = expected.entities.map((e) =>
            instanceToPlain(
              GenresController.genreToResponse({
                ...e.toJSON(),
                categories: Array.from(relations.categories.values()).filter(
                  (c) => e.categories_id.has(c.id),
                ),
              }),
            ),
          );
          data = data.map((item) => {
            item.categories_id = expect.arrayContaining(item.categories_id);
            item.categories = expect.arrayContaining(item.categories);
            return item;
          });
          const response = await request(nestApp.app.getHttpServer())
            .get(`/genres/?${queryParams}`)
            .expect(200);
          expect(response.body).toStrictEqual({
            data: data,
            meta: expected.meta,
          });
        },
      );
    });

    describe('should return genres using paginate, filter and sort', () => {
      let genreRepo: GenreRepository.Repository;
      let categoryRepo: CategoryRepository.Repository;

      const nestApp = startApp();
      const { relations, entitiesMap, arrange } =
        ListGenresFixture.arrangeUnsorted();

      beforeEach(async () => {
        genreRepo = nestApp.app.get<GenreRepository.Repository>(
          GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
        );
        categoryRepo = nestApp.app.get<CategoryRepository.Repository>(
          CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
        );
        await categoryRepo.bulkInsert(
          Array.from(relations.categories.values()),
        );
        await genreRepo.bulkInsert(Object.values(entitiesMap));
      });

      test.each(arrange)(
        'when send_data is $label',
        async ({ send_data, expected }) => {
          const queryParams = qs.stringify(send_data as any);
          let data = expected.entities.map((e) =>
            instanceToPlain(
              GenresController.genreToResponse({
                ...e.toJSON(),
                categories: Array.from(relations.categories.values()).filter(
                  (c) => e.categories_id.has(c.id),
                ),
              }),
            ),
          );
          data = data.map((item) => {
            item.categories_id = expect.arrayContaining(item.categories_id);
            item.categories = expect.arrayContaining(item.categories);
            return item;
          });
          const response = await request(nestApp.app.getHttpServer())
            .get(`/genres/?${queryParams}`)
            .expect(200);
          expect(response.body).toStrictEqual({
            data: data,
            meta: expected.meta,
          });
        },
      );
    });
  });
});
