import { UpdateGenreUseCase } from "../../update-genre.use-case";
import NotFoundError from "../../../../../@seedwork/domain/errors/not-found.error";
import { GenreSequelize } from "../../../../infra/db/sequelize/genre-sequelize";
import { setupSequelize } from "../../../../../@seedwork/infra/testing/helpers/db";
import { EntityValidationError } from "../../../../../@seedwork/domain";
import { Genre } from "../../../../domain";
import { CategorySequelize } from "../../../../../category/infra";
import { CategoriesIdsValidator } from "../../../../../category/application/validations";
import { UnitOfWorkSequelize } from "../../../../../@seedwork/infra";
import { Category } from "../../../../../category/domain";

const { GenreRepository, GenreModel, GenreCategoryModel } = GenreSequelize;
const { CategoryRepository, CategoryModel } = CategorySequelize;
describe("UpdateGenreUseCase Integration Tests", () => {
  let useCase: UpdateGenreUseCase.UseCase;
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
    useCase = new UpdateGenreUseCase.UseCase(unitOfWork, categoriesIdValidator);
  });

  it("should throws error when entity not found", async () => {
    await expect(() =>
      useCase.execute({ id: "fake id", name: "fake" } as any)
    ).rejects.toThrow(new NotFoundError("fake id", Genre));
  });

  it("should throw an generic error", async () => {
    const categories = Category.fake().theCategories(2).build();
    await categoryRepo.bulkInsert(categories);
    const entity = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .build();
    await genreRepo.insert(entity);
    const genericError = new Error("Generic Error");
    jest.spyOn(genreRepo, "update").mockRejectedValue(genericError);
    await expect(
      useCase.execute({
        id: entity.id,
        name: "test genre",
        categories_id: [categories[0].id],
      })
    ).rejects.toThrow(genericError);
  });

  it("should throw an entity validation", async () => {
    const categories = Category.fake().theCategories(2).build();
    await categoryRepo.bulkInsert(categories);
    const entity = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .build();
    await genreRepo.insert(entity);
    try {
      await useCase.execute({ id: entity.id } as any);
      fail("Should throw an entity validation error");
    } catch (e) {
      expect(e).toBeInstanceOf(EntityValidationError);
      expect(e.error).toEqual({
        name: [
          "name should not be empty",
          "name must be a string",
          "name must be shorter than or equal to 255 characters",
        ],
        categories_id: ["ID undefined must be a valid UUID"],
      });
    }
  });

  it("should update a cast member", async () => {
    const categories = Category.fake().theCategories(3).build();
    await categoryRepo.bulkInsert(categories);
    const entity = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .build();
    await genreRepo.insert(entity);

    let output = await useCase.execute({
      id: entity.id,
      name: "test",
      categories_id: [categories[0].id],
    });
    expect(output).toStrictEqual({
      id: entity.id,
      name: "test",
      categories_id: expect.arrayContaining([categories[0].id]),
      is_active: true,
      created_at: entity.created_at,
    });

    type Arrange = {
      input: UpdateGenreUseCase.Input;
      expected: UpdateGenreUseCase.Output;
    };

    const arrange: Arrange[] = [
      {
        input: {
          id: entity.id,
          name: "test changed",
          categories_id: [categories[1].id, categories[2].id],
          is_active: true,
        },
        expected: {
          id: entity.id,
          name: "test changed",
          categories_id: expect.arrayContaining([
            categories[1].id,
            categories[2].id,
          ]),
          is_active: true,
          created_at: entity.created_at,
        },
      },
      {
        input: {
          id: entity.id,
          name: "test changed",
          categories_id: [categories[1].id, categories[2].id],
          is_active: false,
        },
        expected: {
          id: entity.id,
          name: "test changed",
          categories_id: expect.arrayContaining([
            categories[1].id,
            categories[2].id,
          ]),
          is_active: false,
          created_at: entity.created_at,
        },
      },
      {
        input: {
          id: entity.id,
          name: "test changed",
          categories_id: [categories[1].id],
        },
        expected: {
          id: entity.id,
          name: "test changed",
          categories_id: expect.arrayContaining([categories[1].id]),
          is_active: false,
          created_at: entity.created_at,
        },
      },
    ];

    for (const i of arrange) {
      output = await useCase.execute(i.input);
      console.log(output);
      const entityUpdated = await genreRepo.findById(i.input.id);
      console.log(entityUpdated);
      expect(output).toStrictEqual({
        id: entity.id,
        name: i.expected.name,
        categories_id: i.expected.categories_id,
        is_active: i.expected.is_active,
        created_at: i.expected.created_at,
      });
      expect(entityUpdated.toJSON()).toStrictEqual({
        id: entity.id,
        name: i.expected.name,
        categories_id: i.expected.categories_id,
        is_active: i.expected.is_active,
        created_at: i.expected.created_at,
      });
    }
  });

  it("rollback transaction", async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const entity = Genre.fake()
      .aGenre()
      .withCategoryId(category.entityId)
      .build();
    await genreRepo.insert(entity);

    GenreModel.afterBulkUpdate("hook-test", () => {
      console.log("afterUpdate");
      return Promise.reject(new Error("Generic Error"));
    });

    await expect(
      useCase.execute({
        id: entity.id,
        name: "test",
        categories_id: [category.id],
      })
    ).rejects.toThrow(new Error("Generic Error"));

    GenreModel.removeHook("afterBulkUpdate", "hook-test");

    const notUpdatedGenre = await genreRepo.findById(entity.id);
    expect(notUpdatedGenre.name).toStrictEqual(entity.name);
  });
});
