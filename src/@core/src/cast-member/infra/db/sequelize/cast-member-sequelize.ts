import { CastMemberId } from "./../../../domain/entities/cast-member";
import {
  Column,
  DataType,
  PrimaryKey,
  Table,
  Model,
} from "sequelize-typescript";
import {
  NotFoundError,
  LoadEntityError,
  EntityValidationError,
  SortDirection,
  InvalidArgumentError,
} from "#seedwork/domain";
import {
  CastMemberRepository as CastMemberRepositoryContract,
  CastMember,
  CastMemberType,
  CastMemberTypesValues,
} from "#cast-member/domain";
import { literal, Op } from "sequelize";
import { UnitOfWorkSequelize } from "../../../../@seedwork/infra";

export namespace CastMemberSequelize {
  type CastMemberModelProps = {
    id: string;
    name: string;
    type: CastMemberTypesValues;
    created_at: Date;
  };

  @Table({ tableName: "cast_members", timestamps: false })
  export class CastMemberModel extends Model<CastMemberModelProps> {
    @PrimaryKey
    @Column({ type: DataType.UUID })
    declare id: string;

    @Column({ allowNull: false, type: DataType.STRING(255) })
    declare name: string;

    @Column({
      allowNull: false,
      type: DataType.SMALLINT,
    })
    declare type: CastMemberTypesValues;

    @Column({ allowNull: false, type: DataType.DATE(6) })
    declare created_at: Date;
  }

  export class CastMemberRepository
    implements CastMemberRepositoryContract.Repository
  {
    unitOfWork: UnitOfWorkSequelize | null = null;
    sortableFields: string[] = ["name", "created_at"];
    orderBy = {
      mysql: {
        name: (sort_dir: SortDirection) => literal(`binary name ${sort_dir}`),
      },
    };
    constructor(private castMemberModel: typeof CastMemberModel) {}

    async insert(entity: CastMember): Promise<void> {
      await this.castMemberModel.create(entity.toJSON(), {
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    async bulkInsert(entities: CastMember[]): Promise<void> {
      await this.castMemberModel.bulkCreate(
        entities.map((e) => e.toJSON()),
        {
          transaction: this.unitOfWork?.getTransaction(),
        }
      );
    }

    async findById(id: string | CastMemberId): Promise<CastMember> {
      //DDD Entidade - regras - valida
      const _id = `${id}`;
      const model = await this._get(_id);
      return CastMemberModelMapper.toEntity(model);
    }

    async findAll(): Promise<CastMember[]> {
      const models = await this.castMemberModel.findAll({
        transaction: this.unitOfWork?.getTransaction(),
      });
      return models.map((m) => CastMemberModelMapper.toEntity(m));
    }

    async findByIds(ids: CastMemberId[]): Promise<CastMember[]> {
      const models = await this.castMemberModel.findAll({
        where: {
          id: {
            [Op.in]: ids.map((id) => `${id}`),
          },
        },
        transaction: this.unitOfWork?.getTransaction(),
      });
      return models.map((m) => CastMemberModelMapper.toEntity(m));
    }

    async existsById(
      ids: CastMemberId[]
    ): Promise<[CastMemberId[], CastMemberId[]]> {
      if (!ids.length) {
        throw new InvalidArgumentError(
          "ids must be an array with at least one element"
        );
      }

      const existsCastMemberModels = await this.castMemberModel.findAll({
        attributes: ["id"],
        where: {
          id: {
            [Op.in]: ids.map((id) => `${id}`),
          },
        },
        transaction: this.unitOfWork?.getTransaction(),
      });

      const existsCastMemberIds = existsCastMemberModels.map(
        (m) => new CastMemberId(m.id)
      );
      const notExistsCastMemberIds = ids.filter(
        (id) => !existsCastMemberIds.some((e) => e.equals(id))
      );
      return [existsCastMemberIds, notExistsCastMemberIds];
    }

    async update(entity: CastMember): Promise<void> {
      await this._get(entity.id);
      await this.castMemberModel.update(entity.toJSON(), {
        where: { id: entity.id },
        transaction: this.unitOfWork?.getTransaction(),
      });
    }
    async delete(id: string | CastMemberId): Promise<void> {
      const _id = `${id}`;
      await this._get(_id);
      this.castMemberModel.destroy({
        where: { id: _id },
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    private async _get(id: string): Promise<CastMemberModel> {
      return this.castMemberModel.findByPk(id, {
        rejectOnEmpty: new NotFoundError(id, CastMember),
        transaction: this.unitOfWork?.getTransaction(),
      });
    }

    async search(
      props: CastMemberRepositoryContract.SearchParams
    ): Promise<CastMemberRepositoryContract.SearchResult> {
      const offset = (props.page - 1) * props.per_page;
      const limit = props.per_page;

      const where = {};

      if (props.filter && (props.filter.name || props.filter.type)) {
        where[Op.or] = [];

        if (props.filter.name) {
          where[Op.or].push({
            name: { [Op.like]: `%${props.filter.name}%` },
          });
        }

        if (props.filter.type) {
          where[Op.or].push({
            type: props.filter.type.value,
          });
        }
      }

      const { rows: models, count } =
        await this.castMemberModel.findAndCountAll({
          where,
          ...(props.sort && this.sortableFields.includes(props.sort)
            ? { order: this.formatSort(props.sort, props.sort_dir) }
            : { order: [["created_at", "DESC"]] }),
          offset,
          limit,
          transaction: this.unitOfWork?.getTransaction(),
        });
      return new CastMemberRepositoryContract.SearchResult({
        items: models.map((m) => CastMemberModelMapper.toEntity(m)),
        current_page: props.page,
        per_page: props.per_page,
        total: count,
        filter: props.filter,
        sort: props.sort,
        sort_dir: props.sort_dir,
      });
    }

    private formatSort(sort: string, sort_dir: SortDirection) {
      const dialect = this.castMemberModel.sequelize.getDialect();
      if (this.orderBy[dialect] && this.orderBy[dialect][sort]) {
        return this.orderBy[dialect][sort](sort_dir);
      }
      return [[sort, sort_dir]];
    }

    setUnitOfWork(unitOfWork: UnitOfWorkSequelize): void {
      this.unitOfWork = unitOfWork;
    }
  }

  export class CastMemberModelMapper {
    static toEntity(model: CastMemberModel) {
      const { id, ...otherData } = model.toJSON();
      const [type, errorCastMemberType] = CastMemberType.create(
        otherData.type
      ).asArray();
      try {
        return new CastMember(
          {
            ...otherData,
            type,
          },
          new CastMemberId(id)
        );
      } catch (e) {
        if (e instanceof EntityValidationError) {
          e.setFromError("type", errorCastMemberType);
          throw new LoadEntityError(e.error);
        }

        throw e;
      }
    }
  }
}
