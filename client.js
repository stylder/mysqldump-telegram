const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
const fs = require("fs");
dotenv.config();

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Received your message");
});

const downloadFile = async (filePath, fileName) => {
  const params = {
    Bucket: bucket,
    Key: fileName,
  };

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  });

  const bucket = process.env.AWS_S3_BUCKET;

  let file = fs.createWriteStream(filePath);
  s3.getObject(params).createReadStream().pipe(file);
};

const fileName = "backups/2020-12-24-02_02_09.sql";

//uploadFile(fileName);
//downloadFile(fileName);
