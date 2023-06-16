import UniqueEntityId from "../../../@seedwork/domain/value-objects/unique-entity-id.vo";
import VideoValidatorFactory from "../validators/genre.validator";
import { EntityValidationError } from "../../../@seedwork/domain/errors/validation-error";
//import { VideoFakeBuilder } from "./genre-fake-builder";
import AggregateRoot from "../../../@seedwork/domain/entity/aggregate-root";
import { CategoryId } from "../../../category/domain";
import { VideoFakeBuilder } from "./genre-fake-builder";
import { GenreId } from "../../../genre/domain";
import { CastMemberId } from "../../../cast-member/domain";
import { Minutes } from "../value-objects/minutes.vo";
import { Year } from "../value-objects/year.vo";
import { Rating } from "../value-objects/rating.vo";

export type VideoProperties = {
  title: string;
  description: Map<string, CategoryId>;
  year_launched: Year;
  duration: Minutes
  rating: Rating
  opened: boolean
  published: boolean
  banner
  thumbnail
  thumbnail_half
  trailer
  video
  categories_id: Map<string, CategoryId>;
  genres_id: Map<string, GenreId>;
  cast_members_id: Map<string, CastMemberId>;
  created_at?: Date;
};

export type VideoCreateCommand = Omit<VideoProperties, "categories_id"> & {
  categories_id: string[] | CategoryId[];
};

export class VideoId extends UniqueEntityId {}

export type VideoPropsJson = Required<
  { id: string } & Omit<VideoProperties, "categories_id">
> & { categories_id: string[] };

export class Video extends AggregateRoot<
  VideoId,
  VideoProperties,
  VideoPropsJson
> {
  constructor(public readonly props: VideoProperties, id?: VideoId) {
    super(props, id ?? new VideoId());
    Video.validate(props);
    this.props.is_active = this.props.is_active ?? true;
    this.props.created_at = this.props.created_at ?? new Date();
  }

  static create(props: VideoCreateCommand, id?: VideoId) {
    const categories_id = new Map<string, CategoryId>();
    props.categories_id.forEach((id) => {
      const categoryId =
        id instanceof CategoryId ? id : new CategoryId(id);
      categories_id.set(categoryId.value, categoryId);
    });
    
    return new Video({ ...props, categories_id }, id);
  }

  update(name: string): void {
    Video.validate({
      ...this.props,
      name,
    });
    this.name = name;
  }

  addCategoryId(categoryId: CategoryId) {
    this.props.categories_id.set(categoryId.value, categoryId);
    Video.validate(this.props);
  }

  removeCategoryId(categoryId: CategoryId) {
    if (this.props.categories_id.has(categoryId.value)) {
      this.props.categories_id.delete(categoryId.value);
    }
    Video.validate(this.props);
  }

  updateCategoriesId(newCategoriesId: CategoryId[]): void {
    if (!newCategoriesId.length) {
      return;
    }
    const categoriesId = new Map<string, CategoryId>();
    newCategoriesId.forEach((categoryId) => {
      categoriesId.set(categoryId.value, categoryId);
    });
    
    Video.validate({
      ...this.props,
      categories_id: categoriesId,
    });
    this.categories_id = categoriesId;
  }

  // syncCategoriesId(newCategoriesIds: CategoryId[]) {
  //   if(!newCategoriesIds.length) {
  //     return;
  //   }
  //   this.categories_id.forEach((category_id) => {
  //     const notExists = !newCategoriesIds.find((newCategoryId) =>
  //       newCategoryId.equals(category_id)
  //     );
  //     if (notExists) {
  //       this.categories_id.delete(category_id.value);
  //     }
  //   });

  //   newCategoriesIds.forEach((categoryId) =>
  //     this.categories_id.set(categoryId.value, categoryId)
  //   );
  //   Video.validate(this.props);
  // }

  static validate(props: VideoProperties) {
    const validator = VideoValidatorFactory.create();
    const isValid = validator.validate(props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  activate() {
    this.props.is_active = true;
  }

  deactivate() {
    this.props.is_active = false;
  }

  get name() {
    return this.props.name;
  }

  private set name(value) {
    this.props.name = value;
  }

  get categories_id() {
    return this.props.categories_id;
  }

  private set categories_id(value: Map<string, CategoryId>) {
    this.props.categories_id = value;
  }

  get is_active() {
    return this.props.is_active;
  }

  private set is_active(value: boolean) {
    this.props.is_active = value ?? true;
  }

  get created_at() {
    return this.props.created_at;
  }

  static fake() {
    return VideoFakeBuilder;
  }

  toJSON(): VideoPropsJson {
    return {
      id: this.id,
      name: this.name,
      categories_id: Array.from(this.categories_id.values()).map(
        (category_id) => category_id.value
      ),
      is_active: this.is_active,
      created_at: this.created_at,
    };
  }
}

//mapeamento em arquivo

//null ou vazio
//tamanho de parametros
//especificas: email, cpf, cnpj, cartao de credito

//desde que não fique preso a lib
//interface
