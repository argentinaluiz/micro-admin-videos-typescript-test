import request from 'supertest';
import { Genre, GenreRepository } from '@fc/micro-videos/genre/domain';
import { GENRE_PROVIDERS } from '../../src/genres/genres.providers';
import { GenresController } from '../../src/genres/genres.controller';
import { instanceToPlain } from 'class-transformer';
import { startApp } from '../../src/@share/testing/helpers';
import { Category, CategoryRepository } from '@fc/micro-videos/category/domain';
import { CATEGORY_PROVIDERS } from '../../src/categories/category.providers';

describe('GenresController (e2e)', () => {
  const nestApp = startApp();
  describe('/genres/:id (GET)', () => {
    describe('should a response error when id is invalid or not found', () => {
      const arrange = [
        {
          id: '88ff2587-ce5a-4769-a8c6-1d63d29c5f7a',
          expected: {
            message:
              'Genre Not Found using ID (88ff2587-ce5a-4769-a8c6-1d63d29c5f7a)',
            statusCode: 404,
            error: 'Not Found',
          },
        },
        {
          id: 'fake id',
          expected: {
            statusCode: 422,
            message: 'Validation failed (uuid  is expected)',
            error: 'Unprocessable Entity',
          },
        },
      ];

      test.each(arrange)('when id is $id', async ({ id, expected }) => {
        return request(nestApp.app.getHttpServer())
          .get(`/genres/${id}`)
          .expect(expected.statusCode)
          .expect(expected);
      });
    });

    it('should return a genre ', async () => {
      const genreRepo = nestApp.app.get<GenreRepository.Repository>(
        GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      );
      const categoryRepo = nestApp.app.get<CategoryRepository.Repository>(
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );
      const categories = Category.fake().theCategories(3).build();
      await categoryRepo.bulkInsert(categories);
      const genre = Genre.fake()
        .aGenre()
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCategoryId(categories[2].entityId)
        .build();
      await genreRepo.insert(genre);

      const res = await request(nestApp.app.getHttpServer())
        .get(`/genres/${genre.id}`)
        .expect(200);
      console.log(res.body);
      expect(Object.keys(res.body)).toStrictEqual(['data']);
      expect(Object.keys(res.body.data)).toStrictEqual([
        'id',
        'name',
        'categories_id',
        'categories',
        'is_active',
        'created_at',
      ]);

      const presenter = GenresController.genreToResponse({
        ...genre.toJSON(),
        categories: categories.map((category) => category.toJSON()),
      });
      const serialized = instanceToPlain(presenter);
      expect(res.body.data).toStrictEqual({
        ...serialized,
        categories_id: expect.arrayContaining(serialized.categories_id),
        categories: expect.arrayContaining(serialized.categories),
      });
    });
  });
});
