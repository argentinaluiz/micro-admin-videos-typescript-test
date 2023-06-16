import { GenreId } from "./../../../domain/entities/genre";
import {
  Column,
  DataType,
  PrimaryKey,
  Table,
  Model,
  BelongsToMany,
  ForeignKey,
  HasMany,
} from "sequelize-typescript";
import {
  NotFoundError,
  LoadEntityError,
  EntityValidationError,
  SortDirection,
  Either,
  InvalidUuidError,
  UnitOfWorkInterface,
  InvalidArgumentError,
} from "#seedwork/domain";
import {
  GenreRepository as GenreRepositoryContract,
  Genre,
} from "#genre/domain";
import Sequelize, { literal, Op, QueryTypes } from "sequelize";
import { CategorySequelize } from "../../../../category/infra";
import { CategoryId } from "../../../../category/domain";

export namespace GenreSequelize {
  type GenreModelProps = {
    id: string;
    name: string;
    categories_id: GenreCategoryModel[];
    categories: CategorySequelize.CategoryModel[];
    is_active: boolean;
    created_at: Date;
  };

  //lembrar do $set não está funcionando
  //se o save direto dos relacionamentos não funcionar, o model é salvado mesmo assim
  @Table({ tableName: "genres", timestamps: false })
  export class GenreModel extends Model<GenreModelProps> {
    @PrimaryKey
    @Column({ type: DataType.UUID })
    declare id: string;

    @Column({ allowNull: false, type: DataType.STRING(255) })
    declare name: string;

    @Column({ allowNull: false, type: DataType.BOOLEAN })
    declare is_active: boolean;

    @Column({ allowNull: false, type: DataType.DATE(6) })
    declare created_at: Date;

    @HasMany(() => GenreCategoryModel, "genre_id")
    declare categories_id: GenreCategoryModel[];

    @BelongsToMany(
      () => CategorySequelize.CategoryModel,
      () => GenreCategoryModel
    )
    declare categories: CategorySequelize.CategoryModel[];
  }

  type GenreCategoryModelProps = {
    genre_id: string;
    category_id: string;
  };

  @Table({ tableName: "category_genre", timestamps: false })
  export class GenreCategoryModel extends Model<GenreCategoryModelProps> {
    @PrimaryKey
    @ForeignKey(() => GenreModel)
    @Column({ type: DataType.UUID })
    declare genre_id: string;

    @PrimaryKey
    @ForeignKey(() => CategorySequelize.CategoryModel)
    @Column({ type: DataType.UUID })
    declare category_id: string;
  }

  export class GenreRepository implements GenreRepositoryContract.Repository {
    sortableFields: string[] = ["name", "created_at"];
    orderBy = {
      mysql: {
        name: (sort_dir: SortDirection) =>
          `binary ${this.genreModel.name}.name ${sort_dir}`,
      },
    };
    private unitOfWork: UnitOfWorkInterface;
    constructor(
      private genreModel: typeof GenreModel,
      private genreCategoryModel: typeof GenreCategoryModel
    ) {}

    async insert(entity: Genre): Promise<void> {
      const props = GenreModelMapper.toModelProps(entity);
      await this.genreModel.create(props, {
        transaction: this.unitOfWork?.getTransaction(),
        include: ["categories_id"],
      });
    }

    async bulkInsert(entities: Genre[]): Promise<void> {
      const props = entities.map((e) => GenreModelMapper.toModelProps(e));
      await this.genreModel.bulkCreate(props, {
        transaction: this.unitOfWork?.getTransaction(),
        include: ["categories_id"],
      });
    }

    async findById(id: string | GenreId): Promise<Genre> {
      //DDD Entidade - regras - valida
      const _id = `${id}`;
      const model = await this._get(_id);
      return GenreModelMapper.toEntity(model);
    }

    async findAll(): Promise<Genre[]> {
      const models = await this.genreModel.findAll({
        include: ["categories_id"],
        transaction: this.unitOfWork?.getTransaction(),
      });
      return models.map((m) => GenreModelMapper.toEntity(m));
    }

    async findByIds(ids: GenreId[]): Promise<Genre[]> {
      const models = await this.genreModel.findAll({
        where: {
          id: {
            [Op.in]: ids.map((id) => `${id}`),
          },
        },
        include: ["categories_id"],
        transaction: this.unitOfWork?.getTransaction(),
      });
      return models.map((m) => GenreModelMapper.toEntity(m));
    }

    async existsById(ids: GenreId[]): Promise<[GenreId[], GenreId[]]> {
      if (!ids.length) {
        throw new InvalidArgumentError(
          "ids must be an array with at least one element"
        );
      }

      const existsGenreModels = await this.genreModel.findAll({
        attributes: ["id"],
        where: {
          id: {
            [Op.in]: ids.map((id) => `${id}`),
          },
        },
        transaction: this.unitOfWork?.getTransaction(),
      });
      const existsGenreIds = existsGenreModels.map((m) => new GenreId(m.id));
      const notExistsGenreIds = ids.filter(
        (id) => !existsGenreIds.some((e) => e.equals(id))
      );
      return [existsGenreIds, notExistsGenreIds];
    }

