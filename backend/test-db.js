require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing database connection...');
console.log('Config:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: '***hidden***',
    port: process.env.DB_PORT
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    } else {
        console.log('✅ Database connected successfully!');
        release();
        
        // Test a simple query
        pool.query('SELECT NOW()', (err, result) => {
            if (err) {
                console.error('❌ Query error:', err);
            } else {
                console.log('✅ Query successful:', result.rows[0]);
            }
            pool.end();
        });
    }
});