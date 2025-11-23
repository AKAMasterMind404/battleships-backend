import mongoose from 'mongoose';
import config from '../config';

export default async (): Promise<any> => {
  const connection = await mongoose.connect(config.databaseURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    // ssl: true,
    // sslValidate: true,
    // sslCA: require('fs').readFileSync(`${__dirname}/mongocerts.crt`)
  });
 
  return connection.connection.db;
};
