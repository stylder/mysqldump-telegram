const mysqldump = require("mysqldump");
const log4js = require("log4js");
const moment = require("moment");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

const filename = moment().format("YYYY-MM-DD-HH_mm_ss");

const crearRespaldo = async () => {
  try {
    const result = await mysqldump({
      connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      },
      dumpToFile: `./backups/${filename}.sql`,
    });

    const mensaje = `
<b>Saludos 👋 sólo paso a informarte que realicé un respaldo</b>:
<b>${filename}</b>          
`;
    console.log(result);
    enviarNotificacion(mensaje);
  } catch (error) {
    console.error(error);
  }
};

const enviarNotificacion = (text) => {
  const url = process.env.TELEGRAM_URL;
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_ID_CHAT;

  axios
    .post(`${url}${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    })
};

const crearLogger = async () => {
  log4js.configure({
    appenders: {
      cheese: { type: "file", filename: `./logs/${filename}.log` },
    },
    categories: {
      default: { appenders: ["cheese"], level: "info" },
    },
  });
};

const init = () => {
    const mensaje = `
<b>Iniciando un respaldo...</b>:
<b>${filename}</b>          
`;
    crearLogger();
    enviarNotificacion(mensaje)
    crearRespaldo();
}

init();

