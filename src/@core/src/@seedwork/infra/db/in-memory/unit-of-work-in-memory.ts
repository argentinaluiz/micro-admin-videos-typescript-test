import { RepositoryInterface } from "../../../domain";
import { UnitOfWorkInterface } from "../../../domain/persistence/unit-of-work-interface";

export class UnitOfWorkInMemory implements UnitOfWorkInterface {
  constructor(
    private context: { get: (repoName) => Promise<RepositoryInterface<any, any>> }
  ) {}

  start(): Promise<void> {
    return;
  }
  commit(): Promise<void> {
    return;
  }
  rollback(): Promise<void> {
    return;
  }
  do<T>(workFn: (uow: UnitOfWorkInterface) => Promise<T>): Promise<T> {
    return workFn(this);
  }
  getRepository<T extends any>(repoName: any): Promise<T> {
    return this.context.get(repoName) as any;
  }
  getTransaction() {
    return;
  }
}
