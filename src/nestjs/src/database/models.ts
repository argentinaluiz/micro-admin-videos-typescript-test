import { CategorySequelize } from '@fc/micro-videos/category/infra';
import { CastMemberSequelize } from '@fc/micro-videos/cast-member/infra';
import { GenreSequelize } from '@fc/micro-videos/genre/infra';

export default [
  CategorySequelize.CategoryModel,
  CastMemberSequelize.CastMemberModel,
  GenreSequelize.GenreModel,
  GenreSequelize.GenreCategoryModel,
];
