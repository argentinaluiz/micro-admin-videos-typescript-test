import { UpdateCastMemberUseCase } from "../../update-cast-member.use-case";
import { CastMemberInMemoryRepository } from "../../../../infra/db/in-memory/cast-member-in-memory.repository";
import NotFoundError from "../../../../../@seedwork/domain/errors/not-found.error";
import { CastMember } from "../../../../domain/entities/cast-member";
import { Either, EntityValidationError } from "../../../../../@seedwork/domain";
import { CastMemberType, CastMemberTypesValues, InvalidCastMemberTypeError } from "../../../../domain";

describe("UpdateCastMemberUseCase Unit Tests", () => {
  let useCase: UpdateCastMemberUseCase.UseCase;
  let repository: CastMemberInMemoryRepository;

  beforeEach(() => {
    repository = new CastMemberInMemoryRepository();
    useCase = new UpdateCastMemberUseCase.UseCase(repository);
    jest.restoreAllMocks();
  });

  describe("handleError method", () => {
    it("should throw a generic error", () => {
      let error = new Error("error test");
      expect(() => useCase["handleError"](error, null)).toThrowError(error);

      expect(() =>
        useCase["handleError"](error, new Error("cast member type error"))
      ).toThrowError(error);
    });

    it("should throw an entity validation error", () => {
      let error = new EntityValidationError({ name: ["error test"] });
      expect(() => useCase["handleError"](error, null)).toThrowError(error);

      expect(() =>
        useCase["handleError"](error, new Error("cast member type error"))
      ).toThrowError(error);
      expect(error.error).toStrictEqual({
        name: ["error test"],
        type: ["cast member type error"],
      });
    });
  });

  describe("execute method", () => {
    it("should throws error when entity not found", async () => {
      await expect(() =>
        useCase.execute({ id: "fake id", name: "fake", type: "fake" } as any)
      ).rejects.toThrow(new NotFoundError('fake id', CastMember));
    });

    it("should throw an generic error", async () => {
      const castMember = CastMember.fake().anActor().build();
      await repository.insert(castMember);
      const expectedError = new Error("generic error");
      jest.spyOn(repository, "update").mockRejectedValue(expectedError);
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      await expect(
        useCase.execute({
          id: castMember.id,
          name: "test",
          type: CastMemberType.TYPES.ACTOR,
        })
      ).rejects.toThrowError(expectedError);
      expect(spyHandleError).toHaveBeenLastCalledWith(expectedError, null);
    });

    it("should throw an entity validation error", async () => {
      const castMember = CastMember.fake().anActor().build();
      await repository.insert(castMember);
      const expectedError = new EntityValidationError({
        name: ["is required"],
      });
      jest.spyOn(CastMember, "validate").mockImplementation(() => {
        throw expectedError;
      });
      const spyHandleError = jest.spyOn(useCase, "handleError" as any);
      await expect(
        useCase.execute({
          id: castMember.id,
          name: "test",
          type: CastMemberType.TYPES.ACTOR,
        })
      ).rejects.toThrowError(expectedError);
      expect(spyHandleError).toHaveBeenLastCalledWith(expectedError, null);

      const castMemberTypeError = new InvalidCastMemberTypeError(
        "invalid type"
      );
      jest
        .spyOn(CastMemberType, "create")
        .mockImplementation(() => Either.fail(castMemberTypeError));
      await expect(
        useCase.execute({
          id: castMember.id,
          name: "test",
          type: CastMemberType.TYPES.ACTOR,
        })
      ).rejects.toThrowError(expectedError);
      expect(spyHandleError).toHaveBeenLastCalledWith(
        expectedError,
        castMemberTypeError
      );
    });

    it("should update a cast member", async () => {
      const spyUpdate = jest.spyOn(repository, "update");
      const entity = CastMember.fake().anActor().build();
      repository.items = [entity];

      let output = await useCase.execute({ id: entity.id, name: "test", type: CastMemberType.TYPES.ACTOR });
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: entity.id,
        name: "test",
        type: CastMemberType.TYPES.ACTOR,
        created_at: entity.created_at,
      });

      type Arrange = {
        input: {
          id: string;
          name: string;
          type: CastMemberTypesValues;
        };
        expected: {
          id: string;
          name: string;
          type: CastMemberTypesValues;
          created_at: Date;
        };
      };
      const arrange: Arrange[] = [
        {
          input: {
            id: entity.id,
            name: "test",
            type: CastMemberType.TYPES.DIRECTOR,
          },
          expected: {
            id: entity.id,
            name: "test",
            type: CastMemberType.TYPES.DIRECTOR,
            created_at: entity.created_at,
          },
        },
      ];

      for (const i of arrange) {
        output = await useCase.execute({
          id: i.input.id,
          name: i.input.name,
          type: i.input.type,
        });
        expect(output).toStrictEqual({
          id: entity.id,
          name: i.expected.name,
          type: i.expected.type,
          created_at: i.expected.created_at,
        });
      }
    });
  });
});
