import { Category } from "../../../category/domain";
import { Genre } from "../../domain";

export type GenreSimpleOutput = {
  id: string;
  name: string;
  categories_id: string[];
  is_active: boolean;
  created_at: Date;
};

export class GenreSimpleOutputMapper {
  static toOutput(entity: Genre): GenreSimpleOutput {
    return entity.toJSON();
  }
}

export type GenreCategory = {
  id: string;
  name: string;
  created_at: Date;
};

export type GenreWithRelationsOutput = GenreSimpleOutput & {
  categories: GenreCategory[];
};

export class GenreWithRelationsOutputMapper {
  static toOutput(
    entity: Genre,
    categories: Category[]
  ): GenreWithRelationsOutput {
    const { id, name, categories_id, is_active, created_at } =
      GenreSimpleOutputMapper.toOutput(entity);
    return {
      id,
      name,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        created_at: c.created_at,
      })),
      categories_id,
      is_active,
      created_at,
    };
  }
}
