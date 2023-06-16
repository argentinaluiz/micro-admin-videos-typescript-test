import { ListCastMembersUseCase } from '@fc/micro-videos/cast-member/application';
import { SortDirection } from '@fc/micro-videos/@seedwork/domain';
import { CastMemberType } from '@fc/micro-videos/cast-member/domain';

export class SearchCastMemberDto implements ListCastMembersUseCase.Input {
  page?: number;
  per_page?: number;
  sort?: string;
  sort_dir?: SortDirection;
  filter?: {
    name?: string;
    type?: CastMemberType.Types;
  };
}
