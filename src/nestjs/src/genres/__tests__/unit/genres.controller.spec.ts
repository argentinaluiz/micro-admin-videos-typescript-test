import { SortDirection } from '@fc/micro-videos/@seedwork/domain';
import {
  CreateGenreUseCase,
  UpdateGenreUseCase,
  GetGenreUseCase,
  ListGenresUseCase,
} from '@fc/micro-videos/genre/application';
import { GenresController } from '../../genres.controller';
import { CreateGenreDto } from '../../dto/create-genre.dto';
import { UpdateGenreDto } from '../../dto/update-genre.dto';
import {
  GenrePresenter,
  GenreCollectionPresenter,
} from '../../presenter/genre.presenter';

describe('GenreController Unit Tests', () => {
  let controller: GenresController;

  beforeEach(async () => {
    controller = new GenresController();
  });

  it('should creates a cast member', async () => {
    const output: CreateGenreUseCase.Output = {
      id: '9366b7dc-2d71-4799-b91c-c64adb205104',
      name: 'test name',
      categories_id: ['7b3a4b5c-8d9e-11eb-8dcd-0242ac130003'],
      is_active: true,
      created_at: new Date(),
    };
    const mockCreateUseCase = {
      execute: jest.fn().mockReturnValue(Promise.resolve(output)),
    };
    //@ts-expect-error define part of methods
    controller['createUseCase'] = mockCreateUseCase;
    const input: CreateGenreDto = {
      name: 'test name',
      categories_id: ['7b3a4b5c-8d9e-11eb-8dcd-0242ac130003'],
    };
    const presenter = await controller.create(input);
    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(input);
    expect(presenter).toBeInstanceOf(GenrePresenter);
    expect(presenter).toStrictEqual(new GenrePresenter(output));
  });

  it('should updates a cast member', async () => {
    const id = '9366b7dc-2d71-4799-b91c-c64adb205104';
    const output: UpdateGenreUseCase.Output = {
      id,
      name: 'test name',
      categories_id: ['7b3a4b5c-8d9e-11eb-8dcd-0242ac130003'],
      is_active: true,
      created_at: new Date(),
    };
    const mockUpdateUseCase = {
      execute: jest.fn().mockReturnValue(Promise.resolve(output)),
    };
    //@ts-expect-error defined part of methods
    controller['updateUseCase'] = mockUpdateUseCase;
    const input: UpdateGenreDto = {
      name: 'test name',
      categories_id: ['7b3a4b5c-8d9e-11eb-8dcd-0242ac130003'],
    };
    const presenter = await controller.update(id, input);
    expect(mockUpdateUseCase.execute).toHaveBeenCalledWith({ id, ...input });
    expect(presenter).toBeInstanceOf(GenrePresenter);
    expect(presenter).toStrictEqual(new GenrePresenter(output));
  });

  it('should deletes a cast member', async () => {
    const expectedOutput = undefined;
    const mockDeleteUseCase = {
      execute: jest.fn().mockReturnValue(Promise.resolve(expectedOutput)),
    };
    //@ts-expect-error define part of methods
    controller['deleteUseCase'] = mockDeleteUseCase;
    const id = '9366b7dc-2d71-4799-b91c-c64adb205104';
    expect(controller.remove(id)).toBeInstanceOf(Promise);
    const output = await controller.remove(id);
    expect(mockDeleteUseCase.execute).toHaveBeenCalledWith({ id });
    expect(expectedOutput).toStrictEqual(output);
  });

  it('should gets a cast member', async () => {
    const id = '9366b7dc-2d71-4799-b91c-c64adb205104';
    const output: GetGenreUseCase.Output = {
      id,
      name: 'test name',
      categories_id: ['7b3a4b5c-8d9e-11eb-8dcd-0242ac130003'],
      categories: [
        {
          id: '7b3a4b5c-8d9e-11eb-8dcd-0242ac130003',
          name: 'category name',
          created_at: new Date(),
        },
      ],
      is_active: true,
      created_at: new Date(),
    };
    const mockGetUseCase = {
      execute: jest.fn().mockReturnValue(Promise.resolve(output)),
    };
    //@ts-expect-error defined part of methods
    controller['getUseCase'] = mockGetUseCase;
    const presenter = await controller.findOne(id);
    expect(mockGetUseCase.execute).toHaveBeenCalledWith({ id });
    expect(presenter).toBeInstanceOf(GenrePresenter);
    expect(presenter).toStrictEqual(new GenrePresenter(output));
  });

  it('should list cast members', async () => {
    const output: ListGenresUseCase.Output = {
      items: [
        {
          id: '9366b7dc-2d71-4799-b91c-c64adb205104',
          name: 'test name',
          categories_id: ['7b3a4b5c-8d9e-11eb-8dcd-0242ac130003'],
          categories: [
            {
              id: '7b3a4b5c-8d9e-11eb-8dcd-0242ac130003',
              name: 'category name',
              created_at: new Date(),
            },
          ],
          is_active: true,
          created_at: new Date(),
        },
      ],
      current_page: 1,
      last_page: 1,
      per_page: 1,
      total: 1,
    };
    const mockListUseCase = {
      execute: jest.fn().mockReturnValue(Promise.resolve(output)),
    };
    //@ts-expect-error define part of methods
    controller['listUseCase'] = mockListUseCase;
    const searchParams = {
      page: 1,
      per_page: 2,
      sort: 'name',
      sort_dir: 'desc' as SortDirection,
      filter: {
        name: 'test name',
        categories_id: ['7b3a4b5c-8d9e-11eb-8dcd-0242ac130003'],
      },
    };
    const presenter = await controller.search(searchParams);
    expect(presenter).toBeInstanceOf(GenreCollectionPresenter);
    expect(mockListUseCase.execute).toHaveBeenCalledWith(searchParams);
    expect(presenter).toEqual(new GenreCollectionPresenter(output));
  });
});
