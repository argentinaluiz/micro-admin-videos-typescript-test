import { SortDirection } from '@fc/micro-videos/@seedwork/domain';
import { Category } from '@fc/micro-videos/category/domain';
import { Genre } from '@fc/micro-videos/genre/domain';

export class GenreFixture {

  static arrangeInvalidRequest() {
    const fakerGenre = () => Genre.fake().aGenre();
    const defaultExpected = {
      statusCode: 422,
      error: 'Unprocessable Entity',
    };

    return {
      EMPTY: {
        send_data: {},
        expected: {
          message: [
            'name should not be empty',
            'name must be a string',
            'categories_id should not be empty',
            'categories_id must be an array',
          ],
          ...defaultExpected,
        },
      },
      NAME_UNDEFINED: {
        send_data: {
          name: fakerGenre().withInvalidNameEmpty(undefined).name,
          categories_id: [fakerGenre().categories_id[0].value],
        },
        expected: {
          message: ['name should not be empty', 'name must be a string'],
          ...defaultExpected,
        },
      },
      NAME_NULL: {
        send_data: {
          name: fakerGenre().withInvalidNameEmpty(null).name,
          categories_id: [fakerGenre().categories_id[0].value],
        },
        expected: {
          message: ['name should not be empty', 'name must be a string'],
          ...defaultExpected,
        },
      },
      NAME_EMPTY: {
        send_data: {
          name: fakerGenre().withInvalidNameEmpty('').name,
          categories_id: [fakerGenre().categories_id[0].value],
        },
        expected: {
          message: ['name should not be empty'],
          ...defaultExpected,
        },
      },
      CATEGORIES_ID_UNDEFINED: {
        send_data: {
          name: fakerGenre().name,
          categories_id: undefined,
        },
        expected: {
          message: [
            'categories_id should not be empty',
            'categories_id must be an array',
          ],
          ...defaultExpected,
        },
      },
      CATEGORIES_ID_NULL: {
        send_data: {
          name: fakerGenre().name,
          categories_id: null,
        },
        expected: {
          message: [
            'categories_id should not be empty',
            'categories_id must be an array',
          ],
          ...defaultExpected,
        },
      },
      CATEGORIES_ID_EMPTY: {
        send_data: {
          name: fakerGenre().name,
          categories_id: '',
        },
        expected: {
          message: [
            'categories_id should not be empty',
            'categories_id must be an array',
          ],
          ...defaultExpected,
        },
      }
    };
  }

  static arrangeForEntityValidationError() {
    const faker = () => Genre.fake().aGenre();
    const defaultExpected = {
      statusCode: 422,
      error: 'Unprocessable Entity',
    };

    return {
      EMPTY: {
        send_data: {},
        expected: {
          message: [
            'name should not be empty',
            'name must be a string',
            'name must be shorter than or equal to 255 characters',
            'ID undefined must be a valid UUID',
          ],
          ...defaultExpected,
        },
      },
      NAME_UNDEFINED: {
        send_data: {
          name: faker().withInvalidNameEmpty(undefined).name,
          categories_id: faker().withInvalidCategoryId('fake id').categories_id,
        },
        expected: {
          message: [
            'name should not be empty',
            'name must be a string',
            'name must be shorter than or equal to 255 characters',
            'ID fake id must be a valid UUID',
          ],
          ...defaultExpected,
        },
      },
      NAME_NULL: {
        send_data: {
          name: faker().withInvalidNameEmpty(null).name,
          categories_id: faker().withInvalidCategoryId('fake id').categories_id,
        },
        expected: {
          message: [
            'name should not be empty',
            'name must be a string',
            'name must be shorter than or equal to 255 characters',
            'ID fake id must be a valid UUID',
          ],
          ...defaultExpected,
        },
      },
      NAME_EMPTY: {
        send_data: {
          name: faker().withInvalidNameEmpty('').name,
          categories_id: faker().withInvalidCategoryId('fake id').categories_id,
        },
        expected: {
          message: [
            'name should not be empty',
            'ID fake id must be a valid UUID',
          ],
          ...defaultExpected,
        },
      },
      CATEGORIES_ID_INVALID: {
        send_data: {
          name: faker().name,
          categories_id: faker().withInvalidCategoryId('fake id').categories_id,
        },
        expected: {
          message: ['ID fake id must be a valid UUID'],
          ...defaultExpected,
        },
      },
      CATEGORIES_ID_NOT_EXISTS: {
        send_data: {
          name: faker().name,
          categories_id: ['d8952775-5f69-42d5-9e94-00f097e1b98c'],
        },
        expected: {
          message: [
            'Category Not Found using ID (d8952775-5f69-42d5-9e94-00f097e1b98c)',
          ],
          ...defaultExpected,
        },
      },
    };
  }
}

