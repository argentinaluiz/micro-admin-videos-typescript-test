import { CreateGenreUseCase } from "../../create-genre.use-case";
import { GenreInMemoryRepository } from "../../../../infra/db/in-memory/genre-in-memory.repository";
import {
  Either,
  EntityValidationError,
  InvalidUuidError,
  NotFoundError,
} from "../../../../../@seedwork/domain";
import { Genre } from "../../../../domain";
import { CategoryInMemoryRepository } from "../../../../../category/infra";
import { Category, CategoryId } from "../../../../../category/domain";
import { CategoriesIdsValidator } from "../../../../../category/application/validations/categories-ids.validator";
import { UnitOfWorkInMemory } from "../../../../../@seedwork/infra/db/in-memory/unit-of-work-in-memory";

describe("CreateGenreUseCase Unit Tests", () => {
  let useCase: CreateGenreUseCase.UseCase;
  let genreRepo: GenreInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;
  let categoriesIdsValidator: CategoriesIdsValidator;
  let uow: UnitOfWorkInMemory;

  beforeEach(() => {
    uow = new UnitOfWorkInMemory({
      async get(repoName) {
        if (repoName === "GenreRepository") return genreRepo;
        throw new Error("Repository not found");
      },
    });
    genreRepo = new GenreInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    categoriesIdsValidator = new CategoriesIdsValidator(categoryRepo);
    useCase = new CreateGenreUseCase.UseCase(uow, categoriesIdsValidator);
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

  // describe("validateCategoriesId", () => {
  //   it("should throw an entity validation error when categories id is invalid", async () => {
  //     const spyFindById = jest.spyOn(categoryRepo, "findById");
  //     let [categoriesId, errorsCategoriesId] = await useCase[
  //       "validateCategoriesId"
  //     ](["1", "2"]);
  //     expect(categoriesId).toStrictEqual(null);
  //     expect(errorsCategoriesId).toStrictEqual([
  //       new InvalidUuidError("1"),
  //       new InvalidUuidError("2"),
  //     ]);
  //     expect(spyFindById).not.toHaveBeenCalled();

  //     [categoriesId, errorsCategoriesId] = await useCase[
  //       "validateCategoriesId"
  //     ]([new CategoryId().value, "4"]);
  //     expect(categoriesId).toStrictEqual(null);
  //     expect(errorsCategoriesId).toStrictEqual([new InvalidUuidError("4")]);
  //     expect(spyFindById).not.toHaveBeenCalled();
  //   });

  //   it("should throw an entity validation error when categories id is not found", async () => {
  //     const categoryId1 = new CategoryId();
  //     const categoryId2 = new CategoryId();
  //     const spyExistsById = jest.spyOn(categoryRepo, "existsById");
  //     let [categoriesId, errorsCategoriesId] = await useCase[
  //       "validateCategoriesId"
  //     ]([categoryId1.value, categoryId2.value]);
  //     expect(categoriesId).toStrictEqual(null);
  //     expect(errorsCategoriesId).toStrictEqual([
  //       new NotFoundError(categoryId1.value, Category),
  //       new NotFoundError(categoryId2.value, Category),
  //     ]);

  //     expect(spyExistsById).toHaveBeenCalledTimes(1);

  //     const category1 = Category.fake().aCategory().build();
  //     await categoryRepo.insert(category1);

  //     [categoriesId, errorsCategoriesId] = await useCase[
  //       "validateCategoriesId"
  //     ]([category1.entityId.value, categoryId2.value]);
  //     expect(categoriesId).toStrictEqual(null);
  //     expect(errorsCategoriesId).toStrictEqual([
  //       new NotFoundError(categoryId2.value, Category),
  //     ]);
  //     expect(spyExistsById).toHaveBeenCalledTimes(2);
  //   });

  //   it("should return a list of categories id", async () => {
  //     const category1 = Category.fake().aCategory().build();
  //     const category2 = Category.fake().aCategory().build();
  //     await categoryRepo.bulkInsert([category1, category2]);
  //     const [categoriesId, errorsCategoriesId] = await useCase[
  //       "validateCategoriesId"
  //     ]([category1.entityId.value, category2.entityId.value]);
  //     expect(categoriesId).toHaveLength(2);
  //     expect(errorsCategoriesId).toStrictEqual(null);
  //     expect(categoriesId[0]).toBeValueObject(category1.entityId);
  //     expect(categoriesId[1]).toBeValueObject(category2.entityId);
  //   });
  // });

  describe("execute method", () => {
    it("should throw an entity validation error when categories id is invalid", async () => {
      expect.assertions(4);
      jest.spyOn(Genre, "create").mockImplementation(() => {
        throw new EntityValidationError();
      });
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      const spyValidateCategoriesId = jest.spyOn(
        categoriesIdsValidator,
        "validate"
      );
      try {
        await useCase.execute({
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
      jest.spyOn(Genre, "create").mockImplementation(() => {
        throw new EntityValidationError();
      });
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      const spyValidateCategoriesId = jest.spyOn(
        categoriesIdsValidator,
        "validate"
      );
      const categoryId1 = new CategoryId();
      const categoryId2 = new CategoryId();
      try {
        await useCase.execute({
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
      const expectedError = new EntityValidationError({
        name: ["is required"],
      });
      jest.spyOn(Genre, "validate").mockImplementation(() => {
        throw expectedError;
      });
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      try {
        await useCase.execute({
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
      const expectedError = new Error("generic error");
      jest.spyOn(genreRepo, "insert").mockRejectedValue(expectedError);
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      const categoryId = new CategoryId();
      jest
        .spyOn(categoriesIdsValidator, "validate")
        .mockImplementation(() => Promise.resolve(Either.ok([categoryId])));
      await expect(
        useCase.execute({
          name: "test",
          categories_id: [categoryId.value],
        })
      ).rejects.toThrowError(expectedError);
      expect(spyHandleError).toHaveBeenLastCalledWith(expectedError, null);
    });

    it("should create a genre", async () => {
      const category1 = Category.fake().aCategory().build();
      const category2 = Category.fake().aCategory().build();
      await categoryRepo.bulkInsert([category1, category2]);
      const spyInsert = jest.spyOn(genreRepo, "insert");
      const spyUowDo = jest.spyOn(uow, "do");
      let output = await useCase.execute({
        name: "test",
        categories_id: [category1.entityId.value, category2.entityId.value],
      });
      expect(spyUowDo).toHaveBeenCalledTimes(1);
      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: genreRepo.items[0].id,
        name: "test",
        categories_id: [category1.entityId.value, category2.entityId.value],
        is_active: true,
        created_at: genreRepo.items[0].created_at,
      });

      output = await useCase.execute({
        name: "test",
        categories_id: [category1.entityId.value, category2.entityId.value],
        is_active: false,
      });
      expect(spyInsert).toHaveBeenCalledTimes(2);
      expect(spyUowDo).toHaveBeenCalledTimes(2);
      expect(output).toStrictEqual({
        id: genreRepo.items[1].id,
        name: "test",
        categories_id: [category1.entityId.value, category2.entityId.value],
        is_active: false,
        created_at: genreRepo.items[1].created_at,
      });
    });
  });
});
