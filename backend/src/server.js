const env = require('./config/env');
const connectDb = require('./config/db');
const app = require('./app');

async function start() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Helpdesk API listening on port ${env.PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
