const mongoose = require('mongoose');
const env = require('./env');

let connectionPromise;

async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    mongoose.set('strictQuery', true);
    connectionPromise = mongoose.connect(env.DB_URI)
      .then(() => {
        console.log('MongoDB connected');
      })
      .finally(() => {
        connectionPromise = null;
      });
  }

  await connectionPromise;
}

module.exports = connectDb;
