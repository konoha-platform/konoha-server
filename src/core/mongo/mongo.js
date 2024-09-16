const mongoose = require('mongoose');

const { uri: mongoUri } = require('./mongo.config.js');
const { logger } = require('../logger/logger.js');

const mongoOptions = {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectMongoDB = async () => {
  await new Promise((resolve, reject) => {
    mongoose.connect(mongoUri, mongoOptions, (err) => {
      if (err) {
        logger.error(
          JSON.stringify({
            msg: err.message,
            status: err.status,
          })
        );
        resolve(err);
      }
      logger.info(
        JSON.stringify({
          msg: `Mongo database connected!`,
        })
      );
      resolve();
    });
  })
};

module.exports = { connectMongoDB };
