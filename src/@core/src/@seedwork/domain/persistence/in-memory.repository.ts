import NotFoundError from "../errors/not-found.error";
import {
  RepositoryInterface,
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
  SortDirection,
} from "./repository-contracts";
import { ValueObject } from "../value-objects";
import { UnitOfWorkInterface } from "./unit-of-work-interface";
import { InvalidArgumentError } from "../errors/invalid-argument.error";
import { AggregateRoot } from "../entity";

export abstract class InMemoryRepository<
  E extends AggregateRoot,
  EntityId extends ValueObject
> implements RepositoryInterface<E, EntityId>
{
  unitOfWork: UnitOfWorkInterface | null = null;
  items: E[] = [];

  async insert(entity: E): Promise<void> {
    this.items.push(entity);
  }

  async bulkInsert(entities: E[]): Promise<void> {
    this.items.push(...entities);
  }

  async findById(id: string | EntityId): Promise<E> {
    const _id = `${id}`;
    return this._get(_id);
  }

  async findAll(): Promise<E[]> {
    return this.items;
  }

  async findByIds(ids: EntityId[]): Promise<E[]> {
    //avoid to return repeated items
    return this.items.filter((entity) => {
      return ids.some((id) => id.equals(entity.entityId));
    });
  }

  async update(entity: E): Promise<void> {
    await this._get(entity.id);
    const indexFound = this.items.findIndex((i) => i.id === entity.id);
    this.items[indexFound] = entity;
  }

  async delete(id: string | EntityId): Promise<void> {
    const _id = `${id}`;
    await this._get(_id);
    const indexFound = this.items.findIndex((i) => i.id === _id);
    this.items.splice(indexFound, 1);
  }

  async existsById(ids: EntityId[]): Promise<[EntityId[], EntityId[]]> {
    if (!ids.length) {
      throw new InvalidArgumentError(
        "ids must be an array with at least one element"
      );
    }

    if (this.items.length === 0) {
      return [[], ids];
    }

    const existsId = new Set<EntityId>();
    const notExistsId = new Set<EntityId>();
    ids.forEach((id) => {
      const item = this.items.find((entity) => entity.entityId.equals(id));
      item ? existsId.add(id) : notExistsId.add(id);
    });
    return [Array.from(existsId.values()), Array.from(notExistsId.values())];
  }

  protected async _get(id: string): Promise<E> {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundError(id, this.getEntity());
    }
    return item;
  }

  setUnitOfWork(unitOfWork: UnitOfWorkInterface): void {
    this.unitOfWork = unitOfWork;
  }

  abstract getEntity(): new (...args: any[]) => E;
}

export abstract class InMemorySearchableRepository<
    E extends AggregateRoot,
    EntityId extends ValueObject,
    Filter = string
  >
  extends InMemoryRepository<E, EntityId>
  implements SearchableRepositoryInterface<E, EntityId, Filter>
{
  sortableFields: string[] = [];

  async search(props: SearchParams<Filter>): Promise<SearchResult<E, Filter>> {
    const itemsFiltered = await this.applyFilter(this.items, props.filter);
    const itemsSorted = await this.applySort(
      itemsFiltered,
      props.sort,
      props.sort_dir
    );
    const itemsPaginated = await this.applyPaginate(
      itemsSorted,
      props.page,
      props.per_page
    );
    return new SearchResult({
      items: itemsPaginated,
      total: itemsFiltered.length,
      current_page: props.page,
      per_page: props.per_page,
      sort: props.sort,
      sort_dir: props.sort_dir,
      filter: props.filter,
    });
  }

  protected abstract applyFilter(
    items: E[],
    filter: Filter | null
  ): Promise<E[]>;

  protected async applySort(
    items: E[],
    sort: string | null,
    sort_dir: SortDirection | null,
    custom_getter?: (sort: string, item: E) => any
  ): Promise<E[]> {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }

    return [...items].sort((a, b) => {
      const aValue = custom_getter ? custom_getter(sort, a) : a.props[sort];
      const bValue = custom_getter ? custom_getter(sort, b) : b.props[sort];
      if (aValue < bValue) {
        return sort_dir === "asc" ? -1 : 1;
      }

      if (aValue > bValue) {
        return sort_dir === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  protected async applyPaginate(
    items: E[],
    page: SearchParams["page"],
    per_page: SearchParams["per_page"]
  ): Promise<E[]> {
    const start = (page - 1) * per_page; // 1 * 15 = 15
    const limit = start + per_page; // 15 + 15 = 30
    return items.slice(start, limit);
  }
}

//paginação -
//ordenação - sort a > b 1 b > a -1 0
//filtro -
