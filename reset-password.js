const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dbConfig = require('./config');

async function resetPassword() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // New password for admin@example.com
        const email = 'admin@example.com';
        const newPassword = 'Password123!';
        const hashed = await bcrypt.hash(newPassword, 10);
        
        await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashed, email]
        );
        
        console.log(`✓ Password reset for ${email}`);
        console.log(`✓ New password: ${newPassword}`);
        
        await connection.end();
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();
