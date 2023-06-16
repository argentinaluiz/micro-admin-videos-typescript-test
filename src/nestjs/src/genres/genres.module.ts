import { GenreSequelize } from '@fc/micro-videos/genre/infra';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GenresController } from './genres.controller';
import { GENRE_PROVIDERS } from './genres.providers';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    CategoriesModule,
    SequelizeModule.forFeature([
      GenreSequelize.GenreModel,
      GenreSequelize.GenreCategoryModel,
    ]),
  ],
  controllers: [GenresController],
  providers: [
    ...Object.values(GENRE_PROVIDERS.REPOSITORIES),
    ...Object.values(GENRE_PROVIDERS.USE_CASES),
  ],
})
export class GenresModule {}
