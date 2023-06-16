import { CreateGenreUseCase } from '@fc/micro-videos/genre/application';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreateGenreDto implements CreateGenreUseCase.Input {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsNotEmpty()
  categories_id: string[];
}
