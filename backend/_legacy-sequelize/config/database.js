import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const {
  DATABASE_URL,
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_NAME = "voucher_db",
  DB_USER = "root",
  DB_PASS = "",
  DB_DIALECT = "mysql",
  DB_SSL = "false",
  NODE_ENV = "development",
} = process.env;

const logging = NODE_ENV === "development" ? console.log : false;
const dialectOptions =
  DB_SSL === "true"
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {};

function createSequelizeInstance() {
  if (!DATABASE_URL) {
    return new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      port: Number(DB_PORT),
      dialect: DB_DIALECT,
      dialectOptions,
      logging,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  }

  const connectionUrl = new URL(DATABASE_URL);

  return new Sequelize(
    connectionUrl.pathname.replace("/", ""),
    decodeURIComponent(connectionUrl.username),
    decodeURIComponent(connectionUrl.password),
    {
      host: connectionUrl.hostname,
      port: Number(connectionUrl.port || DB_PORT),
      dialect: DB_DIALECT,
      dialectOptions,
      logging,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    },
  );
}

const sequelize = createSequelizeInstance();

export default sequelize;
