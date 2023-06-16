import { ListGenresUseCase } from '@fc/micro-videos/genre/application';
import { SortDirection } from '@fc/micro-videos/@seedwork/domain';

export class SearchGenreDto implements ListGenresUseCase.Input {
  page?: number;
  per_page?: number;
  sort?: string;
  sort_dir?: SortDirection;
  filter?: {
    name?: string;
    categories?: string[];
  };
}
