const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.BUCKET_NAME;

const uploadToS3 = async (buffer, key, mimetype) => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    })
  );
  return `https://${bucketName}.s3.ap-south-1.amazonaws.com/${key}`;
};

const deleteFromS3 = async (key) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
};

module.exports = { uploadToS3, deleteFromS3 };
