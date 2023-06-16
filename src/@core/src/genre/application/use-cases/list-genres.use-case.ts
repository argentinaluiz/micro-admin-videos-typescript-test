import { GenreRepository } from "../../domain/repository/genre.repository";
import { default as DefaultUseCase } from "../../../@seedwork/application/use-case";
import { SearchInputDto } from "../../../@seedwork/application/dto/search-input";
import {
  PaginationOutputDto,
  PaginationOutputMapper,
} from "../../../@seedwork/application/dto/pagination-output";
import { Category, CategoryRepository } from "../../../category/domain";
import {
  GenreWithRelationsOutput,
  GenreWithRelationsOutputMapper,
} from "../dto";

export namespace ListGenresUseCase {
  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(
      private genreRepo: GenreRepository.Repository,
      private categoriesRepo: CategoryRepository.Repository
    ) {}
    //
    async execute(input: Input): Promise<Output> {
      const params = GenreRepository.SearchParams.create(input);
      const searchResult = await this.genreRepo.search(params);
      const categoriesIdRelated = searchResult.items.reduce((acc, item) => {
        return acc.concat([...item.categories_id.values()]);
      }, []);
      const categoriesRelated = await this.categoriesRepo.findByIds(
        categoriesIdRelated
      );
      return this.toOutput(searchResult, categoriesRelated);
    }

    private toOutput(
      searchResult: GenreRepository.SearchResult,
      categoriesRelated: Category[]
    ): Output {
      const items = searchResult.items.map((i) => {
        const categories = categoriesRelated.filter((c) =>
          i.categories_id.has(c.id)
        );
        return GenreWithRelationsOutputMapper.toOutput(i, categories);
      });
      return PaginationOutputMapper.toOutput(items, searchResult);
    }
  }

  export type Input = SearchInputDto<{
    name?: string;
    categories_id?: string[];
  }>;

  export type Output = PaginationOutputDto<GenreWithRelationsOutput>;
}

export default ListGenresUseCase;
