const mysqldump = require("mysqldump");
const moment = require("moment");
const dotenv = require("dotenv");
dotenv.config();

function crearRespaldo (){

  const filename = moment().format("YYYY-MM-DD-HH_mm_ss");
  const dir =  process.env.DIR_BACKUP;
  const ext = '.sql';

  try {
    const result = await mysqldump({
      connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      },
      dumpToFile: `${dir}${filename}${ext}`,
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
};

function init (){
    crearRespaldo();
}


export {init, crearRespaldo};