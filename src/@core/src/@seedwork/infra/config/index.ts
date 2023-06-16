import { config as readEnv } from "dotenv";
import { join } from "path";

export class Config {
  static env: any = {};
   static db() {
     Config.readEnv();

       return {
         dialect: 'sqlite',
         host: Config.env.DB_HOST,
         logging: Config.env.DB_LOGGING === 'true',
       };
   }

   static readEnv() {
     Config.env = readEnv({
       path: join(__dirname, "../../../../.env.test"),
     }).parsed;
   }
 }