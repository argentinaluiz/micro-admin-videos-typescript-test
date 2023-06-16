import { CastMemberType } from '@fc/micro-videos/cast-member/domain';
import { CreateCastMemberUseCase } from '@fc/micro-videos/cast-member/application';
import { IsNotEmpty, IsString, IsIn, IsInt } from 'class-validator';

export class CreateCastMemberDto implements CreateCastMemberUseCase.Input {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn([CastMemberType.Types.ACTOR, CastMemberType.Types.DIRECTOR])
  @IsInt()
  @IsNotEmpty()
  type: CastMemberType.Types;
}
