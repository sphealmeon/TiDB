const mysql = require('mysql2/promise');
import fs from 'fs';
import { config } from "../utils/config";

module.exports = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASS,
    database: config.DB_NAME,
    ssl: {
        ca: fs.readFileSync('./cacert.pem')
    }
})