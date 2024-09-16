const {
  MONGO_HOST: host,
  MONGO_PORT: port,
  MONGO_DATABASE: database,
  MONGO_USER: user,
  MONGO_PASSWORD: password
} = process.env;

const uri = `mongodb://${host}:${port}/${database}`;
// const uri = `mongodb+srv://${user}:${password}@cluster0.t21swir.mongodb.net/konoha`

const mongoConfig = {
  host,
  port,
  database,
  uri,
};
//lS1de5UnF6buM7hd
module.exports = mongoConfig;
