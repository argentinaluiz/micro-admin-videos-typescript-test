import { GenreSequelize } from "./genre-sequelize";
import { LoadEntityError } from "#seedwork/domain";
import { Genre, GenreId } from "#genre/domain";
import { setupSequelize } from "../../../../@seedwork/infra/testing/helpers/db";
import { CategorySequelize } from "../../../../category/infra";
import { Category } from "../../../../category/domain";

const { GenreModel, GenreCategoryModel, GenreModelMapper } = GenreSequelize;
const { CategoryModel } = CategorySequelize;

describe("GenreModelMapper Unit Tests", () => {
  let categoryRepo: CategorySequelize.CategoryRepository;
  setupSequelize({ models: [CategoryModel, GenreModel, GenreCategoryModel] });

  beforeEach(() => {
    categoryRepo = new CategorySequelize.CategoryRepository(CategoryModel);
  });

  it("should throws error when genre is invalid", () => {
    const arrange = [
      {
        makeModel: () => {
          return GenreModel.build({
            id: "9366b7dc-2d71-4799-b91c-c64adb205104",
          });
        },
        expectedErrors: {
          name: [
            "name should not be empty",
            "name must be a string",
            "name must be shorter than or equal to 255 characters",
          ],
          categories_id: ["categories_id should not be empty"],
        },
      },
      {
        makeModel: () => {
          const model = GenreModel.build();
          jest.spyOn(model, "toJSON").mockImplementation(() => ({
            id: "9366b7dc-2d71-4799-b91c-c64adb205104",
            categories_id: undefined,
          }));
          return model;
        },
        expectedErrors: {
          name: [
            "name should not be empty",
            "name must be a string",
            "name must be shorter than or equal to 255 characters",
          ],
          categories_id: ["categories_id should not be empty"],
        },
      },
      {
        makeModel: () => {
          const model = GenreModel.build();
          jest.spyOn(model, "toJSON").mockImplementation(() => ({
            id: "9366b7dc-2d71-4799-b91c-c64adb205104",
            categories_id: [],
          }));
          return model;
        },
        expectedErrors: {
          name: [
            "name should not be empty",
            "name must be a string",
            "name must be shorter than or equal to 255 characters",
          ],
          categories_id: ["categories_id should not be empty"],
        },
      },
      {
        makeModel: () => {
          const model = GenreModel.build();
          jest.spyOn(model, "toJSON").mockImplementation(() => ({
            id: "9366b7dc-2d71-4799-b91c-c64adb205104",
            categories_id: [undefined],
          }));
          return model;
        },
        expectedErrors: {
          name: [
            "name should not be empty",
            "name must be a string",
            "name must be shorter than or equal to 255 characters",
          ],
          categories_id: [
            "The category is not a GenreCategoryModel or it has a category_id property. Actually is a undefined",
          ],
        },
      },
      {
        makeModel: () => {
          const model = GenreModel.build();
          jest.spyOn(model, "toJSON").mockImplementation(() => ({
            id: "9366b7dc-2d71-4799-b91c-c64adb205104",
            categories_id: [
              GenreCategoryModel.build({
                category_id: "1",
              }),
            ],
          }));
          return model;
        },
        expectedErrors: {
          name: [
            "name should not be empty",
            "name must be a string",
            "name must be shorter than or equal to 255 characters",
          ],
          categories_id: ["ID 1 must be a valid UUID"],
        },
      },
    ];

    for (const item of arrange) {
      try {
        GenreModelMapper.toEntity(item.makeModel());
        fail("The genre is valid, but it needs throws a LoadEntityError");
      } catch (e) {
        expect(e).toBeInstanceOf(LoadEntityError);
        expect(e.error).toMatchObject(item.expectedErrors);
      }
    }
  });

  it("should throw a generic error", () => {
    const error = new Error("Generic Error");
    const spyValidate = jest.spyOn(Genre, "validate").mockImplementation(() => {
      throw error;
    });
    const model = GenreModel.build({
      id: "9366b7dc-2d71-4799-b91c-c64adb205104",
    });
    expect(() => GenreModelMapper.toEntity(model)).toThrow(error);
    expect(spyValidate).toHaveBeenCalled();
    spyValidate.mockRestore();
  });

  it("should convert a genre model to a genre entity", async () => {
    const category1 = Category.fake().aCategory().build();
    const category2 = Category.fake().aCategory().build();
    await categoryRepo.bulkInsert([category1, category2]);
    const created_at = new Date();
    const model = await GenreModel.create(
      {
        id: "5490020a-e866-4229-9adc-aa44b83234c4",
        name: "some value",
        is_active: true,
        created_at,
        categories_id: [
          GenreCategoryModel.build({
            genre_id: "5490020a-e866-4229-9adc-aa44b83234c4",
            category_id: category1.id,
          }),
          GenreCategoryModel.build({
            genre_id: "5490020a-e866-4229-9adc-aa44b83234c4",
            category_id: category2.id,
          }),
        ],
      },
      { include: ["categories_id"] }
    );
    const entity = GenreModelMapper.toEntity(model);
    expect(entity.toJSON()).toEqual(
      Genre.create(
        {
          name: "some value",
          categories_id: [category1.id, category2.id],
          is_active: true,
          created_at,
        },
        new GenreId("5490020a-e866-4229-9adc-aa44b83234c4")
      ).toJSON()
    );
  });
});
