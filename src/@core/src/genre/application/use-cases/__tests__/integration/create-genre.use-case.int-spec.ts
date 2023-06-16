import { CreateGenreUseCase } from "../../create-genre.use-case";
import { GenreSequelize } from "../../../../infra/db/sequelize/genre-sequelize";
import { setupSequelize } from "../../../../../@seedwork/infra/testing/helpers/db";
import { EntityValidationError } from "../../../../../@seedwork/domain";
import { CategorySequelize } from "../../../../../category/infra";
import { UnitOfWorkSequelize } from "../../../../../@seedwork/infra";
import { CategoriesIdsValidator } from "../../../../../category/application/validations";
import { Genre } from "../../../../domain";
import { Category } from "../../../../../category/domain";

const { GenreRepository, GenreModel, GenreCategoryModel } = GenreSequelize;
const { CategoryRepository, CategoryModel } = CategorySequelize;

describe("CreateGenreUseCase Integration Tests", () => {
  let useCase: CreateGenreUseCase.UseCase;
  let genreRepo: GenreSequelize.GenreRepository;
  let categoryRepo: CategorySequelize.CategoryRepository;
  let categoriesIdValidator: CategoriesIdsValidator;
  let unitOfWork: UnitOfWorkSequelize;

  const sequelize = setupSequelize({
    models: [GenreModel, GenreCategoryModel, CategoryModel],
  });

  beforeEach(() => {
    genreRepo = new GenreRepository(GenreModel, GenreCategoryModel);
    categoryRepo = new CategoryRepository(CategoryModel);
    categoriesIdValidator = new CategoriesIdsValidator(categoryRepo);
    unitOfWork = new UnitOfWorkSequelize(
      {
        get: async (name: string) => {
          if (name === "GenreRepository") return genreRepo;
          throw new Error("Repository not found");
        },
      },
      sequelize.sequelize
    );
    useCase = new CreateGenreUseCase.UseCase(unitOfWork, categoriesIdValidator);
  });

  it("should throw an generic error", async () => {
    const genericError = new Error("Generic Error");
    const mockCreate = jest.spyOn(Genre, "create").mockImplementation(() => {
      throw genericError;
    });
    await expect(
      useCase.execute({
        name: "test actor",
        categories_id: ["1"],
      })
    ).rejects.toThrow(genericError);
    mockCreate.mockRestore();
  });

  it("should throw an entity validation", async () => {
    try {
      await useCase.execute({
        categories_id: ["1"],
      } as any);
      fail("Should throw an entity validation error");
    } catch (e) {
      expect(e).toBeInstanceOf(EntityValidationError);
      expect(e.error).toEqual({
        name: [
          "name should not be empty",
          "name must be a string",
          "name must be shorter than or equal to 255 characters",
        ],
        categories_id: ["ID 1 must be a valid UUID"],
      });
    }
  });

  it("should create a cast member", async () => {
    const categories = Category.fake().theCategories(2).build();
    await categoryRepo.bulkInsert(categories);
    const categoriesId = categories.map((c) => c.id);

    let output = await useCase.execute({
      name: "test genre",
      categories_id: categoriesId,
    });

    let entity = await genreRepo.findById(output.id);
    expect(output).toStrictEqual({
      id: entity.id,
      name: "test genre",
      categories_id: categoriesId,
      is_active: true,
      created_at: entity.props.created_at,
    });

    output = await useCase.execute({
      name: "test genre",
      categories_id: [categories[0].id],
      is_active: true,
    });

    entity = await genreRepo.findById(output.id);
    expect(output).toStrictEqual({
      id: entity.id,
      name: "test genre",
      categories_id: [categories[0].id],
      is_active: true,
      created_at: entity.props.created_at,
    });
  });

  it("rollback transaction", async () => {
    const categories = Category.fake().theCategories(2).build();
    await categoryRepo.bulkInsert(categories);
    const categoriesId = categories.map((c) => c.id);

    const genre = Genre.fake().aGenre().build();
    genre.props.name = null;

    const mockCreate = jest
      .spyOn(Genre, "create")
      .mockImplementation(() => genre);

    await expect(
      useCase.execute({
        name: "test genre",
        categories_id: categoriesId,
      })
    ).rejects.toThrow("notNull Violation: GenreModel.name cannot be null");

    const genres = await genreRepo.findAll();
    expect(genres.length).toEqual(0);

    mockCreate.mockRestore();
  });
});
