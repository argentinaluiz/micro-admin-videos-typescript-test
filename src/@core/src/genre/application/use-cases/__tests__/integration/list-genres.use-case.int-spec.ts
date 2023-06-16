import { ListGenresUseCase } from "../../list-genres.use-case";
import { Genre } from "../../../../domain/entities/genre";
import { setupSequelize } from "../../../../../@seedwork/infra";
import { CategorySequelize } from "../../../../../category/infra";
import { Category } from "../../../../../category/domain";
import { GenreSequelize } from "../../../../infra";
import { GenreWithRelationsOutputMapper } from "../../../dto";

const { GenreRepository, GenreModel, GenreCategoryModel } = GenreSequelize;
const { CategoryRepository, CategoryModel } = CategorySequelize;

describe("ListGenresUseCase Integration Tests", () => {
  let useCase: ListGenresUseCase.UseCase;
  let genreRepo: GenreSequelize.GenreRepository;
  let categoryRepo: CategorySequelize.CategoryRepository;

  setupSequelize({
    models: [GenreModel, GenreCategoryModel, CategoryModel],
    logging: true,
  });

  beforeEach(() => {
    genreRepo = new GenreRepository(GenreModel, GenreCategoryModel);
    categoryRepo = new CategoryRepository(CategoryModel);
    useCase = new ListGenresUseCase.UseCase(genreRepo, categoryRepo);
  });

  it("should return output sorted by created_at when input param is empty", async () => {
    const categories = Category.fake().theCategories(3).build();
    await categoryRepo.bulkInsert(categories);
    const genres = Genre.fake()
      .theGenres(16)
      .withCreatedAt((index) => new Date(new Date().getTime() + 1000 + index))
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .withCategoryId(categories[2].entityId)
      .build();
    await genreRepo.bulkInsert(genres);
    const output = await useCase.execute({});
    expect(output).toEqual({
      items: [...genres]
        .reverse()
        .slice(0, 15)
        .map((i) => formatOutput(i, categories)),
      total: 16,
      current_page: 1,
      last_page: 2,
      per_page: 15,
    });
  });

  describe("should search applying filter by name, sort and paginate", () => {
    const categories = Category.fake().theCategories(3).build();
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

    let arrange = [
      {
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
          filter: { name: "TEST" },
        },
        output: {
          items: [genres[2], genres[3]].map((i) => formatOutput(i, categories)),
          total: 3,
          current_page: 1,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: "name",
          filter: { name: "TEST" },
        },
        output: {
          items: [genres[0]].map((i) => formatOutput(i, categories)),
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
    ];

    beforeEach(async () => {
      await categoryRepo.bulkInsert(categories);
      await genreRepo.bulkInsert(genres);
    });

    test.each(arrange)(
      "when value is $search_params",
      async ({ input, output: expectedOutput }) => {
        const output = await useCase.execute(input);
        expect(output).toEqual(expectedOutput);
      }
    );
  });

  describe("should search applying filter by categories_id, sort and paginate", () => {
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
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
          filter: { categories_id: [categories[0].id] },
        },
        output: {
          items: [
            formatOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
            formatOutput(genres[1], [categories[0], categories[1]]),
          ],
          total: 3,
          current_page: 1,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: "name",
          filter: { categories_id: [categories[0].id] },
        },
        output: {
          items: [formatOutput(genres[0], [categories[0]])],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
    ];

    beforeEach(async () => {
      await categoryRepo.bulkInsert(categories);
      await genreRepo.bulkInsert(genres);
    });

    test.each(arrange)(
      "when value is $search_params",
      async ({ input, output: expectedOutput }) => {
        const output = await useCase.execute(input);
        expect(output).toEqual(expectedOutput);
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
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
          filter: { name: "TEST", categories_id: [categories[1].id] },
        },
        output: {
          items: [
            formatOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
            formatOutput(genres[4], [categories[1], categories[2]]),
          ],
          total: 3,
          current_page: 1,
          per_page: 2,
          last_page: 2
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: "name",
          filter: { name: "TEST", categories_id: [categories[1].id] },
        },
        output: {
          items: [
            formatOutput(genres[0], [categories[0]]),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2
        },
      },
    ];

    beforeEach(async () => {
      await categoryRepo.bulkInsert(categories);
      await genreRepo.bulkInsert(genres);
    });

    test.each(arrange)(
      "when value is $search_params",
      async ({ input, output: expectedOutput }) => {
        const output = await useCase.execute(input);
        expect(output).toEqual(expectedOutput);
      }
    );
  });
});

function formatOutput(genre, categories) {
  const output = GenreWithRelationsOutputMapper.toOutput(genre, categories);
  return {
    ...output,
    categories: expect.arrayContaining(
      output.categories.map((c) => expect.objectContaining(c))
    ),
    categories_id: expect.arrayContaining(output.categories_id),
  };
}