    async update(entity: Genre): Promise<void> {
      const model = await this._get(entity.id);
      await this.genreCategoryModel.destroy({
        where: { genre_id: entity.id },
        transaction: this.unitOfWork?.getTransaction(),
      });
      const { categories_id, ...props } = GenreModelMapper.toModelProps(entity);
      await this.genreModel.update(props, {
        where: { id: entity.id },
        transaction: this.unitOfWork?.getTransaction(),
      });
      await model.$add(
        "categories",
        categories_id.map((c) => c.category_id),
        {
          transaction: this.unitOfWork?.getTransaction(),
        }
      );
    }
    async delete(id: string | GenreId): Promise<void> {
      const _id = `${id}`;
      await this._get(_id);
      await this.genreCategoryModel.destroy({
         where: { genre_id: _id },
      });
      await this.genreModel.destroy({
        where: { id: _id },
        cascade: true,
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    private async _get(id: string): Promise<GenreModel> {
      return this.genreModel.findByPk(id, {
        rejectOnEmpty: new NotFoundError(id, Genre),
        include: ["categories_id"],
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    async search(
      props: GenreRepositoryContract.SearchParams
    ): Promise<GenreRepositoryContract.SearchResult> {
      const offset = (props.page - 1) * props.per_page;
      const limit = props.per_page;
      const genreTableName = this.genreModel.getTableName();
      const genreCategoryTableName = this.genreCategoryModel.getTableName();
      const genreAlias = this.genreModel.name;

      const wheres = [];

      if (props.filter && (props.filter.name || props.filter.categories_id)) {
        if (props.filter.name) {
          wheres.push({
            field: "name",
            value: `%${props.filter.name}%`,
            get condition() {
              return {
                [this.field]: {
                  [Op.like]: this.value,
                },
              };
            },
            rawCondition: `${genreAlias}.name LIKE :name`,
          });
        }

        if (props.filter.categories_id) {
          wheres.push({
            field: "categories_id",
            value: props.filter.categories_id.map((c) => c.value),
            get condition() {
              return {
                ["$categories_id.category_id$"]: {
                  [Op.in]: this.value,
                },
              };
            },
            rawCondition: `${genreCategoryTableName}.category_id IN (:categories_id)`,
          });
        }
      }

      const orderBy =
        props.sort && this.sortableFields.includes(props.sort)
          ? this.formatSort(props.sort, props.sort_dir)
          : `${genreAlias}.\`created_at\` DESC`;

      const count = await this.genreModel.count({
        distinct: true,
        include: ["categories_id"],
        transaction: this.unitOfWork?.getTransaction(),
        where: wheres.length
          ? { [Op.and]: wheres.map((w) => w.condition) }
          : {},
      });

      const columnOrder = orderBy.replace("binary", "").trim().split(" ")[0];

      const query = [
        "SELECT",
        `DISTINCT ${genreAlias}.\`id\`,${columnOrder} FROM ${genreTableName} as ${genreAlias}`,
        `INNER JOIN ${genreCategoryTableName} ON ${genreAlias}.\`id\` = ${genreCategoryTableName}.\`genre_id\``,
        wheres.length
          ? `WHERE ${wheres.map((w) => w.rawCondition).join(" AND ")}`
          : "",
        `ORDER BY ${orderBy}`,
        `LIMIT ${limit}`,
        `OFFSET ${offset}`,
      ];

      const [ids] = await this.genreModel.sequelize.query(query.join(" "), {
        replacements: wheres.reduce(
          (acc, w) => ({ ...acc, [w.field]: w.value }),
          {}
        ),
        transaction: this.unitOfWork?.getTransaction(),
      });

      const models = await this.genreModel.findAll({
        where: {
          id: {
            [Op.in]: ids.map((id: { id: string }) => id.id) as string[],
          },
        },
        include: ["categories_id"],
        transaction: this.unitOfWork?.getTransaction(),
        order: Sequelize.literal(orderBy),
      });
      return new GenreRepositoryContract.SearchResult({
        items: models.map((m) => GenreModelMapper.toEntity(m)),
        current_page: props.page,
        per_page: props.per_page,
        total: count,
        filter: props.filter,
        sort: props.sort,
        sort_dir: props.sort_dir,
      });
    }

    private formatSort(sort: string, sort_dir: SortDirection) {
      const dialect = this.genreModel.sequelize.getDialect();
      if (this.orderBy[dialect] && this.orderBy[dialect][sort]) {
        return this.orderBy[dialect][sort](sort_dir);
      }
      return `${this.genreModel.name}.\`${sort}\` ${sort_dir}`;
    }

    setUnitOfWork(unitOfWork: UnitOfWorkInterface): void {
      this.unitOfWork = unitOfWork;
    }
  }

  export class GenreModelMapper {
    static toEntity(model: GenreModel) {
      const { id, categories_id, ...otherData } = model.toJSON();
      const [categoriesId, errorsCategoriesId] = Either.of(categories_id)
        .map((value) => (Array.isArray(value) ? value : []))
        .chainEach<CategoryId[], InvalidUuidError[]>((genreCategory) =>
          Either.safe(() => {
            if (
              typeof genreCategory !== "object" ||
              !("category_id" in genreCategory)
            ) {
              throw new Error(
                "The category is not a GenreCategoryModel or it has a category_id property. Actually is a " +
                  typeof genreCategory
              );
            }
            return new CategoryId(genreCategory.category_id ?? "undefined");
          })
        );
      try {
        return Genre.create(
          {
            ...otherData,
            categories_id: errorsCategoriesId ? [] : categoriesId,
          },
          new GenreId(id)
        );
      } catch (e) {
        if (e instanceof EntityValidationError) {
          e.setFromError("categories_id", errorsCategoriesId);
          throw new LoadEntityError(e.error);
        }

        throw e;
      }
    }

    static toModelProps(entity: Genre) {
      const { categories_id, ...otherData } = entity.toJSON();
      return {
        ...otherData,
        categories_id: categories_id.map(
          (category_id) =>
            new GenreCategoryModel({
              genre_id: entity.id,
              category_id: category_id,
            })
        ),
      };
    }
  }
}
