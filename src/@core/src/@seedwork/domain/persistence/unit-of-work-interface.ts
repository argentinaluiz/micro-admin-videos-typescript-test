import { RepositoryInterface } from ".";

export interface UnitOfWorkInterface {
    start(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    do<T>(workFn: (uow: UnitOfWorkInterface) => Promise<T>): Promise<T>;
    getRepository<T extends RepositoryInterface<any, any>>(repoName: any): Promise<T>;
    getTransaction(): any;
}