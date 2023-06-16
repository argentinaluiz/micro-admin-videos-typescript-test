import { CastMember } from "../../domain/entities/cast-member";
import { CastMemberOutputMapper } from "./cast-member-output";

describe("CastMemberOutputMapper Unit Tests", () => {
  it("should convert a cast member in output", () => {
    const created_at = new Date();
    const entity = CastMember.fake()
      .anActor()
      .withName("test")
      .withCreatedAt(created_at)
      .build();
    const spyToJSON = jest.spyOn(entity, "toJSON");
    const output = CastMemberOutputMapper.toOutput(entity);
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.id,
      name: "test",
      type: entity.type.value,
      created_at,
    });
  });
});
