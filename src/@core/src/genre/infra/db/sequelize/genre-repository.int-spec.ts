import { GenreSequelize } from "./genre-sequelize";
import { Genre, GenreRepository } from "#genre/domain";
import {
  UniqueEntityId,
  NotFoundError,
  UnitOfWorkInterface,
} from "#seedwork/domain";
import { setupSequelize } from "#seedwork/infra/testing/helpers/db";
import { CategorySequelize } from "../../../../category/infra";
import { Category } from "../../../../category/domain";
import { UnitOfWorkSequelize } from "../../../../@seedwork/infra";

const {
  GenreModel,
  GenreCategoryModel,
  GenreModelMapper,
  GenreRepository: GenreSequelizeRepository,
} = GenreSequelize;

describe("GenreSequelizeRepository Unit Tests", () => {
  const sequelizeInst = setupSequelize({
    models: [GenreModel, GenreCategoryModel, CategorySequelize.CategoryModel],
  });
  let genreRepo: GenreSequelize.GenreRepository;
  let categoryRepo: CategorySequelize.CategoryRepository;

  beforeEach(async () => {
    genreRepo = new GenreSequelizeRepository(GenreModel, GenreCategoryModel);
    categoryRepo = new CategorySequelize.CategoryRepository(
      CategorySequelize.CategoryModel
    );
  });

  it("should inserts a new entity", async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    let genre = Genre.fake().aGenre().withCategoryId(category.entityId).build();
    await genreRepo.insert(genre);
    let newGenre = await genreRepo.findById(genre.id);
    expect(newGenre.toJSON()).toStrictEqual(genre.toJSON());
  });

  it("should bulk inserts new entities", async () => {
    const categories = Category.fake().theCategories(3).build();
    await categoryRepo.bulkInsert(categories);
    let genres = Genre.fake()
      .theGenres(2)
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .withCategoryId(categories[2].entityId)
      .build();
    await genreRepo.bulkInsert(genres);
    let newGenres = await genreRepo.findAll();
    expect(newGenres.length).toBe(2);
    expect(newGenres[0].toJSON()).toStrictEqual({
      ...genres[0].toJSON(),
      categories_id: expect.arrayContaining([
        categories[0].id,
        categories[1].id,
        categories[2].id,
      ]),
    });
    expect(newGenres[1].toJSON()).toStrictEqual({
      ...genres[1].toJSON(),
      categories_id: expect.arrayContaining([
        categories[0].id,
        categories[1].id,
        categories[2].id,
      ]),
    });
  });

  it("should throws error when entity not found", async () => {
    await expect(genreRepo.findById("fake id")).rejects.toThrow(
      new NotFoundError("fake id", Genre)
    );

    await expect(
      genreRepo.findById(
        new UniqueEntityId("9366b7dc-2d71-4799-b91c-c64adb205104")
      )
    ).rejects.toThrow(
      new NotFoundError(`9366b7dc-2d71-4799-b91c-c64adb205104`, Genre)
    );
  });

  it("should finds a entity by id", async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    let genre = Genre.fake().aGenre().withCategoryId(category.entityId).build();
    await genreRepo.insert(genre);

    let entityFound = await genreRepo.findById(genre.id);
    expect(genre.toJSON()).toStrictEqual(entityFound.toJSON());

    entityFound = await genreRepo.findById(genre.entityId);
    expect(genre.toJSON()).toStrictEqual(entityFound.toJSON());
  });

  it("should return all categories", async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const entity = Genre.fake()
      .aGenre()
      .withCategoryId(category.entityId)
      .build();
    await genreRepo.insert(entity);
    const entities = await genreRepo.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));
  });

  it("should throw error on update when a entity not found", async () => {
    const entity = Genre.fake().aGenre().build();
    await expect(genreRepo.update(entity)).rejects.toThrow(
      new NotFoundError(entity.id, Genre)
    );
  });

  it("should update a entity", async () => {
    const categories = Category.fake().theCategories(3).build();
    await categoryRepo.bulkInsert(categories);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .build();
    const genreNotChanged = Genre.fake()
      .aGenre()
      .withCategoryId(categories[2].entityId)
      .build();
    await genreRepo.bulkInsert([genre, genreNotChanged]);

    genre.update("Movie updated");
    genre.updateCategoriesId([categories[1].entityId]);

    await genreRepo.update(genre);

    let entityFound = await genreRepo.findById(genre.id);
    expect(genre.toJSON()).toStrictEqual(entityFound.toJSON());

    let genreNotChangedCopy = await genreRepo.findById(genreNotChanged.id);
    expect(genreNotChangedCopy.toJSON()).toStrictEqual(
      genreNotChanged.toJSON()
    );

    genre.updateCategoriesId([categories[1].entityId, categories[0].entityId]);
    await genreRepo.update(genre);

    entityFound = await genreRepo.findById(genre.id);
    expect(genre.toJSON()).toStrictEqual({
      ...entityFound.toJSON(),
      categories_id: expect.arrayContaining([
        categories[0].id,
        categories[1].id,
      ]),
    });
  });

  it("should throw error on delete when a entity not found", async () => {
    await expect(genreRepo.delete("fake id")).rejects.toThrow(
      new NotFoundError("fake id", Genre)
    );

    await expect(
      genreRepo.delete(
        new UniqueEntityId("9366b7dc-2d71-4799-b91c-c64adb205104")
      )
    ).rejects.toThrow(
      new NotFoundError("9366b7dc-2d71-4799-b91c-c64adb205104", Genre)
    );
  });

  it("should delete a entity", async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(category.entityId)
      .build();
    const genreNotDeleted = Genre.fake()
      .aGenre()
      .withCategoryId(category.entityId)
      .build();
    await genreRepo.bulkInsert([genre, genreNotDeleted]);

    await genreRepo.delete(genre.id);
    const genreFound = await GenreModel.findByPk(genre.id);
    expect(genreFound).toBeNull();

    await expect(
      GenreModel.findByPk(genreNotDeleted.id)
    ).resolves.not.toBeNull();

    await expect(GenreCategoryModel.count()).resolves.toBe(1);
  });

  describe("search method tests", () => {
    it("should order by created_at DESC when search params are null", async () => {
      const categories = Category.fake().theCategories(3).build();
      await categoryRepo.bulkInsert(categories);
      const genres = Genre.fake()
        .theGenres(16)
        .withCreatedAt((index) => new Date(new Date().getTime() + 100 + index))
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCategoryId(categories[2].entityId)
        .build();
      await genreRepo.bulkInsert(genres);
      const spyToEntity = jest.spyOn(GenreModelMapper, "toEntity");
      const searchOutput = await genreRepo.search(
        GenreRepository.SearchParams.create()
      );
      expect(searchOutput).toBeInstanceOf(GenreRepository.SearchResult);
      expect(spyToEntity).toHaveBeenCalledTimes(15);
      expect(searchOutput.toJSON()).toMatchObject({
        total: 16,
        current_page: 1,
        last_page: 2,
        per_page: 15,
        sort: null,
        sort_dir: null,
        filter: null,
      });

      [...genres.slice(1, 16)].reverse().forEach((item, index) => {
        expect(searchOutput.items[index]).toBeInstanceOf(Genre);
        const expected = searchOutput.items[index].toJSON();
        expect(item.toJSON()).toStrictEqual({
          ...expected,
          categories_id: expect.arrayContaining([
            categories[0].id,
            categories[1].id,
            categories[2].id,
          ]),
        });
      });
    });

    it("should apply paginate and filter by name", async () => {
      const categories = Category.fake().theCategories(3).build();
      await categoryRepo.bulkInsert(categories);
      const genres = [
        Genre.fake()
          .aGenre()
          .withName("test")
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .build(),
        Genre.fake()
          .aGenre()
          .withName("a")
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .build(),
        Genre.fake()
          .aGenre()
          .withName("TEST")
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .build(),
        Genre.fake()
          .aGenre()
          .withName("TeSt")
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .build(),
      ];
      await genreRepo.bulkInsert(genres);

      let searchOutput = await genreRepo.search(
        GenreRepository.SearchParams.create({
          page: 1,
          per_page: 2,
          filter: { name: "TEST" },
        })
      );

      let expected = new GenreRepository.SearchResult({
        items: [genres[0], genres[2]],
        total: 3,
        current_page: 1,
        per_page: 2,
        sort: null,
        sort_dir: null,
        filter: { name: "TEST" },
      }).toJSON(true);
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [
          {
            ...expected.items[0],
            categories_id: expect.arrayContaining([
              categories[0].id,
              categories[1].id,
              categories[2].id,
            ]),
          },
          {
            ...expected.items[1],
            categories_id: expect.arrayContaining([
              categories[0].id,
              categories[1].id,
              categories[2].id,
            ]),
          },
        ],
      });

      expected = new GenreRepository.SearchResult({
        items: [genres[3]],
        total: 3,
        current_page: 2,
        per_page: 2,
        sort: null,
        sort_dir: null,
        filter: { name: "TEST" },
      }).toJSON(true);
      searchOutput = await genreRepo.search(
        GenreRepository.SearchParams.create({
          page: 2,
          per_page: 2,
          filter: { name: "TEST" },
        })
      );
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [
          {
            ...expected.items[0],
            categories_id: expect.arrayContaining([
              categories[0].id,
              categories[1].id,
              categories[2].id,
            ]),
          },
        ],
      });
    });

    it("should apply paginate and filter by categories_id", async () => {
      const categories = Category.fake().theCategories(4).build();
      await categoryRepo.bulkInsert(categories);
      const genres = [
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[3].entityId)
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withCreatedAt(new Date(new Date().getTime() + 5000))
          .build(),
      ];
      await genreRepo.bulkInsert(genres);

      const arrange = [
        {
          params: GenreRepository.SearchParams.create({
            page: 1,
            per_page: 2,
            filter: { categories_id: [categories[0].id] },
          }),
          result: {
            items: [genres[2], genres[1]],
            total: 3,
            current_page: 1,
            per_page: 2,
            sort: null,
            sort_dir: null,
          },
        },
        {
          params: GenreRepository.SearchParams.create({
            page: 2,
            per_page: 2,
            filter: { categories_id: [categories[0].id] },
          }),
          result: {
            items: [genres[0]],
            total: 3,
            current_page: 2,
            per_page: 2,
            sort: null,
            sort_dir: null,
          },
        },
        {
          params: GenreRepository.SearchParams.create({
            page: 1,
            per_page: 2,
            filter: { categories_id: [categories[0].id, categories[1].id] },
          }),
          result: {
            items: [genres[4], genres[2]],
            total: 4,
            current_page: 1,
            per_page: 2,
            sort: null,
            sort_dir: null,
          },
        },
        {
          params: GenreRepository.SearchParams.create({
            page: 2,
            per_page: 2,
            filter: { categories_id: [categories[0].id, categories[1].id] },
          }),
          result: {
            items: [genres[1], genres[0]],
            total: 4,
            current_page: 2,
            per_page: 2,
            sort: null,
            sort_dir: null,
          },
        },
      ];
      for (const arrangeItem of arrange) {
        const searchOutput = await genreRepo.search(arrangeItem.params);
        const { items, filter, ...otherOutput } = searchOutput;
        const { items: itemsExpected, ...otherExpected } = arrangeItem.result;
        expect(otherOutput).toMatchObject(otherExpected);
        expect(filter.categories_id.length).toBe(
          arrangeItem.params.filter.categories_id.length
        );
        filter.categories_id.forEach((id, key) => {
          expect(id).toBeValueObject(
            arrangeItem.params.filter.categories_id[key]
          );
        });
        expect(searchOutput.items.length).toBe(itemsExpected.length);
        searchOutput.items.forEach((item, key) => {
          const expected = itemsExpected[key].toJSON();
          expect(item.toJSON()).toStrictEqual(
            expect.objectContaining({
              ...expected,
              categories_id: expect.arrayContaining(expected.categories_id),
            })
          );
        });
      }
    });

    it("should apply paginate and sort", async () => {
      expect(genreRepo.sortableFields).toStrictEqual(["name", "created_at"]);

      const categories = Category.fake().theCategories(4).build();
      await categoryRepo.bulkInsert(categories);
      const genres = [
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("b")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("a")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("d")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("e")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("c")
          .build(),
      ];
      await genreRepo.bulkInsert(genres);

      const arrange = [
        {
          params: GenreRepository.SearchParams.create({
            page: 1,
            per_page: 2,
            sort: "name",
          }),
          result: new GenreRepository.SearchResult({
            items: [genres[1], genres[0]],
            total: 5,
            current_page: 1,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: null,
          }),
        },
        {
          params: GenreRepository.SearchParams.create({
            page: 2,
            per_page: 2,
            sort: "name",
          }),
          result: new GenreRepository.SearchResult({
            items: [genres[4], genres[2]],
            total: 5,
            current_page: 2,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: null,
          }),
        },
        {
          params: GenreRepository.SearchParams.create({
            page: 1,
            per_page: 2,
            sort: "name",
            sort_dir: "desc",
          }),
          result: new GenreRepository.SearchResult({
            items: [genres[3], genres[2]],
            total: 5,
            current_page: 1,
            per_page: 2,
            sort: "name",
            sort_dir: "desc",
            filter: null,
          }),
        },
        {
          params: GenreRepository.SearchParams.create({
            page: 2,
            per_page: 2,
            sort: "name",
            sort_dir: "desc",
          }),
          result: new GenreRepository.SearchResult({
            items: [genres[4], genres[0]],
            total: 5,
            current_page: 2,
            per_page: 2,
            sort: "name",
            sort_dir: "desc",
            filter: null,
          }),
        },
      ];

      for (const i of arrange) {
        let result = await genreRepo.search(i.params);
        const expected = i.result.toJSON(true);

        expect(result.toJSON(true)).toMatchObject({
          ...expected,
          items: expected.items.map((i) => ({
            ...i,
            categories_id: expect.arrayContaining(i.categories_id),
          })),
        });
      }
    });

    describe("should search using filter by name, sort and paginate", () => {
      const categories = Category.fake().theCategories(3).build();

      const genres = [
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("test")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("a")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("TEST")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("e")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("TeSt")
          .build(),
      ];

      let arrange = [
        {
          search_params: GenreRepository.SearchParams.create({
            page: 1,
            per_page: 2,
            sort: "name",
            filter: { name: "TEST" },
          }),
          search_result: new GenreRepository.SearchResult({
            items: [genres[2], genres[4]],
            total: 3,
            current_page: 1,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: { name: "TEST" },
          }),
        },
        {
          search_params: GenreRepository.SearchParams.create({
            page: 2,
            per_page: 2,
            sort: "name",
            filter: { name: "TEST" },
          }),
          search_result: new GenreRepository.SearchResult({
            items: [genres[0]],
            total: 3,
            current_page: 2,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: { name: "TEST" },
          }),
        },
      ];

      beforeEach(async () => {
        await categoryRepo.bulkInsert(categories);
        await genreRepo.bulkInsert(genres);
      });

      test.each(arrange)(
        "when value is $search_params",
        async ({ search_params, search_result: expected_result }) => {
          let result = await genreRepo.search(search_params);
          const expected = expected_result.toJSON(true);
          expect(result.toJSON(true)).toMatchObject({
            ...expected,
            items: expected.items.map((i) => ({
              ...i,
              categories_id: expect.arrayContaining(i.categories_id),
            })),
          });
        }
      );
    });

    describe("should search using filter by categories_id, sort and paginate", () => {
      const categories = Category.fake().theCategories(4).build();

      const genres = [
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withName("test")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withName("a")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("TEST")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[3].entityId)
          .withName("e")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("TeSt")
          .build(),
      ];

      let arrange = [
        {
          search_params: GenreRepository.SearchParams.create({
            page: 1,
            per_page: 2,
            sort: "name",
            filter: { categories_id: [categories[0].id] },
          }),
          search_result: new GenreRepository.SearchResult({
            items: [genres[2], genres[1]],
            total: 3,
            current_page: 1,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: { categories_id: [categories[0].id] },
          }),
        },
        {
          search_params: GenreRepository.SearchParams.create({
            page: 2,
            per_page: 2,
            sort: "name",
            filter: { categories_id: [categories[0].id] },
          }),
          search_result: new GenreRepository.SearchResult({
            items: [genres[0]],
            total: 3,
            current_page: 2,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: { categories_id: [categories[0].id] },
          }),
        },
      ];

      beforeEach(async () => {
        await categoryRepo.bulkInsert(categories);
        await genreRepo.bulkInsert(genres);
      });

      test.each(arrange)(
        "when value is $search_params",
        async ({ search_params, search_result: expected_result }) => {
          let result = await genreRepo.search(search_params);
          const expected = expected_result.toJSON(true);
          expect(result.toJSON(true)).toMatchObject({
            ...expected,
            items: expected.items.map((i) => ({
              ...i,
              categories_id: expect.arrayContaining(i.categories_id),
            })),
          });
        }
      );
    });

    describe("should search using filter by name and categories_id, sort and paginate", () => {
      const categories = Category.fake().theCategories(4).build();

      const genres = [
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withName("test")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withName("a")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[0].entityId)
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("TEST")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[3].entityId)
          .withName("e")
          .build(),
        Genre.fake()
          .aGenre()
          .withCategoryId(categories[1].entityId)
          .withCategoryId(categories[2].entityId)
          .withName("TeSt")
          .build(),
      ];

      let arrange = [
        {
          search_params: GenreRepository.SearchParams.create({
            page: 1,
            per_page: 2,
            sort: "name",
            filter: { name: "TEST", categories_id: [categories[1].id] },
          }),
          search_result: new GenreRepository.SearchResult({
            items: [genres[2], genres[4]],
            total: 3,
            current_page: 1,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: { name: "TEST", categories_id: [categories[1].id] },
          }),
        },
        {
          search_params: GenreRepository.SearchParams.create({
            page: 2,
            per_page: 2,
            sort: "name",
            filter: { name: "TEST", categories_id: [categories[1].id] },
          }),
          search_result: new GenreRepository.SearchResult({
            items: [genres[0]],
            total: 3,
            current_page: 2,
            per_page: 2,
            sort: "name",
            sort_dir: "asc",
            filter: { name: "TEST", categories_id: [categories[1].id] },
          }),
        },
      ];

      beforeEach(async () => {
        await categoryRepo.bulkInsert(categories);
        await genreRepo.bulkInsert(genres);
      });

      test.each(arrange)(
        "when value is $search_params",
        async ({ search_params, search_result: expected_result }) => {
          let result = await genreRepo.search(search_params);
          const expected = expected_result.toJSON(true);
          expect(result.toJSON(true)).toMatchObject({
            ...expected,
            items: expected.items.map((i) => ({
              ...i,
              categories_id: expect.arrayContaining(i.categories_id),
            })),
          });
        }
      );
    });
  });

  describe("transaction mode", () => {
    let unitOfWork: UnitOfWorkInterface;

    beforeEach(() => {
      unitOfWork = new UnitOfWorkSequelize(null, sequelizeInst.sequelize);
    });

    describe("insert method", () => {
      it("should insert a genre", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        unitOfWork.start();
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.insert(genre);
        await unitOfWork.commit();

        const result = await genreRepo.findById(genre.id);
        expect(genre.id).toBe(result.id);
      });

      it("rollback the insertion", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        await unitOfWork.start();
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.insert(genre);
        await unitOfWork.rollback();

        await expect(genreRepo.findById(genre.id)).rejects.toThrowError(
          new NotFoundError(genre.id, Genre)
        );
      });
    });

    describe("bulkInsert method", () => {
      it("should insert a list of genres", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genres = Genre.fake()
          .theGenres(2)
          .withCategoryId(category.entityId)
          .build();
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.bulkInsert(genres);
        await unitOfWork.commit();

        const [genre1, genre2] = await Promise.all([
          genreRepo.findById(genres[0].id),
          genreRepo.findById(genres[1].id),
        ]);
        expect(genre1.id).toBe(genres[0].id);
        expect(genre2.id).toBe(genres[1].id);
      });

      it("rollback the bulk insertion", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genres = Genre.fake()
          .theGenres(2)
          .withCategoryId(category.entityId)
          .build();
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.bulkInsert(genres);
        await unitOfWork.rollback();

        await expect(genreRepo.findById(genres[0].id)).rejects.toThrowError(
          new NotFoundError(genres[0].id, Genre)
        );
        await expect(genreRepo.findById(genres[1].id)).rejects.toThrowError(
          new NotFoundError(genres[1].id, Genre)
        );
      });
    });

    describe("findById method", () => {
      it("should return a genre", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.insert(genre);
        const result = await genreRepo.findById(genre.id);
        expect(result.id).toBe(genre.id);
        await unitOfWork.commit();
      });
    });

    describe("findAll method", () => {
      it("should return a list of genres", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genres = Genre.fake()
          .theGenres(2)
          .withCategoryId(category.entityId)
          .build();
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.bulkInsert(genres);
        const result = await genreRepo.findAll();
        expect(result.length).toBe(2);
        await unitOfWork.commit();
      });
    });

    describe("findByIds method", () => {
      it("should return a list of genres", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genres = Genre.fake()
          .theGenres(2)
          .withCategoryId(category.entityId)
          .build();
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.bulkInsert(genres);
        const result = await genreRepo.findByIds(genres.map((g) => g.id));
        expect(result.length).toBe(2);
        await unitOfWork.commit();
      });
    });

    describe("existsById method", () => {
      it("should return true if the genre exists", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.insert(genre);
        const [existsIds] = await genreRepo.existsById([genre.entityId]);
        expect(existsIds[0]).toBeValueObject(genre.entityId);
        await unitOfWork.commit();
      });
    });

    describe("update method", () => {
      it("should update a genre", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        await genreRepo.insert(genre);
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        genre.update("new name");
        await genreRepo.update(genre);
        await unitOfWork.commit();
        const result = await genreRepo.findById(genre.id);
        expect(result.name).toBe(genre.name);
      });

      it("rollback the update", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        await genreRepo.insert(genre);
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        genre.update("new name");
        await genreRepo.update(genre);
        await unitOfWork.rollback();
        const notChangeGenre = await genreRepo.findById(genre.id);
        expect(notChangeGenre.name).not.toBe(genre.name);
      });
    });

    describe("delete method", () => {
      it("should delete a genre", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        await genreRepo.insert(genre);
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.delete(genre.id);
        await unitOfWork.commit();
        await expect(genreRepo.findById(genre.id)).rejects.toThrowError(
          new NotFoundError(genre.id, Genre)
        );
      });

      it("rollback the deletion", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genre = Genre.fake()
          .aGenre()
          .withCategoryId(category.entityId)
          .build();
        await genreRepo.insert(genre);
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.delete(genre.id);
        await unitOfWork.rollback();
        const result = await genreRepo.findById(genre.id);
        expect(result.id).toBe(genre.id);
      });
    });

    describe("search method", () => {
      it("should return a list of genres", async () => {
        const category = Category.fake().aCategory().build();
        await categoryRepo.insert(category);
        const genres = Genre.fake()
          .theGenres(2)
          .withName("genre")
          .withCategoryId(category.entityId)
          .build();
        await unitOfWork.start();
        genreRepo.setUnitOfWork(unitOfWork);
        await genreRepo.bulkInsert(genres);
        const searchParams = GenreRepository.SearchParams.create({
          filter: { name: "genre" },
        });
        const result = await genreRepo.search(searchParams);
        expect(result.items.length).toBe(2);
        expect(result.total).toBe(2);
        await unitOfWork.commit();
      });
    });
  });
});
