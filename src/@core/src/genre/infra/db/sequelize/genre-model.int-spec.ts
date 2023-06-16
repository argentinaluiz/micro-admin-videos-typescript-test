import { setupSequelize } from "#seedwork/infra/testing/helpers/db";
import { DataType } from "sequelize-typescript";
import { GenreSequelize } from "./genre-sequelize";
import { CategorySequelize } from "../../../../category/infra";
import { Category } from "../../../../category/domain";
const { CategoryModel, CategoryRepository } = CategorySequelize;
const { GenreModel, GenreCategoryModel } = GenreSequelize;

describe("GenreCategoryModel Unit Tests", () => {
  setupSequelize({
    models: [CategoryModel, GenreModel, GenreCategoryModel],
    logging: true,
  });

  test("table name", () => {
    expect(GenreCategoryModel.tableName).toBe("category_genre");
  });

  test("mapping props", () => {
    const attributesMap = GenreCategoryModel.getAttributes();
    console.dir(attributesMap.genre_id, { depth: null });
    const attributes = Object.keys(GenreCategoryModel.getAttributes());
    expect(attributes).toStrictEqual(["genre_id", "category_id"]);

    const genreIdAttr = attributesMap.genre_id;
    expect(genreIdAttr).toMatchObject({
      field: "genre_id",
      fieldName: "genre_id",
      primaryKey: true,
      type: DataType.UUID(),
      references: {
        model: "genres",
        key: "id",
      },
      unique: "category_genre_genre_id_category_id_unique",
    });

    const categoryIdAttr = attributesMap.category_id;
    expect(categoryIdAttr).toMatchObject({
      field: "category_id",
      fieldName: "category_id",
      primaryKey: true,
      type: DataType.UUID(),
      references: {
        model: "categories",
        key: "id",
      },
      unique: "category_genre_genre_id_category_id_unique",
    });
  });
});

