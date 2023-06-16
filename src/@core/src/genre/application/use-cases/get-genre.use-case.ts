import GenreRepository from "../../domain/repository/genre.repository";
import {
  GenreWithRelationsOutput,
  GenreWithRelationsOutputMapper,
} from "../dto/genre-output";
import { default as DefaultUseCase } from "../../../@seedwork/application/use-case";
import { CategoryRepository } from "../../../category/domain";

export namespace GetGenreUseCase {
  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(
      private genreRepo: GenreRepository.Repository,
      private categoryRepo: CategoryRepository.Repository
    ) {}

    async execute(input: Input): Promise<Output> {
      const genre = await this.genreRepo.findById(input.id);
      const categories = await this.categoryRepo.findByIds(
        [...genre.categories_id.values()]
      );
      return GenreWithRelationsOutputMapper.toOutput(genre, categories);
    }
  }

  export type Input = {
    id: string;
  };

  export type Output = GenreWithRelationsOutput;
}

export default GetGenreUseCase;
