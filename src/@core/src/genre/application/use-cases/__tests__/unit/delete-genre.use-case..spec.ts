import { DeleteGenreUseCase } from "../../delete-genre.use-case";
import GenreInMemoryRepository from "../../../../infra/db/in-memory/genre-in-memory.repository";
import NotFoundError from "../../../../../@seedwork/domain/errors/not-found.error";
import { Genre } from "../../../../domain/entities/genre";
import { UnitOfWorkInterface } from "../../../../../@seedwork/domain";
import { UnitOfWorkInMemory } from "../../../../../@seedwork/infra";

describe("DeleteGenreUseCase Unit Tests", () => {
  let useCase: DeleteGenreUseCase.UseCase;
  let repository: GenreInMemoryRepository;
  let unitOfWork: UnitOfWorkInterface;
  beforeEach(() => {
    repository = new GenreInMemoryRepository();
    unitOfWork = new UnitOfWorkInMemory({
      get: async (name: string) => {
        if (name === "GenreRepository") return repository;
        throw new Error("Repository not found");
      },
    });
    useCase = new DeleteGenreUseCase.UseCase(unitOfWork);
  });

  it("should throws error when entity not found", async () => {
    await expect(() => useCase.execute({ id: "fake id" })).rejects.toThrow(
      new NotFoundError("fake id", Genre)
    );
  });

  it("should delete a genre", async () => {
    const spyUowDo = jest.spyOn(unitOfWork, "do");
    const genre = Genre.fake().aGenre().build();
    const items = [genre];
    repository.items = items;
    await useCase.execute({
      id: genre.id,
    });
    expect(spyUowDo).toHaveBeenCalled();
    expect(repository.items).toHaveLength(0);
  });
});
