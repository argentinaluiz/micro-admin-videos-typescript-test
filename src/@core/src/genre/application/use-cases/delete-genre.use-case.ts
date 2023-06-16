import { GenreRepository } from "../../domain/repository/genre.repository";
import {default as DefaultUseCase} from "../../../@seedwork/application/use-case";
import { UnitOfWorkInterface } from "../../../@seedwork/domain";

export namespace DeleteGenreUseCase{
  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(private uow: UnitOfWorkInterface) {}
  
    async execute(input: Input): Promise<Output> {
      await this.uow.do(async (uow) => {
        const genreRepository = await uow.getRepository("GenreRepository") as GenreRepository.Repository;
        await genreRepository.delete(input.id);
      });
    }
  }
  
  export type Input = {
    id: string;
  };
  
  type Output = void;
}


export default DeleteGenreUseCase;