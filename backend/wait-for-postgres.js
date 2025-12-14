const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/tournament_db',
  ssl: false,
});

async function waitForPostgres() {
  const maxRetries = 30;
  const retryDelay = 2000; // 2 secondes

  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ PostgreSQL est prêt !');
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.log(`⏳ Attente de PostgreSQL... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  console.error('❌ PostgreSQL n\'est pas disponible après plusieurs tentatives');
  await pool.end();
  process.exit(1);
}

waitForPostgres();

