import { InvalidUuidError, NotFoundError } from "../../../../@seedwork/domain";
import { Category, CategoryId } from "../../../../category/domain";
import { CategoryInMemoryRepository } from "../../../../category/infra";
import { CategoriesIdsValidator } from "../categories-ids.validator";

describe("CategoriesIdsValidator Tests", () => {
  let categoryRepo: CategoryInMemoryRepository;
  let validator: CategoriesIdsValidator;
  beforeEach(() => {
    categoryRepo = new CategoryInMemoryRepository();
    validator = new CategoriesIdsValidator(categoryRepo);
  });
  it("should throw an entity validation error when categories id is invalid", async () => {
    const spyFindById = jest.spyOn(categoryRepo, "findById");
    let [categoriesId, errorsCategoriesId] = await validator.validate([
      "1",
      "2",
    ]);
    expect(categoriesId).toStrictEqual(null);
    expect(errorsCategoriesId).toStrictEqual([
      new InvalidUuidError("1"),
      new InvalidUuidError("2"),
    ]);
    expect(spyFindById).not.toHaveBeenCalled();

    [categoriesId, errorsCategoriesId] = await validator.validate([
      new CategoryId().value,
      "4",
    ]);
    expect(categoriesId).toStrictEqual(null);
    expect(errorsCategoriesId).toStrictEqual([new InvalidUuidError("4")]);
    expect(spyFindById).not.toHaveBeenCalled();
  });

  it("should throw an entity validation error when categories id is not found", async () => {
    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    const spyExistsById = jest.spyOn(categoryRepo, "existsById");
    let [categoriesId, errorsCategoriesId] = await validator.validate([
      categoryId1.value,
      categoryId2.value,
    ]);
    expect(categoriesId).toStrictEqual(null);
    expect(errorsCategoriesId).toStrictEqual([
      new NotFoundError(categoryId1.value, Category),
      new NotFoundError(categoryId2.value, Category),
    ]);

    expect(spyExistsById).toHaveBeenCalledTimes(1);

    const category1 = Category.fake().aCategory().build();
    await categoryRepo.insert(category1);

    [categoriesId, errorsCategoriesId] = await validator.validate([
      category1.entityId.value,
      categoryId2.value,
    ]);
    expect(categoriesId).toStrictEqual(null);
    expect(errorsCategoriesId).toStrictEqual([
      new NotFoundError(categoryId2.value, Category),
    ]);
    expect(spyExistsById).toHaveBeenCalledTimes(2);
  });

  it("should return a list of categories id", async () => {
    const category1 = Category.fake().aCategory().build();
    const category2 = Category.fake().aCategory().build();
    await categoryRepo.bulkInsert([category1, category2]);
    const [categoriesId, errorsCategoriesId] = await validator.validate([
      category1.entityId.value,
      category2.entityId.value,
    ]);
    expect(categoriesId).toHaveLength(2);
    expect(errorsCategoriesId).toStrictEqual(null);
    expect(categoriesId[0]).toBeValueObject(category1.entityId);
    expect(categoriesId[1]).toBeValueObject(category2.entityId);
  });
});