export class CreateGenreFixture {
  static keysInResponse() {
    return ['id', 'name', 'categories_id', 'is_active', 'created_at'];
  }

  static arrangeForSave() {
    const faker = Genre.fake().aGenre().withName('test name');

    const category = Category.fake().aCategory().build();

    const case1 = {
      relations: {
        categories: [category],
      },
      send_data: {
        name: faker.name,
        categories_id: [category.id],
      },
      expected: {
        name: faker.name,
        categories_id: [category.id],
        is_active: true,
      },
    };

    const categories = Category.fake().theCategories(3).build();
    const case2 = {
      relations: {
        categories,
      },
      send_data: {
        name: faker.name,
        categories_id: [categories[0].id, categories[1].id, categories[2].id],
        is_active: false,
      },
      expected: {
        name: faker.name,
        categories_id: [categories[0].id, categories[1].id, categories[2].id],
        is_active: false,
      },
    };

    return [case1, case2];
  }

  static arrangeInvalidRequest() {
    return GenreFixture.arrangeInvalidRequest();
  }

  static arrangeForEntityValidationError() {
    return GenreFixture.arrangeForEntityValidationError();
  }
}

export class UpdateGenreFixture {
  static keysInResponse() {
    return ['id', 'name', 'categories_id', 'is_active', 'created_at'];
  }

  static arrangeForSave() {
    const faker = Genre.fake().aGenre().withName('test name');

    const category = Category.fake().aCategory().build();

    const case1 = {
      entity: faker.withCategoryId(category.entityId).build(),
      relations: {
        categories: [category],
      },
      send_data: {
        name: faker.name,
        categories_id: [category.id],
      },
      expected: {
        name: faker.name,
        categories_id: [category.id],
        is_active: true,
      },
    };

    const case2 = {
      entity: faker.withCategoryId(category.entityId).build(),
      relations: {
        categories: [category],
      },
      send_data: {
        name: faker.name,
        categories_id: [category.id],
        is_active: false,
      },
      expected: {
        name: faker.name,
        categories_id: [category.id],
        is_active: false,
      },
    };

    const categories = Category.fake().theCategories(3).build();
    const case3 = {
      entity: faker.withCategoryId(category.entityId).build(),
      relations: {
        categories: [category, ...categories],
      },
      send_data: {
        name: faker.name,
        categories_id: [categories[0].id, categories[1].id, categories[2].id],
      },
      expected: {
        name: faker.name,
        categories_id: [categories[0].id, categories[1].id, categories[2].id],
        is_active: true,
      },
    };

    return [case1, case2, case3];
  }

  static arrangeInvalidRequest() {
    return GenreFixture.arrangeInvalidRequest();
  }

  static arrangeForEntityValidationError() {
    return GenreFixture.arrangeForEntityValidationError();
  }
}

export class ListGenresFixture {
  static arrangeIncrementedWithCreatedAt() {
    const category = Category.fake().aCategory().build();
    const _entities = Genre.fake()
      .theGenres(4)
      .withCategoryId(category.entityId)
      .withName((i) => i + '')
      .withCreatedAt((i) => new Date(new Date().getTime() + i * 2000))
      .build();

    const entitiesMap = {
      first: _entities[0],
      second: _entities[1],
      third: _entities[2],
      fourth: _entities[3],
    };

    const relations = {
      categories: new Map([[category.id, category]]),
    };

    const arrange = [
      {
        send_data: {},
        expected: {
          entities: [
            entitiesMap.fourth,
            entitiesMap.third,
            entitiesMap.second,
            entitiesMap.first,
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 4,
          },
        },
      },
      {
        send_data: {
          page: 1,
          per_page: 2,
        },
        expected: {
          entities: [entitiesMap.fourth, entitiesMap.third],
          meta: {
            current_page: 1,
            last_page: 2,
            per_page: 2,
            total: 4,
          },
        },
      },
      {
        send_data: {
          page: 2,
          per_page: 2,
        },
        expected: {
          entities: [entitiesMap.second, entitiesMap.first],
          meta: {
            current_page: 2,
            last_page: 2,
            per_page: 2,
            total: 4,
          },
        },
      },
    ];

    return { arrange, entitiesMap, relations };
  }

