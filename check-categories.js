const mysql = require('mysql2/promise');
const { dbConfig } = require('./config');

(async () => {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT DISTINCT category FROM tickets WHERE category IS NOT NULL AND category != "" ORDER BY category');
    console.log('Unique Ticket Categories in Database:');
    rows.forEach(r => console.log('  -', r.category));
    await conn.end();
})();
