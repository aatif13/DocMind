const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDb() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('DATABASE_URL starts with:', dbUrl ? dbUrl.substring(0, 20) : 'undefined');
  
  const isLocal = dbUrl?.includes("localhost") || dbUrl?.includes("127.0.0.1");
  console.log('Is Local:', isLocal);

  const poolOptions = {
    connectionString: dbUrl,
  };
  
  if (!isLocal) {
    poolOptions.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolOptions);

  try {
    console.log('Attempting to connect to database...');
    const res = await pool.query('SELECT current_database(), current_user');
    console.log('Connected to:', res.rows[0]);

    console.log('Checking for tables...');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Existing tables:', tables);

    const requiredTables = ['users', 'accounts', 'sessions', 'documents', 'chunks', 'messages'];
    const missing = requiredTables.filter(t => !tables.includes(t));

    if (missing.length > 0) {
      console.log('Missing tables:', missing);
      console.log('Please run the schema.sql file in your database.');
    } else {
      console.log('All required tables found.');
    }

  } catch (err) {
    console.error('Database connection error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDb();
