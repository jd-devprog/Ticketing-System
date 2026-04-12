const mysql = require('mysql2/promise');
const { dbConfig } = require('./config');

async function resetVerification() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
        });

        console.log('Connected to database');

        // Mark admin as unverified for testing
        await connection.execute(
            'UPDATE users SET isVerified = 0 WHERE email = ?',
            ['admin@example.com']
        );

        console.log('✓ Admin user marked as unverified');

        // Show verification status
        const [rows] = await connection.execute(
            'SELECT id, email, isVerified FROM users'
        );

        console.log('\nCurrent users:');
        console.table(rows);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetVerification();
