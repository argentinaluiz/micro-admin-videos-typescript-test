import { InvalidUuidError } from "./../../../@seedwork/domain/errors/invalid-uuid.error";
import { Either } from "./../../../@seedwork/domain/utils/either";
import { CategoryId } from "#category/domain";
import { SearchValidationError } from "../../../@seedwork/domain";
import {
  SearchableRepositoryInterface,
  SearchParams as DefaultSearchParams,
  SearchProps,
  SearchResult as DefaultSearchResult,
} from "../../../@seedwork/domain/persistence/repository-contracts";
import { Genre, GenreId } from "../entities/genre";

export namespace GenreRepository {
  export type Filter = {
    name?: string;
    categories_id?: CategoryId[];
  };

  export class SearchParams extends DefaultSearchParams<Filter> {
    get filter(): Filter | null {
      return this._filter;
    }

    private constructor(props: SearchProps<Filter> = {}) {
      super(props);
    }

    static create(
      props: Omit<SearchProps<Filter>, "filter"> & {
        filter?: {
          name?: string;
          categories_id?: CategoryId[] | string[];
        };
      } = {}
    ) {
      const [categoriesId, errorCategoriesId] = props.filter?.categories_id
        ? Either.ok(props.filter.categories_id)
            .chainEach<CategoryId[], InvalidUuidError[]>((item) => {
              return Either.safe(() =>
                item instanceof CategoryId ? item : new CategoryId(item)
              );
            })
            .asArray()
        : Either.ok<CategoryId[]>(null).asArray();

      if (errorCategoriesId) {
        const error = new SearchValidationError();
        error.setFromError("categories_id", errorCategoriesId);
        throw error;
      }

      return new SearchParams({
        ...props,
        filter: {
          name: props.filter?.name || null,
          categories_id: categoriesId,
        },
      });
    }

    protected set filter(value: Filter | null) {
      const _value =
        !value || (value as unknown) === "" || typeof value !== "object"
          ? null
          : value;

      const filter = {
        ...(_value.name && { name: `${_value?.name}` }),
        ...(_value.categories_id && { categories_id: _value.categories_id }),
      };

      this._filter = Object.keys(filter).length === 0 ? null : filter;
    }
  }

  export class SearchResult extends DefaultSearchResult<Genre, Filter> {
    toJSON(forceEntity = false) {
      const props = super.toJSON(forceEntity);
      return {
        ...props,
        filter: props.filter
          ? {
              ...(props.filter.name && { name: props.filter.name }),
              ...(props.filter.categories_id && {
                categories_id: props.filter.categories_id.map((c) => c instanceof CategoryId ? c.value : c),
              }),
            }
          : null,
      };
    }
  }

  export interface Repository
    extends SearchableRepositoryInterface<
      Genre,
      GenreId,
      Filter,
      SearchParams,
      SearchResult
    > {}
}

export default GenreRepository;
