const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tournament_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    const migrationFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

