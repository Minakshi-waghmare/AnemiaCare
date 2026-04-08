const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function setup() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const queries = schema.split(';').filter(q => q.trim() !== '');
    
    for (const query of queries) {
      await db.execute(query);
    }
    
    console.log('Database schema successfully initialized!');
    process.exit(0);
  } catch (err) {
    console.error('Initialization error:', err);
    process.exit(1);
  }
}

setup();
