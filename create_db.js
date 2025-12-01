const { Client } = require('pg');
require('dotenv').config();

const user = process.env.DB_USER || 'postgres';
const host = process.env.DB_HOST || 'localhost';
const password = process.env.DB_PASS || 'Diona188';
const port = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME || 'absensi';

async function ensureDb(){
  const client = new Client({ user, host, password, port, database: 'postgres' });
  try{
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [dbName]);
    if (res.rowCount === 0){
      console.log('Database not found. Creating', dbName);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('Database created');
    } else {
      console.log('Database already exists:', dbName);
    }
  }catch(err){
    console.error('Error creating database', err.message);
    process.exit(1);
  }finally{
    await client.end();
  }
}

ensureDb();
