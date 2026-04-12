const mysql = require('mysql2/promise');
const { dbConfig } = require('./config');

async function resetDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
        });

        console.log('Connected to database for reset');

        // Disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Drop tables in reverse order due to foreign keys
        const tables = ['notifications', 'joborders', 'staff', 'auditLog', 'tickets', 'services', 'users'];

        for (const table of tables) {
            try {
                await connection.execute(`DROP TABLE IF EXISTS ${table}`);
                console.log(`Dropped table: ${table}`);
            } catch (e) {
                console.log(`Could not drop ${table}:`, e.message);
            }
        }

        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        await connection.end();
        console.log('Database reset complete');
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();