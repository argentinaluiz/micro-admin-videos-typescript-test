import { UpdateGenreUseCase } from '@fc/micro-videos/genre/application';
import { CreateGenreDto } from './create-genre.dto';

export class UpdateGenreDto
  extends CreateGenreDto
  implements Omit<UpdateGenreUseCase.Input, 'id'> {}
