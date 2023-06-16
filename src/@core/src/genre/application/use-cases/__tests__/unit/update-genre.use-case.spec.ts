import { UpdateGenreUseCase } from "../../update-genre.use-case";
import { GenreInMemoryRepository } from "../../../../infra/db/in-memory/genre-in-memory.repository";
import NotFoundError from "../../../../../@seedwork/domain/errors/not-found.error";
import { Genre } from "../../../../domain/entities/genre";
import {
  Either,
  EntityValidationError,
  InvalidUuidError,
} from "../../../../../@seedwork/domain";
import { CategoriesIdsValidator } from "../../../../../category/application/validations/categories-ids.validator";
import { CategoryInMemoryRepository } from "../../../../../category/infra";
import { Category, CategoryId } from "../../../../../category/domain";
import { UnitOfWorkInterface } from "../../../../../@seedwork/domain/persistence/unit-of-work-interface";
import { UnitOfWorkInMemory } from "../../../../../@seedwork/infra/db/in-memory/unit-of-work-in-memory";

describe("UpdateGenreUseCase Unit Tests", () => {
  let useCase: UpdateGenreUseCase.UseCase;
  let genreRepo: GenreInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;
  let categoriesIdsValidator: CategoriesIdsValidator;
  let uow: UnitOfWorkInterface;

  beforeEach(() => {
    genreRepo = new GenreInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    categoriesIdsValidator = new CategoriesIdsValidator(categoryRepo);
    uow = new UnitOfWorkInMemory({
      async get(repoName) {
        if (repoName === "GenreRepository") return genreRepo;
        throw new Error("Repository not found");
      },
    });
    useCase = new UpdateGenreUseCase.UseCase(uow, categoriesIdsValidator);
    jest.restoreAllMocks();
  });

  describe("handleError method", () => {
    it("should throw a generic error", () => {
      let error = new Error("error test");
      expect(() => useCase["handleError"](error, null)).toThrowError(error);

      expect(() =>
        useCase["handleError"](error, [new Error("categories id error")])
      ).toThrowError(error);
    });

    it("should throw an entity validation error", () => {
      let error = new EntityValidationError({ name: ["error test"] });
      expect(() => useCase["handleError"](error, null)).toThrowError(error);

      expect(() =>
        useCase["handleError"](error, [new Error("categories id error")])
      ).toThrowError(error);
      expect(error.error).toStrictEqual({
        name: ["error test"],
        categories_id: ["categories id error"],
      });
    });
  });

  describe("execute method", () => {
    it("should throw an entity validation error when categories id is invalid", async () => {
      expect.assertions(4);
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      const spyValidateCategoriesId = jest.spyOn(
        categoriesIdsValidator,
        "validate"
      );
      try {
        await useCase.execute({
          id: genre.id,
          name: "test",
          categories_id: ["1", "2"],
        });
      } catch (e) {
        expect(spyValidateCategoriesId).toHaveBeenCalledWith(["1", "2"]);
        expect(spyHandleError).toHaveBeenLastCalledWith(e, [
          new InvalidUuidError("1"),
          new InvalidUuidError("2"),
        ]);
        expect(e).toBeInstanceOf(EntityValidationError);
        expect(e.error).toStrictEqual({
          categories_id: [
            "ID 1 must be a valid UUID",
            "ID 2 must be a valid UUID",
          ],
        });
      }
    });

    it("should throw an entity validation error when categories id not found", async () => {
      expect.assertions(4);
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      const spyValidateCategoriesId = jest.spyOn(
        categoriesIdsValidator,
        "validate"
      );
      const categoryId1 = new CategoryId();
      const categoryId2 = new CategoryId();
      try {
        await useCase.execute({
          id: genre.id,
          name: "test",
          categories_id: [categoryId1.value, categoryId2.value],
        });
      } catch (e) {
        expect(spyValidateCategoriesId).toHaveBeenCalledWith([
          categoryId1.value,
          categoryId2.value,
        ]);
        expect(spyHandleError).toHaveBeenLastCalledWith(e, [
          new NotFoundError(categoryId1.value, Category),
          new NotFoundError(categoryId2.value, Category),
        ]);
        expect(e).toBeInstanceOf(EntityValidationError);
        expect(e.error).toStrictEqual({
          categories_id: [
            `Category Not Found using ID (${categoryId1.value})`,
            `Category Not Found using ID (${categoryId2.value})`,
          ],
        });
      }
    });

    it("should throw an entity validation error", async () => {
      expect.assertions(2);
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const expectedError = new EntityValidationError({
        name: ["is required"],
      });
      jest.spyOn(Genre, "validate").mockImplementation(() => {
        throw expectedError;
      });
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      try {
        await useCase.execute({
          id: genre.id,
          name: "test",
          categories_id: ["1", "2"],
        });
      } catch (e) {
        expect(spyHandleError).toHaveBeenLastCalledWith(expectedError, [
          new InvalidUuidError("1"),
          new InvalidUuidError("2"),
        ]);
        console.log(e);
        expect(e.error).toStrictEqual({
          name: ["is required"],
          categories_id: [
            `ID 1 must be a valid UUID`,
            `ID 2 must be a valid UUID`,
          ],
        });
      }
    });

    it("should throw an generic error", async () => {
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const expectedError = new Error("generic error");
      jest.spyOn(genreRepo, "update").mockRejectedValue(expectedError);
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      const categoryId = new CategoryId();
      jest
        .spyOn(categoriesIdsValidator, "validate")
        .mockImplementation(() => Promise.resolve(Either.ok([categoryId])));
      await expect(
        useCase.execute({
          id: genre.id,
          name: "test",
          categories_id: [categoryId.value],
        })
      ).rejects.toThrowError(expectedError);
      expect(spyHandleError).toHaveBeenLastCalledWith(expectedError, null);
    });

    it("should update a genre", async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const genre = Genre.fake().aGenre().withCategoryId(category.id).build();
      await genreRepo.insert(genre);
      const spyUowDo = jest.spyOn(uow, "do");
      const spyUpdate = jest.spyOn(genreRepo, "update");

      let output = await useCase.execute({
        id: genre.id,
        name: "test",
        categories_id: [category.id],
      });
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: genre.id,
        name: "test",
        categories_id: [genre.categories_id.values().next().value.value],
        is_active: genre.is_active,
        created_at: genre.created_at,
      });

      type Arrange = {
        input: {
          id: string;
          name: string;
          categories_id?: string[];
          is_active?: boolean;
        };
        expected: {
          id: string;
          name: string;
          categories_id?: string[];
          is_active?: boolean;
          created_at: Date;
        };
      };

      const categories = Category.fake().theCategories(4).build();
      await categoryRepo.bulkInsert(categories);

      const arrange: Arrange[] = [
        {
          input: {
            id: genre.id,
            name: "test changed",
            categories_id: [categories[0].id],
          },
          expected: {
            id: genre.id,
            name: "test changed",
            categories_id: [categories[0].id],
            is_active: true,
            created_at: genre.created_at,
          },
        },
        {
          input: {
            id: genre.id,
            name: "test changed 3",
            categories_id: [categories[0].id, categories[1].id],
            is_active: false,
          },
          expected: {
            id: genre.id,
            name: "test changed 3",
            categories_id: [categories[0].id, categories[1].id],
            is_active: false,
            created_at: genre.created_at,
          },
        },
      ];

      for (const [index, item] of arrange.entries()) {
        output = await useCase.execute(item.input);
        expect(spyUowDo).toHaveBeenCalledTimes(index + 2);
        expect(output).toStrictEqual({
          id: genre.id,
          name: item.expected.name,
          categories_id: item.expected.categories_id,
          is_active: item.expected.is_active,
          created_at: item.expected.created_at,
        });
      }
    });
  });
});
