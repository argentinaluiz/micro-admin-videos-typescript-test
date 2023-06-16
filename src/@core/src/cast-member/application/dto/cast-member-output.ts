import { CastMember, CastMemberTypesValues } from "../../domain";

export type CastMemberOutput = {
  id: string;
  name: string;
  type: CastMemberTypesValues;
  created_at: Date;
};

export class CastMemberOutputMapper {
  static toOutput(entity: CastMember): CastMemberOutput {
    return entity.toJSON();
  }
}
