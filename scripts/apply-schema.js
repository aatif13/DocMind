const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runSchema() {
  const isLocal = process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    const schema = fs.readFileSync('schema.sql', 'utf8');
    console.log('Applying schema.sql...');
    // Split schema into separate statements if necessary, or just run whole thing
    // pg's query() can handle multiple statements if they are semicolon-separated
    await pool.query(schema);
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Error applying schema:', err.message);
  } finally {
    await pool.end();
  }
}

runSchema();
