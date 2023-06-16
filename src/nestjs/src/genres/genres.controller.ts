import {
  CreateGenreUseCase,
  DeleteGenreUseCase,
  GenreSimpleOutput,
  GenreWithRelationsOutput,
  GetGenreUseCase,
  ListGenresUseCase,
  UpdateGenreUseCase,
} from '@fc/micro-videos/genre/application';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Inject,
  Put,
  HttpCode,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { SearchGenreDto } from './dto/search-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import {
  GenreCollectionPresenter,
  GenrePresenter,
} from './presenter/genre.presenter';

@Controller('genres')
export class GenresController {
  @Inject(CreateGenreUseCase.UseCase)
  private createUseCase: CreateGenreUseCase.UseCase;

  @Inject(UpdateGenreUseCase.UseCase)
  private updateUseCase: UpdateGenreUseCase.UseCase;

  @Inject(DeleteGenreUseCase.UseCase)
  private deleteUseCase: DeleteGenreUseCase.UseCase;

  @Inject(GetGenreUseCase.UseCase)
  private getUseCase: GetGenreUseCase.UseCase;

  @Inject(ListGenresUseCase.UseCase)
  private listUseCase: ListGenresUseCase.UseCase;

  //Arquitetura Hexagonal - Ports

  @Post()
  async create(@Body() createGenreDto: CreateGenreDto) {
    const output = await this.createUseCase.execute(createGenreDto);
    return GenresController.genreToResponse(output);
  }

  @Get()
  async search(@Query() searchParams: SearchGenreDto) {
    const output = await this.listUseCase.execute(searchParams);
    return new GenreCollectionPresenter(output);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 422 })) id: string,
  ) {
    const output = await this.getUseCase.execute({ id });
    return GenresController.genreToResponse(output);
  }

  @Put(':id') //PUT vs PATCH
  async update(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 422 })) id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    const output = await this.updateUseCase.execute({
      id,
      ...updateGenreDto,
    });
    return GenresController.genreToResponse(output);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 422 })) id: string,
  ) {
    return this.deleteUseCase.execute({ id });
  }

  static genreToResponse(output: GenreSimpleOutput | GenreWithRelationsOutput) {
    return new GenrePresenter(output);
  }
}
