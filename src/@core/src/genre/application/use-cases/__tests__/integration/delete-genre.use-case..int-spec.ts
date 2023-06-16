import { DeleteGenreUseCase } from "../../delete-genre.use-case";
import NotFoundError from "../../../../../@seedwork/domain/errors/not-found.error";
import { setupSequelize } from "../../../../../@seedwork/infra/testing/helpers/db";
import { Genre } from "../../../../domain";
import { CategorySequelize } from "../../../../../category/infra";
import { GenreSequelize } from "../../../../infra";
import { UnitOfWorkSequelize } from "../../../../../@seedwork/infra";
import { Category } from "../../../../../category/domain";

const { GenreRepository, GenreModel, GenreCategoryModel } = GenreSequelize;
const { CategoryRepository, CategoryModel } = CategorySequelize;

describe("DeleteGenreUseCase Integration Tests", () => {
  let useCase: DeleteGenreUseCase.UseCase;
  let genreRepo: GenreSequelize.GenreRepository;
  let categoryRepo: CategorySequelize.CategoryRepository;
  let unitOfWork: UnitOfWorkSequelize;

  const sequelize = setupSequelize({
    models: [GenreModel, GenreCategoryModel, CategoryModel],
  });

  beforeEach(() => {
    genreRepo = new GenreRepository(GenreModel, GenreCategoryModel);
    categoryRepo = new CategoryRepository(CategoryModel);
    unitOfWork = new UnitOfWorkSequelize(
      {
        get: async (name: string) => {
          if (name === "GenreRepository") return genreRepo;
          throw new Error("Repository not found");
        },
      },
      sequelize.sequelize
      );
    useCase = new DeleteGenreUseCase.UseCase(unitOfWork);
  });

  it("should throws error when entity not found", async () => {
    await expect(() => useCase.execute({ id: "fake id" })).rejects.toThrow(
      new NotFoundError("fake id", Genre)
    );
  });

  it("should delete a cast member", async () => {
    const categories = Category.fake().theCategories(2).build();
    await categoryRepo.bulkInsert(categories);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .build();
    await genreRepo.insert(genre);
    await useCase.execute({
      id: genre.id,
    });
    await expect(genreRepo.findById(genre.id)).rejects.toThrow(
      new NotFoundError(genre.id, Genre)
    );
  });

  it("rollback transaction", async () => {
    const categories = Category.fake().theCategories(2).build();
    await categoryRepo.bulkInsert(categories);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .build();
    await genreRepo.insert(genre);

    GenreModel.afterBulkDestroy('hook-test',() => {
      return Promise.reject(new Error("Generic Error"));
    });

    await expect(
      useCase.execute({
        id: genre.id,
      })
    ).rejects.toThrow("Generic Error");

    GenreModel.removeHook('afterBulkDestroy', 'hook-test');

    const genres = await genreRepo.findAll();
    expect(genres.length).toEqual(1);
  });
});
