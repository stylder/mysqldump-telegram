const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const mysqldump = require("mysqldump");
const moment = require("moment");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
const fs = require("fs");

dotenv.config();
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_TOKEN;
const dir = process.env.DIR_BACKUP;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

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
    const pathFile = `${dir}${fileName}`;
    await dumpDatabase(fileName);
    const s3File = await uploadFileS3(fileName);
    const size = await getSizeBackup(pathFile);
    const hola =  await deleteLocalBackup(pathFile);
    const mensaje = `
Saludos 👋 sólo paso a informarte que realice un backup:
GB: ${size}
URL: ${s3File}
    `
    bot.sendMessage(msg.chat.id, mensaje, opts);
  } catch (error) {
    bot.sendMessage(msg.chat.id, error, opts);
  }
});

const getFileName = () => {
  const filename = moment().format("YYYY-MM-DD-HH_mm_ss");
  const ext = ".sql";
  const dumpFile = `${filename}${ext}`;

  return dumpFile;
};


const getSizeBackup = async (file) => {
  const stats = fs.statSync(file);
  const fileSizeInBytes = stats.size;
  // Convert the file size to megabytes (optional)
  return fileSizeInBytes / (1024 * 1024* 1024);
};

const deleteLocalBackup= async(pathFile) =>{
    return await fs.unlinkSync(pathFile);
}

const dumpDatabase = async (dumpFile) => {
  try {
    const result = await mysqldump({
      connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      },
      dumpToFile: `${dir}${dumpFile}`,
    });
  } catch (error) {
    return error;
  }
};

const uploadFileS3 = async (fileName) => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  });

  const bucket = process.env.AWS_S3_BUCKET;
  const pathFile = `${dir}${fileName}`;
  try {
    const data = await fs.readFileSync(pathFile);
    const base64data = Buffer.from(data, "binary");

    const params = {
      Bucket: bucket,
      Key: fileName,
      Body: base64data,
    };
    const { Location } = await s3.upload(params).promise();
    return Location;
  } catch (error) {
    console.error(error);
  }
};