  static arrangeUnsorted() {
    const categories = Category.fake().theCategories(4).build();

    const relations = {
      categories: new Map(
        categories.map((category) => [category.id, category]),
      ),
    };

    const created_at = new Date();

    const entitiesMap = {
      test: Genre.fake()
        .aGenre()
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withName('test')
        .withCreatedAt(new Date(created_at.getTime() + 1000))
        .build(),
      a: Genre.fake()
        .aGenre()
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withName('a')
        .withCreatedAt(new Date(created_at.getTime() + 2000))
        .build(),
      TEST: Genre.fake()
        .aGenre()
        .withCategoryId(categories[0].entityId)
        .withCategoryId(categories[1].entityId)
        .withCategoryId(categories[2].entityId)
        .withName('TEST')
        .withCreatedAt(new Date(created_at.getTime() + 3000))
        .build(),
      e: Genre.fake()
        .aGenre()
        .withCategoryId(categories[3].entityId)
        .withName('e')
        .withCreatedAt(new Date(created_at.getTime() + 4000))
        .build(),
      TeSt: Genre.fake()
        .aGenre()
        .withCategoryId(categories[1].entityId)
        .withCategoryId(categories[2].entityId)
        .withName('TeSt')
        .withCreatedAt(new Date(created_at.getTime() + 5000))
        .build(),
    };

    const arrange_filter_by_name_sort_name_asc = [
      {
        send_data: {
          page: 1,
          per_page: 2,
          sort: 'name',
          filter: { name: 'TEST' },
        },
        get label() {
          return JSON.stringify(this.send_data);
        },
        expected: {
          entities: [entitiesMap.TEST, entitiesMap.TeSt],
          meta: {
            total: 3,
            current_page: 1,
            last_page: 2,
            per_page: 2,
          },
        },
      },
      {
        send_data: {
          page: 2,
          per_page: 2,
          sort: 'name',
          filter: { name: 'TEST' },
        },
        get label() {
          return JSON.stringify(this.send_data);
        },
        expected: {
          entities: [entitiesMap.test],
          meta: {
            total: 3,
            current_page: 2,
            last_page: 2,
            per_page: 2,
          },
        },
      },
    ];

    const arrange_filter_by_categories_id_and_sort_by_created_desc = [
      {
        send_data: {
          page: 1,
          per_page: 2,
          sort: 'created_at',
          sort_dir: 'desc' as SortDirection,
          filter: { categories_id: [categories[0].id] },
        },
        get label() {
          return JSON.stringify({
            ...this.send_data,
            filter: { categories_id_length: 1 },
          });
        },
        expected: {
          entities: [entitiesMap.TEST, entitiesMap.a],
          meta: {
            total: 3,
            current_page: 1,
            last_page: 2,
            per_page: 2,
          },
        },
      },
      {
        send_data: {
          page: 2,
          per_page: 2,
          sort: 'created_at',
          sort_dir: 'desc' as SortDirection,
          filter: { categories_id: [categories[0].id] },
        },
        get label() {
          return JSON.stringify({
            ...this.send_data,
            filter: { categories_id_length: 1 },
          });
        },
        expected: {
          entities: [entitiesMap.test],
          meta: {
            total: 3,
            current_page: 2,
            last_page: 2,
            per_page: 2,
          },
        },
      },
      {
        send_data: {
          page: 1,
          per_page: 2,
          sort: 'created_at',
          sort_dir: 'desc' as SortDirection,
          filter: { categories_id: [categories[0].id, categories[1].id] },
        },
        get label() {
          return JSON.stringify({
            ...this.send_data,
            filter: { categories_id_length: 2 },
          });
        },
        expected: {
          entities: [entitiesMap.TeSt, entitiesMap.TEST],
          meta: {
            total: 4,
            current_page: 1,
            last_page: 2,
            per_page: 2,
          },
        },
      },
      {
        send_data: {
          page: 2,
          per_page: 2,
          sort: 'created_at',
          sort_dir: 'desc' as SortDirection,
          filter: { categories_id: [categories[0].id, categories[1].id] },
        },
        get label() {
          return JSON.stringify({
            ...this.send_data,
            filter: { categories_id_length: 2 },
          });
        },
        expected: {
          entities: [entitiesMap.a, entitiesMap.test],
          meta: {
            total: 4,
            current_page: 2,
            last_page: 2,
            per_page: 2,
          },
        },
      },
    ];

    return {
      arrange: [
        ...arrange_filter_by_name_sort_name_asc,
        ...arrange_filter_by_categories_id_and_sort_by_created_desc,
      ],
      entitiesMap,
      relations,
    };
  }
}
