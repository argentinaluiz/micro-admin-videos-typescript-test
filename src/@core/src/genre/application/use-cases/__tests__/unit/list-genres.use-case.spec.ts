import { ListGenresUseCase } from "../../list-genres.use-case";
import GenreInMemoryRepository from "../../../../infra/db/in-memory/genre-in-memory.repository";
import { Genre } from "../../../../domain/entities/genre";
import { GenreRepository } from "../../../../domain/repository/genre.repository";
import { CategoryInMemoryRepository } from "../../../../../category/infra";
import { Category } from "../../../../../category/domain";
import { GenreWithRelationsOutputMapper } from "../../../dto";
import { SortDirection } from "../../../../../@seedwork/domain";

describe("ListGenresUseCase Unit Tests", () => {
  let useCase: ListGenresUseCase.UseCase;
  let genreRepo: GenreInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;

  beforeEach(() => {
    genreRepo = new GenreInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    useCase = new ListGenresUseCase.UseCase(genreRepo, categoryRepo);
  });

  test("toOutput method", () => {
    let result = new GenreRepository.SearchResult({
      items: [],
      total: 1,
      current_page: 1,
      per_page: 2,
      sort: null,
      sort_dir: null,
      filter: null,
    });
    let output = useCase["toOutput"](result, []);
    expect(output).toStrictEqual({
      items: [],
      total: 1,
      current_page: 1,
      per_page: 2,
      last_page: 1,
    });

    const categories = Category.fake().theCategories(3).build();
    const genre = Genre.fake()
      .aGenre()
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .build();

    result = new GenreRepository.SearchResult({
      items: [genre],
      total: 1,
      current_page: 1,
      per_page: 2,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    output = useCase["toOutput"](result, categories);
    expect(output).toStrictEqual({
      items: [
        {
          id: genre.id,
          name: genre.name,
          categories: [
            {
              id: categories[0].id,
              name: categories[0].name,
              created_at: categories[0].created_at,
            },
            {
              id: categories[1].id,
              name: categories[1].name,
              created_at: categories[1].created_at,
            },
          ],
          categories_id: [categories[0].id, categories[1].id],
          is_active: genre.is_active,
          created_at: genre.created_at,
        },
      ],
      total: 1,
      current_page: 1,
      per_page: 2,
      last_page: 1,
    });
  });

  it("should search sorted by created_at when input param is empty", async () => {
    const categories = Category.fake().theCategories(3).build();
    await categoryRepo.bulkInsert(categories);
    const genres = [
      Genre.fake().aGenre().withCategoryId(categories[0].entityId).build(),
      Genre.fake()
        .aGenre()
        .withCategoryId(categories[1].entityId)
        .withCreatedAt(new Date(new Date().getTime() + 100))
        .build(),
    ];
    await genreRepo.bulkInsert(genres);

    const output = await useCase.execute({});
    expect(output).toStrictEqual({
      items: [
        GenreWithRelationsOutputMapper.toOutput(genres[1], [categories[1]]),
        GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
      ],
      total: 2,
      current_page: 1,
      per_page: 15,
      last_page: 1,
    });
  });

  it("should search applying paginate and filter by name", async () => {
    const categories = Category.fake().theCategories(6).build();
    await categoryRepo.bulkInsert(categories);
    const created_at = new Date();
    const genres = [
      Genre.fake()
        .aGenre()
        .withName("test")
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCreatedAt(created_at)
        .build(),
      Genre.fake().aGenre().withName("a").withCreatedAt(created_at).build(),
      Genre.fake()
        .aGenre()
        .withName("TEST")
        .withCategoryId(categories[1].entityId)
        .withCreatedAt(created_at)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("TeSt")
        .withCategoryId(categories[2].entityId)
        .withCategoryId(categories[3].entityId)
        .withCreatedAt(created_at)
        .build(),
    ];
    await genreRepo.bulkInsert(genres);

    let output = await useCase.execute({
      page: 1,
      per_page: 2,
      filter: { name: "TEST" },
    });
    expect(output).toStrictEqual({
      items: [
        GenreWithRelationsOutputMapper.toOutput(genres[0], [
          categories[0],
          categories[1],
        ]),
        GenreWithRelationsOutputMapper.toOutput(genres[2], [categories[1]]),
      ],
      total: 3,
      current_page: 1,
      per_page: 2,
      last_page: 2,
    });

    output = await useCase.execute({
      page: 2,
      per_page: 2,
      filter: { name: "TEST" },
    });
    expect(output).toStrictEqual({
      items: [
        GenreWithRelationsOutputMapper.toOutput(genres[3], [
          categories[2],
          categories[3],
        ]),
      ],
      total: 3,
      current_page: 2,
      per_page: 2,
      last_page: 2,
    });
  });

  it("should search applying paginate and filter by categories_id", async () => {
    const categories = Category.fake().theCategories(4).build();
    await categoryRepo.bulkInsert(categories);

    const created_at = new Date();
    const genres = [
      Genre.fake()
        .aGenre()
        .withCategoryId(categories[0].entityId)
        .withCreatedAt(created_at)
        .build(),
      Genre.fake()
        .aGenre()
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCreatedAt(created_at)
        .build(),
      Genre.fake()
        .aGenre()
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCategoryId(categories[2].entityId)
        .withCreatedAt(created_at)
        .build(),
      Genre.fake().aGenre().withCreatedAt(created_at).build(),
    ];
    await genreRepo.bulkInsert(genres);

    const arrange = [
      {
        input: {
          page: 1,
          per_page: 2,
          filter: { categories_id: [categories[0].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
            GenreWithRelationsOutputMapper.toOutput(genres[1], [
              categories[0],
              categories[1],
            ]),
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
          filter: { categories_id: [categories[0].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          filter: { categories_id: [categories[0].id, categories[1].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
            GenreWithRelationsOutputMapper.toOutput(genres[1], [
              categories[0],
              categories[1],
            ]),
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
          filter: { categories_id: [categories[0].id, categories[1].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          filter: { categories_id: [categories[1].id, categories[2].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[1], [
              categories[0],
              categories[1],
            ]),
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
          ],
          total: 2,
          current_page: 1,
          per_page: 2,
          last_page: 1,
        },
      },
    ];

    for (const item of arrange) {
      const output = await useCase.execute(item.input);
      expect(output).toStrictEqual(item.output);
    }
  });

  it("should search applying paginate and sort", async () => {
    const categories = Category.fake().theCategories(6).build();
    await categoryRepo.bulkInsert(categories);
    expect(genreRepo.sortableFields).toStrictEqual(["name", "created_at"]);

    const genres = [
      Genre.fake()
        .aGenre()
        .withName("b")
        .withCategoryId(categories[0].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("a")
        .withCategoryId(categories[1].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("d")
        .withCategoryId(categories[2].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("e")
        .withCategoryId(categories[3].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("c")
        .withCategoryId(categories[4].entityId)
        .build(),
    ];
    await genreRepo.bulkInsert(genres);

    const arrange = [
      {
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[1], [categories[1]]),
            GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
          ],
          total: 5,
          current_page: 1,
          per_page: 2,
          last_page: 3,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: "name",
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[4], [categories[4]]),
            GenreWithRelationsOutputMapper.toOutput(genres[2], [categories[2]]),
          ],
          total: 5,
          current_page: 2,
          per_page: 2,
          last_page: 3,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
          sort_dir: "desc" as SortDirection,
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[3], [categories[3]]),
            GenreWithRelationsOutputMapper.toOutput(genres[2], [categories[2]]),
          ],
          total: 5,
          current_page: 1,
          per_page: 2,
          last_page: 3,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: "name",
          sort_dir: "desc" as SortDirection,
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[4], [categories[4]]),
            GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
          ],
          total: 5,
          current_page: 2,
          per_page: 2,
          last_page: 3,
        },
      },
    ];

    for (const item of arrange) {
      const output = await useCase.execute(item.input);
      expect(output).toStrictEqual(item.output);
    }
  });

  describe("should search applying filter by name, sort and paginate", () => {
    const categories = Category.fake().theCategories(6).build();

    const genres = [
      Genre.fake()
        .aGenre()
        .withName("test")
        .withCategoryId(categories[0].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("a")
        .withCategoryId(categories[1].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("TEST")
        .withCategoryId(categories[2].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("e")
        .withCategoryId(categories[3].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("TeSt")
        .withCategoryId(categories[4].entityId)
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
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [categories[2]]),
            GenreWithRelationsOutputMapper.toOutput(genres[4], [categories[4]]),
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
          filter: { name: "TEST" },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
          ],
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
      'when input is {"filter": $input.filter, "page": $input.page, "per_page": $input.per_page, "sort": $input.sort, "sort_dir": $input.sort_dir}',
      async ({ input, output: expectedOutput }) => {
        const output = await useCase.execute(input);
        expect(output).toStrictEqual(expectedOutput);
      }
    );
  });

  describe("should search applying filter by categories_id, sort and paginate", () => {
    const categories = Category.fake().theCategories(4).build();

    const genres = [
      Genre.fake()
        .aGenre()
        .withName("test")
        .withCategoryId(categories[0].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("a")
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("TEST")
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCategoryId(categories[2].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("e")
        .withCategoryId(categories[3].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("TeSt")
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
          filter: { categories_id: [categories[0].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
            GenreWithRelationsOutputMapper.toOutput(genres[1], [
              categories[0],
              categories[1],
            ]),
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
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
          filter: { categories_id: [categories[1].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
            GenreWithRelationsOutputMapper.toOutput(genres[4], [
              categories[1],
              categories[2],
            ]),
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
          filter: { categories_id: [categories[1].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[1], [
              categories[0],
              categories[1],
            ]),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
          filter: { categories_id: [categories[0].id, categories[1].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
            GenreWithRelationsOutputMapper.toOutput(genres[4], [
              categories[1],
              categories[2],
            ]),
          ],
          total: 4,
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
          filter: { categories_id: [categories[0].id, categories[1].id] },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[1], [
              categories[0],
              categories[1],
            ]),
            GenreWithRelationsOutputMapper.toOutput(genres[0], [categories[0]]),
          ],
          total: 4,
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
      'when input is {"filter": $input.filter, "page": $input.page, "per_page": $input.per_page, "sort": $input.sort, "sort_dir": $input.sort_dir}',
      async ({ input, output: expectedOutput }) => {
        const output = await useCase.execute(input);
        expect(output).toStrictEqual(expectedOutput);
      }
    );
  });

  describe("should search applying filter by name and categories_id, sort and paginate", () => {
    const categories = Category.fake().theCategories(4).build();

    const genres = [
      Genre.fake()
        .aGenre()
        .withName("test")
        .withCategoryId(categories[0].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("a")
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("TEST")
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCategoryId(categories[2].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("e")
        .withCategoryId(categories[3].entityId)
        .build(),
      Genre.fake()
        .aGenre()
        .withName("TeSt")
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
          filter: { 
            name: 'TEST',
            categories_id: [categories[0].id] 
          },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
            GenreWithRelationsOutputMapper.toOutput(genres[0], [
              categories[0],
            ]),
          ],
          total: 2,
          current_page: 1,
          per_page: 2,
          last_page: 1,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          sort: "name",
          filter: { 
            name: 'TEST',
            categories_id: [categories[0].id, categories[1].id] 
          },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[2], [
              categories[0],
              categories[1],
              categories[2],
            ]),
            GenreWithRelationsOutputMapper.toOutput(genres[4], [
              categories[1],
              categories[2],
            ]),
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
          filter: { 
            name: 'TEST',
            categories_id: [categories[0].id, categories[1].id] 
          },
        },
        output: {
          items: [
            GenreWithRelationsOutputMapper.toOutput(genres[0], [
              categories[0],
            ]),
          ],
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
      'when input is {"filter": $input.filter, "page": $input.page, "per_page": $input.per_page, "sort": $input.sort, "sort_dir": $input.sort_dir}',
      async ({ input, output: expectedOutput }) => {
        const output = await useCase.execute(input);
        expect(output).toStrictEqual(expectedOutput);
      }
    );
  });
});
