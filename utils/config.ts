import "dotenv/config";
import { Config } from "../interfaces/Config";

let config: Config;

try {
  config = require("../config.json");
} catch (error) {
  config = {
    TOKEN: process.env.TOKEN || "",
    DB_USER: process.env.DB_USER||"",
    DB_PASS: process.env.DB_PASSWORD||"",
    DB_NAME: process.env.DB_NAME||"",
    DB_HOST: process.env.DB_HOST || "",
    DB_PORT: process.env.DB_PORT || "",
    PREFIX: process.env.PREFIX || "!",
    LOCALE: process.env.LOCALE || "en",
  };
}

export { config };