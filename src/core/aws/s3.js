const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

const bucket = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_BUCKET_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_BUCKET_SECRET_ACCESS_KEY;
const presignedLinkLifeTime = process.env.PRESIGNED_LINK_LIFETIME;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const uploadToS3 = multer({
  storage: multerS3({
    s3,
    bucket,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `user-${req.user._id}/${file.fieldname}-${Date.now()}.png`);
    },
  }),
});

const getPresignedUrl = async (key) => {
  if (!key) return '';

  const command = new GetObjectCommand({
    Key: key,
    Bucket: bucket,
  });
  return getSignedUrl(s3, command, { expiresIn: presignedLinkLifeTime });
};

module.exports = {
  uploadToS3,
  getPresignedUrl,
};
