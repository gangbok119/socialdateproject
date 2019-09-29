const path = require('path');
require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_ID,
    password: process.env.DB_PASSWORD,
    database: "sda",
    host: process.env.DB_HOST,
    dialect: "mysql",
  },
  test: {
    username: process.env.DB_ID,
    password: process.env.DB_PASSWORD,
    database: "sda",
    host: process.env.DB_HOST,
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_ID,
    password: process.env.DB_PASSWORD,
    database: 'sda',
    host: process.env.DB_HOST,
    dialect: 'mysql',
  },
};