describe("GenreModel Unit Tests", () => {
  setupSequelize({
    models: [CategoryModel, GenreModel, GenreCategoryModel],
    logging: true,
  });

  test("table name", () => {
    expect(GenreModel.tableName).toBe("genres");
  });

  test("mapping props", () => {
    const attributesMap = GenreModel.getAttributes();
    const attributes = Object.keys(GenreModel.getAttributes());
    expect(attributes).toStrictEqual(["id", "name", "is_active", "created_at"]);

    const idAttr = attributesMap.id;
    expect(idAttr).toMatchObject({
      field: "id",
      fieldName: "id",
      primaryKey: true,
      type: DataType.UUID(),
    });

    const nameAttr = attributesMap.name;
    expect(nameAttr).toMatchObject({
      field: "name",
      fieldName: "name",
      allowNull: false,
      type: DataType.STRING(255),
    });

    const isActiveAttr = attributesMap.is_active;
    expect(isActiveAttr).toMatchObject({
      field: "is_active",
      fieldName: "is_active",
      allowNull: false,
      type: DataType.BOOLEAN(),
    });

    const createdAtAttr = attributesMap.created_at;
    expect(createdAtAttr).toMatchObject({
      field: "created_at",
      fieldName: "created_at",
      allowNull: false,
      type: DataType.DATE(6),
    });
  });

  test("mapping associations", () => {
    const associationsMap = GenreModel.associations;
    const associations = Object.keys(associationsMap);
    expect(associations).toStrictEqual(['categories_id', "categories"]);

    const categoriesIdRelation = associationsMap.categories_id;
    expect(categoriesIdRelation).toMatchObject({
      associationType: "HasMany",
      source: GenreModel,
      target: GenreCategoryModel,
      options: {
        foreignKey: { name: "genre_id" },
        as: "categories_id",
      },
    });

    const categoriesRelation = associationsMap.categories;
    expect(categoriesRelation).toMatchObject({
      associationType: "BelongsToMany",
      source: GenreModel,
      target: CategoryModel,
      options: {
        through: { model: GenreCategoryModel },
        foreignKey: { name: "genre_id" },
        otherKey: { name: "category_id" },
        as: "categories",
      },
    });
  });

  test("create and association relations separately ", async () => {
    const categories = Category.fake().theCategories(3).build();
    const categoryRepo = new CategoryRepository(CategoryModel);
    await categoryRepo.bulkInsert(categories);

    const genreData = {
      id: "9366b7dc-2d71-4799-b91c-c64adb205104",
      name: "test",
      is_active: true,
      created_at: new Date(),
    };
    const genre = await GenreModel.create(genreData);
    await genre.$add("categories", [
      categories[0].id,
      categories[1].id,
      categories[2].id,
    ]);
    let genreWithCategories = await GenreModel.findByPk(genre.id, {
      include: [
        {
          model: CategoryModel,
          attributes: ["id"],
        },
      ],
    });

    expect(genreWithCategories).toMatchObject(genreData);
    expect(genreWithCategories.categories).toHaveLength(3);
    expect(genreWithCategories.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: categories[0].id,
        }),
        expect.objectContaining({
          id: categories[1].id,
        }),
        expect.objectContaining({
          id: categories[2].id,
        }),
      ])
    );

    const genreWithCategoriesId = await GenreModel.findByPk(genre.id, {
      include: ["categories_id"],
    });

    expect(genreWithCategoriesId.categories_id).toHaveLength(3);
    expect(genreWithCategoriesId.categories_id).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          genre_id: genre.id,
          category_id: categories[0].id,
        }),
        expect.objectContaining({
          genre_id: genre.id,
          category_id: categories[1].id,
        }),
        expect.objectContaining({
          genre_id: genre.id,
          category_id: categories[2].id,
        }),
      ])
    );
  });

  test("create with association in single transaction ", async () => {
    const categories = Category.fake().theCategories(3).build();
    const categoryRepo = new CategoryRepository(CategoryModel);
    await categoryRepo.bulkInsert(categories);

    const genreData = {
      id: "9366b7dc-2d71-4799-b91c-c64adb205104",
      name: "test",
      is_active: true,
      categories_id: [
        GenreCategoryModel.build({
          category_id: categories[0].id,
          genre_id: "9366b7dc-2d71-4799-b91c-c64adb205104",
        }),
        GenreCategoryModel.build({
          category_id: categories[1].id,
          genre_id: "9366b7dc-2d71-4799-b91c-c64adb205104",
        }),
        GenreCategoryModel.build({
          category_id: categories[2].id,
          genre_id: "9366b7dc-2d71-4799-b91c-c64adb205104",
        }),
      ],
      created_at: new Date(),
    };
    const genre = await GenreModel.create(genreData, {
      include: ["categories_id"],
    });
    let genreWithCategories = await GenreModel.findByPk(genre.id, {
      include: [
        {
          model: CategoryModel,
          attributes: ["id"],
        },
      ],
    });

    const { categories_id, ...genreCommonProps } = genreData;
    expect(genreWithCategories).toMatchObject(genreCommonProps);
    expect(genreWithCategories.categories).toHaveLength(3);
    expect(genreWithCategories.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: categories[0].id,
        }),
        expect.objectContaining({
          id: categories[1].id,
        }),
        expect.objectContaining({
          id: categories[2].id,
        }),
      ])
    );

    const genreWithCategoriesId = await GenreModel.findByPk(genre.id, {
      include: ["categories_id"],
    });

    expect(genreWithCategoriesId.categories_id).toHaveLength(3);
    expect(genreWithCategoriesId.categories_id).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          genre_id: genre.id,
          category_id: categories[0].id,
        }),
        expect.objectContaining({
          genre_id: genre.id,
          category_id: categories[1].id,
        }),
        expect.objectContaining({
          genre_id: genre.id,
          category_id: categories[2].id,
        }),
      ])
    );
  });
});
