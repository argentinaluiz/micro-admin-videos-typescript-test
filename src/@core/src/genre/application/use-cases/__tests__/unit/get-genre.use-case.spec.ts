import { GetGenreUseCase } from "../../get-genre.use-case";
import GenreInMemoryRepository from "../../../../infra/db/in-memory/genre-in-memory.repository";
import NotFoundError from "../../../../../@seedwork/domain/errors/not-found.error";
import { Genre } from "../../../../domain/entities/genre";
import { CategoryInMemoryRepository } from "../../../../../category/infra";
import { Category } from "../../../../../category/domain";

describe("GetGenreUseCase Unit Tests", () => {
  let useCase: GetGenreUseCase.UseCase;
  let genreRepo: GenreInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;

  beforeEach(() => {
    genreRepo = new GenreInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    useCase = new GetGenreUseCase.UseCase(genreRepo, categoryRepo);
  });

  it("should throws error when entity not found", async () => {
    await expect(() => useCase.execute({ id: "fake id" })).rejects.toThrow(
      new NotFoundError("fake id", Genre)
    );
  });

  it("should returns a cast member", async () => {
    const categories = Category.fake().theCategories(3).build();
    await categoryRepo.bulkInsert(categories);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[2].entityId)
      .build();
    const items = [genre];
    genreRepo.items = items;
    const spyGenreFindById = jest.spyOn(genreRepo, "findById");
    const spyCategoryFindByIds = jest.spyOn(categoryRepo, "findByIds");
    const output = await useCase.execute({ id: genre.id });
    expect(spyGenreFindById).toHaveBeenCalledTimes(1);
    expect(spyCategoryFindByIds).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: genre.id,
      name: genre.name,
      categories: [
        {
          id: categories[0].id,
          name: categories[0].name,
          created_at: categories[0].created_at,
        },
        {
          id: categories[2].id,
          name: categories[2].name,
          created_at: categories[2].created_at,
        },
      ],
      categories_id: [...genre.categories_id.keys()],
      is_active: true,
      created_at: genre.created_at,
    });
  });
});
