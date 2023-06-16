import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import { Config } from "../../config";

//import { Config } from "sequelize/types";

export function setupSequelize(options: SequelizeOptions = {}) {
  let _sequelize: Sequelize;

  beforeAll(
    () =>
      (_sequelize = new Sequelize({
        ...Config.db() as SequelizeOptions,
        ...options,
      }))
  );

  beforeEach(async () => {
    await _sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await _sequelize.close();
  });

  return {
    get sequelize() {
      return _sequelize;
    },
  };
}

// function makeSequelizeOptions(config: Config){

// }
