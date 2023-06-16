import { DynamicModule, Global, Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule, getConnectionToken } from '@nestjs/sequelize';
import { CONFIG_SCHEMA_TYPE } from '../config/config.module';
import { CategorySequelize } from '@fc/micro-videos/category/infra';
import { CastMemberSequelize } from '@fc/micro-videos/cast-member/infra';
import { UnitOfWorkSequelize } from '@fc/micro-videos/@seedwork/infra';
import { Sequelize, ModelCtor } from 'sequelize-typescript';
import { ModuleRef } from '@nestjs/core';
import { GenreSequelize } from '@fc/micro-videos/genre/infra';
import models from './models';
import repositoriesMap from './repositories-map';
import { RepositoryContainer } from './repository-container';

// @Global()
// @Module({
//   imports: [
//     SequelizeModule.forRootAsync({
//       useFactory: async (config: ConfigService<CONFIG_SCHEMA_TYPE>) => {
//         if (config.get('DB_VENDOR') === 'sqlite') {
//           return {
//             dialect: 'sqlite',
//             host: config.get('DB_HOST'),
//             models,
//             autoLoadModels: config.get('DB_AUTO_LOAD_MODELS'),
//             logging: config.get('DB_LOGGING'),
//           };
//         }

//         if (config.get('DB_VENDOR') === 'mysql') {
//           return {
//             dialect: 'mysql',
//             host: config.get('DB_HOST'),
//             database: config.get('DB_DATABASE'),
//             username: config.get('DB_USERNAME'),
//             password: config.get('DB_PASSWORD'),
//             port: config.get('DB_PORT'),
//             models,
//             autoLoadModels: config.get('DB_AUTO_LOAD_MODELS'),
//             logging: config.get('DB_LOGGING'),
//           };
//         }

//         throw new Error('Unsupported database config');
//       },
//       inject: [ConfigService],
//     }),
//   ],
//   providers: [
//     {
//       provide: UnitOfWorkSequelize,
//       useFactory: (moduleRef: ModuleRef, sequelize: Sequelize) => {
//         return new UnitOfWorkSequelize(moduleRef, sequelize);
//       },
//       inject: [ModuleRef, getConnectionToken()],
//       scope: Scope.REQUEST,
//     },
//     {
//       provide: 'UnitOfWork',
//       useExisting: UnitOfWorkSequelize,
//     },
//   ],
//   exports: ['UnitOfWork'],
// })

type ModuleClass = any;
type RepositoryToken = any;

type RepositoriesMap = Map<ModuleClass, RepositoryToken>;

type DatabaseModuleOptions = {
  models?: ModelCtor[];
  repositoriesMap?: RepositoriesMap;
};

export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        SequelizeModule.forRootAsync({
          useFactory: async (config: ConfigService<CONFIG_SCHEMA_TYPE>) => {
            if (config.get('DB_VENDOR') === 'sqlite') {
              return {
                dialect: 'sqlite',
                host: config.get('DB_HOST'),
                models: options.models || models,
                autoLoadModels: config.get('DB_AUTO_LOAD_MODELS'),
                logging: config.get('DB_LOGGING'),
              };
            }

            if (config.get('DB_VENDOR') === 'mysql') {
              return {
                dialect: 'mysql',
                host: config.get('DB_HOST'),
                database: config.get('DB_DATABASE'),
                username: config.get('DB_USERNAME'),
                password: config.get('DB_PASSWORD'),
                port: config.get('DB_PORT'),
                models: options.models || models,
                autoLoadModels: config.get('DB_AUTO_LOAD_MODELS'),
                logging: config.get('DB_LOGGING'),
              };
            }

            throw new Error('Unsupported database config');
          },
          inject: [ConfigService],
        }),
      ],
      providers: [
        {
          provide: 'RepositoriesMap',
          useValue: options.repositoriesMap || repositoriesMap,
        },
        RepositoryContainer,
        {
          provide: UnitOfWorkSequelize,
          useFactory: (
            repoContainer: RepositoryContainer,
            sequelize: Sequelize,
          ) => {
            return new UnitOfWorkSequelize(repoContainer, sequelize);
          },
          inject: [RepositoryContainer, getConnectionToken()],
          scope: Scope.REQUEST,
        },
        {
          provide: 'UnitOfWork',
          useExisting: UnitOfWorkSequelize,
        },
      ],
      exports: ['UnitOfWork'],
      global: true,
    };
  }
}
