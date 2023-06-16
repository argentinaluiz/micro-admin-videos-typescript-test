import { Category } from "../../../category/domain";
import { Genre } from "../../domain/entities/genre";
import { GenreSimpleOutputMapper, GenreWithRelationsOutputMapper } from "./genre-output";

describe("GenreOutputMapper Unit Tests", () => {
  it("should convert a genre in output", () => {
    const categories = Category.fake().theCategories(2).build();
    const created_at = new Date();
    const entity = Genre.fake()
      .aGenre()
      .withName("test")
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .withCreatedAt(created_at)
      .build();
    const spyToJSON = jest.spyOn(entity, "toJSON");
    const output = GenreSimpleOutputMapper.toOutput(entity);
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.id,
      name: "test",
      categories_id: [
        categories[0].id,
        categories[1].id,
      ],
      is_active: true,
      created_at: created_at,
    });
  });

  it("should convert a genre in output with relations", () => {
    const categories = Category.fake().theCategories(2).build();
    const created_at = new Date();
    const entity = Genre.fake()
      .aGenre()
      .withName("test")
      .withCategoryId(categories[0].entityId)
      .withCategoryId(categories[1].entityId)
      .withCreatedAt(created_at)
      .build();
    const spyToJSON = jest.spyOn(entity, "toJSON");
    const output = GenreWithRelationsOutputMapper.toOutput(entity, categories);
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.id,
      name: "test",
      categories: [
        {
          id: categories[0].id,
          name: categories[0].name,
          created_at: categories[0].created_at,
        },
        {
          id: categories[1].id,
          name: categories[1].name,
          created_at: categories[1].created_at,
        },
      ],
      categories_id: [categories[0].id, categories[1].id],
      is_active: entity.is_active,
      created_at,
    });
  });
});
