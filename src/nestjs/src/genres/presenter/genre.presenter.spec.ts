import {
  GenreCategoryPresenter,
  GenreCollectionPresenter,
  GenrePresenter,
} from './genre.presenter';
import { instanceToPlain } from 'class-transformer';
import { PaginationPresenter } from '../../@share/presenters/pagination.presenter';

describe('GenrePresenter Unit Tests', () => {
  describe('constructor', () => {
    it('should set values', () => {
      const created_at = new Date();
      const presenter = new GenrePresenter({
        id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
        name: 'test',
        categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
        is_active: true,
        created_at,
      });

      expect(presenter.id).toBe('61cd7b66-c215-4b84-bead-9aef0911aba7');
      expect(presenter.name).toBe('test');
      expect(presenter.categories_id).toEqual([
        '61cd7b66-c215-4b84-bead-9aef0911aba7',
      ]);
      expect(presenter.categories).not.toBeDefined();
      expect(presenter.created_at).toBe(created_at);

      const presenterWithCategories = new GenrePresenter({
        id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
        name: 'test',
        categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
        categories: [
          {
            id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
            name: 'test',
            created_at,
          },
        ],
        is_active: true,
        created_at,
      });

      expect(presenterWithCategories.id).toBe(
        '61cd7b66-c215-4b84-bead-9aef0911aba7',
      );
      expect(presenterWithCategories.name).toBe('test');
      expect(presenterWithCategories.categories_id).toEqual([
        '61cd7b66-c215-4b84-bead-9aef0911aba7',
      ]);
      expect(presenterWithCategories.categories).toBeDefined();
      expect(presenterWithCategories.categories?.length).toBe(1);
      expect(presenterWithCategories.categories?.[0]).toBeInstanceOf(
        GenreCategoryPresenter,
      );
      expect(presenterWithCategories.categories?.[0].id).toBe(
        '61cd7b66-c215-4b84-bead-9aef0911aba7',
      );
      expect(presenterWithCategories.categories?.[0].name).toBe('test');
      expect(presenterWithCategories.categories?.[0].created_at).toBe(
        created_at,
      );
      expect(presenterWithCategories.created_at).toBe(created_at);
    });
  });

  it('should presenter data', () => {
    const created_at = new Date();
    let presenter = new GenrePresenter({
      id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
      name: 'actor test',
      categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
      is_active: true,
      created_at,
    });

    let data = instanceToPlain(presenter, { exposeUnsetFields: false });
    expect(data).toStrictEqual({
      id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
      name: 'actor test',
      categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
      is_active: true,
      created_at: created_at.toISOString().slice(0, 19) + '.000Z',
    });

    presenter = new GenrePresenter({
      id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
      name: 'director test',
      categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
      categories: [
        {
          id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
          name: 'test',
          created_at,
        },
      ],
      is_active: true,
      created_at,
    });

    data = instanceToPlain(presenter);
    expect(data).toStrictEqual({
      id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
      name: 'director test',
      categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
      categories: [
        {
          id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
          name: 'test',
          created_at: created_at.toISOString().slice(0, 19) + '.000Z',
        },
      ],
      is_active: true,
      created_at: created_at.toISOString().slice(0, 19) + '.000Z',
    });
  });
});

describe('GenreCollectionPresenter Unit Tests', () => {
  describe('constructor', () => {
    it('should set values', () => {
      const created_at = new Date();
      const item = {
        id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
        name: 'actor test',
        categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
        categories: [
          {
            id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
            name: 'test',
            created_at,
          },
        ],
        is_active: true,
        created_at,
      };
      const presenter = new GenreCollectionPresenter({
        items: [item],
        current_page: 1,
        per_page: 2,
        last_page: 3,
        total: 4,
      });

      expect(presenter.meta).toBeInstanceOf(PaginationPresenter);
      expect(presenter.meta).toEqual(
        new PaginationPresenter({
          current_page: 1,
          per_page: 2,
          last_page: 3,
          total: 4,
        }),
      );
      expect(presenter.data).toStrictEqual([new GenrePresenter(item)]);
      expect(presenter.data[0].categories).toHaveLength(1);
      expect(presenter.data[0].categories[0]).toBeInstanceOf(
        GenreCategoryPresenter,
      );
    });
  });

  it('should presenter data', () => {
    const created_at = new Date();
    const presenter = new GenreCollectionPresenter({
      items: [
        {
          id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
          name: 'test name',
          categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
          categories: [
            {
              id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
              name: 'test',
              created_at,
            },
          ],
          is_active: true,
          created_at,
        },
      ],
      current_page: 1,
      per_page: 2,
      last_page: 3,
      total: 4,
    });

    expect(instanceToPlain(presenter)).toStrictEqual({
      meta: {
        current_page: 1,
        per_page: 2,
        last_page: 3,
        total: 4,
      },
      data: [
        {
          id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
          name: 'test name',
          categories_id: ['61cd7b66-c215-4b84-bead-9aef0911aba7'],
          categories: [
            {
              id: '61cd7b66-c215-4b84-bead-9aef0911aba7',
              name: 'test',
              created_at: created_at.toISOString().slice(0, 19) + '.000Z',
            },
          ],
          is_active: true,
          created_at: created_at.toISOString().slice(0, 19) + '.000Z',
        },
      ],
    });
  });
});
