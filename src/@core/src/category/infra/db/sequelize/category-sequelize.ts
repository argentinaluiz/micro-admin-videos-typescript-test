import { CategoryId } from "./../../../domain/entities/category";
import {
  Column,
  DataType,
  PrimaryKey,
  Table,
  Model,
} from "sequelize-typescript";
import { SequelizeModelFactory } from "../../../../@seedwork/infra/db/sequelize/sequelize-model-factory";
import {
  NotFoundError,
  LoadEntityError,
  EntityValidationError,
  SortDirection,
  InvalidArgumentError,
} from "#seedwork/domain";
import {
  CategoryRepository as CategoryRepositoryContract,
  Category,
} from "#category/domain";
import { literal, Op } from "sequelize";
import { UnitOfWorkSequelize } from "../../../../@seedwork/infra/db/sequelize/unit-of-work-sequelize";

export namespace CategorySequelize {
  type CategoryModelProps = {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
  };

  @Table({ tableName: "categories", timestamps: false })
  export class CategoryModel extends Model<CategoryModelProps> {
    @PrimaryKey
    @Column({ type: DataType.UUID })
    declare id: string;

    @Column({ allowNull: false, type: DataType.STRING(255) })
    declare name: string;

    @Column({ allowNull: true, type: DataType.TEXT })
    declare description: string | null;

    @Column({ allowNull: false, type: DataType.BOOLEAN })
    declare is_active: boolean;

    @Column({ allowNull: false, type: DataType.DATE(6) })
    declare created_at: Date;

    static factory() {
      const chance: Chance.Chance = require("chance")();
      return new SequelizeModelFactory<CategoryModel, CategoryModelProps>(
        CategoryModel,
        () => ({
          id: chance.guid({ version: 4 }),
          name: chance.word(),
          description: chance.paragraph(),
          is_active: true,
          created_at: chance.date(),
        })
      );
    }
  }

  export class CategoryRepository
    implements CategoryRepositoryContract.Repository
  {
    unitOfWork: UnitOfWorkSequelize | null = null;
    sortableFields: string[] = ["name", "created_at"];
    orderBy = {
      mysql: {
        name: (sort_dir: SortDirection) => literal(`binary name ${sort_dir}`),
      },
    };
    constructor(private categoryModel: typeof CategoryModel) {}

    async insert(entity: Category): Promise<void> {
      await this.categoryModel.create(entity.toJSON(), {
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    async bulkInsert(entities: Category[]): Promise<void> {
      await this.categoryModel.bulkCreate(
        entities.map((e) => e.toJSON()),
        {
          transaction: this.unitOfWork?.getTransaction(),
        }
      );
    }

    async findById(id: string | CategoryId): Promise<Category> {
      //DDD Entidade - regras - valida
      const _id = `${id}`;
      const model = await this._get(_id);
      return CategoryModelMapper.toEntity(model);
    }

    async findAll(): Promise<Category[]> {
      const models = await this.categoryModel.findAll({
        transaction: this.unitOfWork?.getTransaction(),
      });
      return models.map((m) => CategoryModelMapper.toEntity(m));
    }

    async findByIds(ids: CategoryId[]): Promise<Category[]> {
      const models = await this.categoryModel.findAll({
        where: {
          id: {
            [Op.in]: ids.map((id) => `${id}`),
          },
        },
        transaction: this.unitOfWork?.getTransaction(),
      });
      return models.map((m) => CategoryModelMapper.toEntity(m));
    }

    async existsById(ids: CategoryId[]): Promise<[CategoryId[], CategoryId[]]> {
      if (!ids.length) {
        throw new InvalidArgumentError(
          "ids must be an array with at least one element"
        );
      }

      const existsCategoryModels = await this.categoryModel.findAll({
        attributes: ["id"],
        where: {
          id: {
            [Op.in]: ids.map((id) => `${id}`),
          },
        },
        transaction: this.unitOfWork?.getTransaction(),
      });
      
      const existsCategoryIds = existsCategoryModels.map((m) => new CategoryId(m.id));
      const notExistsCategoryIds = ids.filter(
        (id) => !existsCategoryIds.some((e) => e.equals(id))
        );
      return [existsCategoryIds, notExistsCategoryIds];
    }

    async update(entity: Category): Promise<void> {
      await this._get(entity.id);
      await this.categoryModel.update(entity.toJSON(), {
        where: { id: entity.id },
        transaction: this.unitOfWork?.getTransaction(),
      });
    }
    async delete(id: string | CategoryId): Promise<void> {
      const _id = `${id}`;
      await this._get(_id);
      this.categoryModel.destroy({
        where: { id: _id },
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    private async _get(id: string): Promise<CategoryModel> {
      return this.categoryModel.findByPk(id, {
        rejectOnEmpty: new NotFoundError(id, Category),
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    async search(
      props: CategoryRepositoryContract.SearchParams
    ): Promise<CategoryRepositoryContract.SearchResult> {
      const offset = (props.page - 1) * props.per_page;
      const limit = props.per_page;
      const { rows: models, count } = await this.categoryModel.findAndCountAll({
        ...(props.filter && {
          where: { name: { [Op.like]: `%${props.filter}%` } },
        }),
        ...(props.sort && this.sortableFields.includes(props.sort)
          ? { order: this.formatSort(props.sort, props.sort_dir) }
          : { order: [["created_at", "DESC"]] }),
        offset,
        limit,
        transaction: this.unitOfWork?.getTransaction(),
      });
      return new CategoryRepositoryContract.SearchResult({
        items: models.map((m) => CategoryModelMapper.toEntity(m)),
        current_page: props.page,
        per_page: props.per_page,
        total: count,
        filter: props.filter,
        sort: props.sort,
        sort_dir: props.sort_dir,
      });
    }

    private formatSort(sort: string, sort_dir: SortDirection) {
      const dialect = this.categoryModel.sequelize.getDialect();
      if (this.orderBy[dialect] && this.orderBy[dialect][sort]) {
        return this.orderBy[dialect][sort](sort_dir);
      }
      return [[sort, sort_dir]];
    }

    setUnitOfWork(unitOfWork: UnitOfWorkSequelize): void {
      this.unitOfWork = unitOfWork;
    }
  }

  export class CategoryModelMapper {
    static toEntity(model: CategoryModel) {
      const { id, ...otherData } = model.toJSON();
      try {
        return new Category(otherData, new CategoryId(id));
      } catch (e) {
        if (e instanceof EntityValidationError) {
          throw new LoadEntityError(e.error);
        }

        throw e;
      }
    }
  }
}
