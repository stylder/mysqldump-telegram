const dotenv = require("dotenv");
const AWS = require("aws-sdk");
const fs = require("fs");
dotenv.config();



const downloadFile = async (filePath, fileName) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
  };

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  });

  let file = fs.createWriteStream(filePath);
  s3.getObject(params).createReadStream().pipe(file);
};

const fileName = "2020-12-27-21_23_28.sql";

downloadFile(`${process.env.DIR_BACKUP}${fileName}`,fileName);
