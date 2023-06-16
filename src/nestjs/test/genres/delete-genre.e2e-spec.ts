import request from 'supertest';
import { Genre, GenreRepository } from '@fc/micro-videos/genre/domain';
import { GENRE_PROVIDERS } from '../../src/genres/genres.providers';
import { startApp } from '../../src/@share/testing/helpers';
import { NotFoundError } from '@fc/micro-videos/@seedwork/domain';
import { Category, CategoryRepository } from '@fc/micro-videos/category/domain';
import { CATEGORY_PROVIDERS } from '../../src/categories/category.providers';

describe('GenresController (e2e)', () => {
  describe('/delete/:id (DELETE)', () => {
    const nestApp = startApp();
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
          .delete(`/genres/${id}`)
          .expect(expected.statusCode)
          .expect(expected);
      });
    });

    it('should delete a cast member response with status 204', async () => {
      const genreRepo = nestApp.app.get<GenreRepository.Repository>(
        GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      );
      const categoryRepo = nestApp.app.get<CategoryRepository.Repository>(
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const genre = Genre.fake().aGenre().withCategoryId(category.id).build();
      await genreRepo.insert(genre);

      await request(nestApp.app.getHttpServer())
        .delete(`/genres/${genre.id}`)
        .expect(204);

      await expect(genreRepo.findById(genre.id)).rejects.toThrow(
        new NotFoundError(genre.id, Genre),
      );
    });
  });
});
