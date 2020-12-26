const fs = require("fs");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  secretAccessKey: process.env.AWS_S3_SECRET_KEY,
});

const bucket = process.env.AWS_S3_BUCKET;

const uploadFile = async (fileName) => {

  try {
    const data = await fs.readFileSync(fileName);
    const base64data = Buffer.from(data, "binary");

    const params = {
      Bucket: bucket,
      Key: fileName,
      Body: base64data,
    };

    s3.upload(params, (s3Err, data) => {
      if (s3Err) {
        throw s3Err;
      } else {
        console.log(`File uploaded successfully at ${data.Location}`);
        fs.unlinkSync(fileName);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

const downloadFile = async (fileName) => {
  const params = {
    Bucket: bucket,
    Key: fileName,
  };

  let file = fs.createWriteStream(fileName);
  s3.getObject(params).createReadStream().pipe(file);
};

const fileName = "backups/2020-12-24-02_02_09.sql";

uploadFile(fileName);
//downloadFile(fileName);
