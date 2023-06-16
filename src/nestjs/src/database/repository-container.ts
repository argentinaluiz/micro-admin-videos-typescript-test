import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

type ModuleClass = string;
type RepositoryToken = any;

type RepositoriesMap = Map<RepositoryToken, ModuleClass>;
type ModulesRefMap = Map<RepositoryToken, ModuleRef>;

@Injectable()
export class RepositoryContainer {
  private _modulesRefMap: ModulesRefMap = new Map();

  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject('RepositoriesMap')
    private readonly repositoriesMap: RepositoriesMap,
  ) {}

  get moduleRefMap(): ModulesRefMap {
    if (!this._modulesRefMap.size) {
      this.repositoriesMap.forEach((moduleClass, repoToken) => {
        this.moduleRef['container'].getModules().forEach((module) => {
          if (module.metatype.name === moduleClass) {
            this._modulesRefMap.set(
              repoToken,
              module.providers.get(ModuleRef).instance as ModuleRef,
            );
          }
        });
      });
    }

    return this._modulesRefMap;
  }

  async get(repositoryToken: RepositoryToken) {
    return this.moduleRefMap.get(repositoryToken).resolve(repositoryToken);
  }
}
