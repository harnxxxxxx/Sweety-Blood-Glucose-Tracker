import 'dotenv/config';
import { app } from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT || 4000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters.');
  process.exit(1);
}

const server = app.listen(port, () => {
  console.log(`Sweety API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
