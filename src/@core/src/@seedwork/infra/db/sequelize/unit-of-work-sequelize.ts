import { RepositoryInterface } from "../../../domain/persistence/repository-contracts";
import { Sequelize } from "sequelize-typescript";
import { UnitOfWorkInterface } from "./../../../domain/persistence/unit-of-work-interface";
import { Transaction } from "sequelize/types";

export class UnitOfWorkSequelize implements UnitOfWorkInterface {
  private transaction: Transaction;

  constructor(
    private context: { get: (name: string) => Promise<any> },
    private sequelize: Sequelize
  ) {}

  async start(): Promise<void> {
    if (!this.transaction) {
      this.transaction = await this.sequelize.transaction();
    }
  }

  async commit(): Promise<void> {
    this.validateTransaction();
    await this.transaction.commit();
    this.transaction = null;
  }

  async rollback(): Promise<void> {
    this.validateTransaction();
    await this.transaction.rollback();
    this.transaction = null;
  }

  async do<T>(workFn: (uow: UnitOfWorkInterface) => Promise<T>): Promise<T> {
    try {
      if (this.transaction) {
        const result = await workFn(this);
        this.transaction = null;
        return result;
      }

      const result = await this.sequelize.transaction(async (t) => {
        this.transaction = t;
        return await workFn(this);
      });
      this.transaction = null;
      return result;
    } catch (e) {
      this.transaction = null;
      throw e;
    }
  }

  async getRepository<T extends RepositoryInterface<any, any>>(repoName: any): Promise<T> {
    this.validateTransaction();

    const repo = await this.context.get(repoName);
    if (!repo) {
      throw new Error(`Repository ${repoName} not found`);
    }
    repo.setUnitOfWork(this);
    return repo;
  }

  getTransaction() {
    return this.transaction;
  }

  private validateTransaction() {
    if (!this.transaction) {
      throw new Error("No transaction started");
    }
  }
}
