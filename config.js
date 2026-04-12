/**
 * Database Configuration
 * 
 * Update these values to match your MySQL setup
 * Default XAMPP credentials are shown below
 */

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',        // MySQL server host
    user: process.env.DB_USER || 'root',             // MySQL username (default XAMPP: root)
    password: process.env.DB_PASS || '',             // MySQL password (default XAMPP: empty)
    database: process.env.DB_NAME || 'postoffice',   // Database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

/**
 * Email Configuration (supports environment variables)
 *
 * Recommended: set the following environment variables instead of editing this file:
 * - EMAIL_ENABLED = true
 * - EMAIL_SERVICE = gmail
 * - EMAIL_FROM = your-email@gmail.com
 * - EMAIL_USER = your-email@gmail.com
 * - EMAIL_PASS = <16-char-gmail-app-password>
 *
 * Example (PowerShell):
 * $env:EMAIL_ENABLED = 'true'
 * $env:EMAIL_USER = 'postoffice.system@gmail.com'
 * $env:EMAIL_PASS = 'your16charapppassword'
 */
const emailConfig = {
    enabled: (process.env.EMAIL_ENABLED === 'true') || true,  // Enabled by default
    service: process.env.EMAIL_SERVICE || 'gmail',
    from: process.env.EMAIL_FROM || 'onionknight418@gmail.com',
    user: process.env.EMAIL_USER || 'onionknight418@gmail.com',
    pass: process.env.EMAIL_PASS || 'zhvuxsdt mrddkwtq'
};

module.exports = { dbConfig, emailConfig };
