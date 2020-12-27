const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const mysqldump = require("mysqldump");
const moment = require("moment");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
const fs = require("fs");
dotenv.config();


const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\>/, function onLoveText(msg) {
  const command = msg.text.replace(">", "");
  exec(command, (_, stdout) => {
    const opts = {
      reply_to_message_id: msg.message_id,
    };
    bot.sendMessage(msg.chat.id, stdout, opts);
  });
});

// Matches /love
bot.onText(/\/backup/, async (msg) => {
  const opts = {
    reply_to_message_id: msg.message_id,
  };
  bot.sendMessage(msg.chat.id, "Empezando a realizar respaldo...", opts);

  try {
    const fileName = getFileName();
    const pathFile = `${process.env.DIR_BACKUP}${fileName}`;
    await dumpDatabase(pathFile);
    const s3File = await uploadFileS3(pathFile, fileName);
    const size = await getSizeBackup(pathFile);
    await deleteLocalBackup(pathFile);
    const mensaje = `
Saludos 👋 sólo paso a informarte que realice un backup:
GB: ${size}
URL: ${s3File}
    `;
    bot.sendMessage(msg.chat.id, mensaje, opts);
  } catch (error) {
    bot.sendMessage(msg.chat.id, error, opts);
  }
});

const getFileName = () => {
  const filename = moment().format("YYYY-MM-DD-HH_mm_ss");
  const ext = ".sql";
  return `${filename}${ext}`;
};

const getSizeBackup = async (file) => {
  const stats = fs.statSync(file);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes / (1024 * 1024 * 1024);
};

const deleteLocalBackup = async (pathFile) => {
  return await fs.unlinkSync(pathFile);
};

const dumpDatabase = async (pathFile) => {
  try {
    const result = await mysqldump({
      connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      },
      dumpToFile: pathFile,
    });
  } catch (error) {
    return error;
  }
};

const uploadFileS3 = async (pathFile, fileName) => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  });

  try {
    
    const readStream = fs.createReadStream(pathFile);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body:readStream
    };
    
    const options = { partSize: 5 * 1024 * 1024, queueSize: 10 };  
    const { Location } = await s3.upload(params, options).promise();
    return Location;
    
  } catch (error) {
    console.error(error);
  }
};
