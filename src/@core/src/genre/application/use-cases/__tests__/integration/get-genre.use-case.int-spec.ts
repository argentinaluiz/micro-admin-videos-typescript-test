import {GetGenreUseCase} from "../../get-genre.use-case";
import NotFoundError from "../../../../../@seedwork/domain/errors/not-found.error";
import { GenreSequelize } from "../../../../infra/db/sequelize/genre-sequelize";
import { setupSequelize } from "../../../../../@seedwork/infra/testing/helpers/db";
import { Genre } from "../../../../domain";
import { CategorySequelize } from "../../../../../category/infra";
import { Category } from "../../../../../category/domain";

const { GenreRepository, GenreModel, GenreCategoryModel } = GenreSequelize;
const { CategoryRepository, CategoryModel } = CategorySequelize;

describe("GetGenreUseCase Integration Tests", () => {
  let useCase: GetGenreUseCase.UseCase;
  let genreRepo: GenreSequelize.GenreRepository;
  let categoryRepo: CategorySequelize.CategoryRepository;

  setupSequelize({ models: [GenreModel, GenreCategoryModel, CategoryModel] });

  beforeEach(() => {
    genreRepo = new GenreRepository(GenreModel, GenreCategoryModel);
    categoryRepo = new CategoryRepository(CategoryModel);
    useCase = new GetGenreUseCase.UseCase(genreRepo, categoryRepo);
  });

  it("should throws error when entity not found", async () => {
    await expect(() => useCase.execute({ id: "fake id" })).rejects.toThrow(
      new NotFoundError('fake id', Genre)
    );
  });

  it("should returns a cast member", async () => {
    const categories = Category.fake().theCategories(2).build();
    await categoryRepo.bulkInsert(categories);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .build();
    await genreRepo.insert(genre);
    const output = await useCase.execute({ id: genre.id });
    expect(output).toStrictEqual({
      id: genre.id,
      name: genre.name,
      categories: expect.arrayContaining([
        expect.objectContaining({
          id: categories[0].id,
          name: categories[0].name,
          created_at: categories[0].created_at,
        }),
        expect.objectContaining({
          id: categories[1].id,
          name: categories[1].name,
          created_at: categories[1].created_at,
        })
      ]),
      categories_id: expect.arrayContaining([
        categories[0].id,
        categories[1].id,
      ]),
      is_active: true, 
      created_at: genre.created_at,
    });
  });
});
