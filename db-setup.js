const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { dbConfig } = require('./config');

async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
        });

        console.log('Connected to MySQL database');

        // Create tables
        await createTables(connection);

        // Ensure columns that may be missing from older schemas
        await ensureColumns(connection);
        
        // Seed default users if table empty
        try {
            const [userCountRows] = await connection.execute('SELECT COUNT(*) AS count FROM users');
            if (userCountRows && userCountRows[0] && userCountRows[0].count === 0) {
                // Seed super_admin
                const superAdminEmail = 'admin@example.com';
                const superAdminPassword = 'Password123!';
                const superAdminHashed = bcrypt.hashSync(superAdminPassword, 10);
                await connection.execute(
                    'INSERT INTO users (email, password, displayName, role) VALUES (?, ?, ?, ?)'
                    , [superAdminEmail, superAdminHashed, 'Super Administrator', 'super_admin']
                );
                console.log('Inserted default super_admin user:', superAdminEmail, '(password:', superAdminPassword + ')');
                
                // Seed restricted admin
                const adminEmail = 'restricted@example.com';
                const adminPassword = 'Password123!';
                const adminHashed = bcrypt.hashSync(adminPassword, 10);
                await connection.execute(
                    'INSERT INTO users (email, password, displayName, role) VALUES (?, ?, ?, ?)'
                    , [adminEmail, adminHashed, 'Restricted Admin', 'admin']
                );
                console.log('Inserted default admin user:', adminEmail, '(password:', adminPassword + ')');
            }
        } catch (seedErr) {
            console.error('Error seeding default users:', seedErr);
        }

        // Insert sample data
        await insertSampleData(connection);

        await connection.end();
        console.log('Database initialization complete!');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

async function ensureColumns(connection) {
    try {
        // Ensure `displayName` exists in users table
        const [cols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'displayName'`,
            [dbConfig.database]
        );

        if (cols[0] && cols[0].cnt === 0) {
            await connection.execute(`ALTER TABLE users ADD COLUMN displayName VARCHAR(255)`);
            console.log('Added missing column `displayName` to users table');
        }

        // Ensure `isVerified` exists in users table
        const [verifyCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'isVerified'`,
            [dbConfig.database]
        );

        if (verifyCols[0] && verifyCols[0].cnt === 0) {
            await connection.execute(`ALTER TABLE users ADD COLUMN isVerified BOOLEAN DEFAULT 0`);
            console.log('Added missing column `isVerified` to users table');
        }

        // Ensure `ticker` exists in tickets table (ticker belongs on tickets, not services)
        const [tickerCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'ticker'`,
            [dbConfig.database]
        );

        if (tickerCols[0] && tickerCols[0].cnt === 0) {
            await connection.execute(`ALTER TABLE tickets ADD COLUMN ticker VARCHAR(255)`);
            console.log('Added missing column `ticker` to tickets table');
        }
        // Ensure `description` exists in tickets table (used by ticket creation)
        const [descCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'description'`,
            [dbConfig.database]
        );

        if (descCols[0] && descCols[0].cnt === 0) {
            await connection.execute(`ALTER TABLE tickets ADD COLUMN description TEXT`);
            console.log('Added missing column `description` to tickets table');
        }
        // Ensure `category` exists so we can store main/sub separately
        const [catCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'category'`,
            [dbConfig.database]
        );
        if (catCols[0] && catCols[0].cnt === 0) {
            await connection.execute(`ALTER TABLE tickets ADD COLUMN category VARCHAR(255)`);
            console.log('Added missing column `category` to tickets table');
        }
        // Ensure `accepted_by`, `accepted_at`, `completed_at` exist for ticket workflow (with legacy handling for camelCase to snake_case migration)
        const [accByCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'accepted_by'`,
            [dbConfig.database]
        );
        const [accByLegacyCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'acceptedBy'`,
            [dbConfig.database]
        );

        if (accByCols[0] && accByCols[0].cnt === 0) {
            if (accByLegacyCols[0] && accByLegacyCols[0].cnt > 0) {
                try {
                    await connection.execute(`ALTER TABLE tickets CHANGE COLUMN acceptedBy accepted_by VARCHAR(255) NULL`);
                    console.log('Renamed column `acceptedBy` to `accepted_by`');
                } catch (e) { console.warn('Could not rename tickets.acceptedBy to accepted_by:', e && e.message); }
            } else {
                try {
                    await connection.execute(`ALTER TABLE tickets ADD COLUMN accepted_by VARCHAR(255) NULL`);
                    console.log('Added missing column `accepted_by` to tickets table');
                } catch (e) { console.warn('Could not add tickets.accepted_by:', e && e.message); }
            }
        } else if (accByCols[0] && accByCols[0].cnt > 0) {
            try {
                const [colInfo] = await connection.execute('SHOW COLUMNS FROM tickets WHERE Field = "accepted_by"');
                if (colInfo && colInfo[0] && colInfo[0].Type && !colInfo[0].Type.includes('VARCHAR')) {
                    await connection.execute(`ALTER TABLE tickets MODIFY COLUMN accepted_by VARCHAR(255) NULL`);
                    console.log('Converted `accepted_by` column to VARCHAR(255) to store staff names');
                }
            } catch (e) { console.warn('Could not modify tickets.accepted_by:', e && e.message); }
        }

        const [accAtCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'accepted_at'`,
            [dbConfig.database]
        );
        const [accAtLegacyCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'acceptedAt'`,
            [dbConfig.database]
        );

        if (accAtCols[0] && accAtCols[0].cnt === 0) {
            if (accAtLegacyCols[0] && accAtLegacyCols[0].cnt > 0) {
                try {
                    await connection.execute(`ALTER TABLE tickets CHANGE COLUMN acceptedAt accepted_at TIMESTAMP NULL`);
                    console.log('Renamed column `acceptedAt` to `accepted_at`');
                } catch (e) { console.warn('Could not rename tickets.acceptedAt to accepted_at:', e && e.message); }
            } else {
                try {
                    await connection.execute(`ALTER TABLE tickets ADD COLUMN accepted_at TIMESTAMP NULL`);
                    console.log('Added missing column `accepted_at` to tickets table');
                } catch (e) { console.warn('Could not add tickets.accepted_at:', e && e.message); }
            }
        }

        const [compAtCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'completed_at'`,
            [dbConfig.database]
        );
        const [compAtLegacyCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'completedAt'`,
            [dbConfig.database]
        );

        if (compAtCols[0] && compAtCols[0].cnt === 0) {
            if (compAtLegacyCols[0] && compAtLegacyCols[0].cnt > 0) {
                try {
                    await connection.execute(`ALTER TABLE tickets CHANGE COLUMN completedAt completed_at TIMESTAMP NULL`);
                    console.log('Renamed column `completedAt` to `completed_at`');
                } catch (e) { console.warn('Could not rename tickets.completedAt to completed_at:', e && e.message); }
            } else {
                try {
                    await connection.execute(`ALTER TABLE tickets ADD COLUMN completed_at TIMESTAMP NULL`);
                    console.log('Added missing column `completed_at` to tickets table');
                } catch (e) { console.warn('Could not add tickets.completed_at:', e && e.message); }
            }
        }
        // Ensure `email` column exists in tickets table (for ticket submitter email)
        const [emailCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'email'`,
            [dbConfig.database]
        );
        // Ensure ipAddress column exists in auditLog
        const [auditIpCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'auditLog' AND COLUMN_NAME = 'ipAddress'`,
            [dbConfig.database]
        );
        if (auditIpCols[0] && auditIpCols[0].cnt === 0) {
            try {
                await connection.execute(`ALTER TABLE auditLog ADD COLUMN ipAddress VARCHAR(45)`);
                console.log('Added missing column `ipAddress` to auditLog table');
            } catch (e) { console.warn('Could not add auditLog.ipAddress:', e && e.message); }
        }
        if (emailCols[0] && emailCols[0].cnt === 0) {
            try {
                await connection.execute(`ALTER TABLE tickets ADD COLUMN email VARCHAR(255)`);
                console.log('Added missing column `email` to tickets table');
            } catch (e) { console.warn('Could not add tickets.email:', e && e.message); }
        }
        // Ensure `branch` column exists in tickets table
        const [branchCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'branch'`,
            [dbConfig.database]
        );
        if (branchCols[0] && branchCols[0].cnt === 0) {
            try {
                await connection.execute(`ALTER TABLE tickets ADD COLUMN branch VARCHAR(255)`);
                console.log('Added missing column `branch` to tickets table');
            } catch (e) { console.warn('Could not add tickets.branch:', e && e.message); }
        }
        // Ensure `department` column exists in tickets table
        const [deptCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'department'`,
            [dbConfig.database]
        );
        if (deptCols[0] && deptCols[0].cnt === 0) {
            try {
                await connection.execute(`ALTER TABLE tickets ADD COLUMN department VARCHAR(255)`);
                console.log('Added missing column `department` to tickets table');
            } catch (e) { console.warn('Could not add tickets.department:', e && e.message); }
        }
        // Make service_id/serviceId nullable to allow tickets without service references
        try {
            const [cols] = await connection.execute('SHOW COLUMNS FROM tickets');
            const serviceIdCol = cols.find(c => c.Field === 'serviceId' || c.Field === 'service_id');
            if (serviceIdCol && serviceIdCol.Null === 'NO') {
                // Need to drop and recreate the foreign key constraint as nullable
                try {
                    await connection.execute('ALTER TABLE tickets DROP FOREIGN KEY tickets_ibfk_1');
                } catch (e) {
                    console.warn('Could not drop foreign key (may not exist):', e && e.message);
                }
                const colName = serviceIdCol.Field;
                await connection.execute(`ALTER TABLE tickets MODIFY COLUMN ${colName} INT NULL`);
                await connection.execute(`ALTER TABLE tickets ADD CONSTRAINT tickets_ibfk_1 FOREIGN KEY (${colName}) REFERENCES services(id)`);
                console.log(`Made '${colName}' column nullable with foreign key constraint`);
            }
        } catch (e) {
            console.warn('Could not make service_id nullable:', e && e.message);
        }
        // Ensure staff table has firstName and lastName
        const [staffFirst] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'firstName'`,
            [dbConfig.database]
        );
        if (staffFirst[0] && staffFirst[0].cnt === 0) {
            try {
                await connection.execute(`ALTER TABLE staff ADD COLUMN firstName VARCHAR(255)`);
                console.log('Added missing column `firstName` to staff table');
            } catch (e) {
                console.warn('Could not add staff.firstName:', e && e.message);
            }
        }
        const [staffLast] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'lastName'`,
            [dbConfig.database]
        );
        if (staffLast[0] && staffLast[0].cnt === 0) {
            try {
                await connection.execute(`ALTER TABLE staff ADD COLUMN lastName VARCHAR(255)`);
                console.log('Added missing column `lastName` to staff table');
            } catch (e) {
                console.warn('Could not add staff.lastName:', e && e.message);
            }
        }
        // If `ticker` exists on services, remove it (belongs on tickets)
        const [svcTickerCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'services' AND COLUMN_NAME = 'ticker'`,
            [dbConfig.database]
        );

        if (svcTickerCols[0] && svcTickerCols[0].cnt > 0) {
            try {
                await connection.execute(`ALTER TABLE services DROP COLUMN ticker`);
                console.log('Removed `ticker` column from services table (moved to tickets)');
            } catch (e) {
                console.warn('Could not remove `ticker` from services table:', e && e.message);
            }
        }

        // migrate old name/description columns to new mainCategory/subCategory structure
        try {
            const [cols] = await connection.execute('SHOW COLUMNS FROM services');
            const colNames = cols.map(r => r.Field);
            const hasName = colNames.includes('name');
            const hasDesc = colNames.includes('description');
            const hasMain = colNames.includes('mainCategory');
            const hasSub = colNames.includes('subCategory');

            if (hasName && !hasMain) {
                await connection.execute("ALTER TABLE services ADD COLUMN mainCategory VARCHAR(255) NOT NULL DEFAULT ''");
                console.log('Added `mainCategory` column to services');
            }
            if (!hasSub) {
                await connection.execute("ALTER TABLE services ADD COLUMN subCategory VARCHAR(255) NOT NULL DEFAULT ''");
                console.log('Added `subCategory` column to services');
            }
            if (hasName) {
                // copy old name into mainCategory and leave subCategory blank
                await connection.execute("UPDATE services SET mainCategory = name, subCategory = '' WHERE mainCategory = '' OR mainCategory IS NULL");
                await connection.execute("ALTER TABLE services DROP COLUMN name");
                console.log('Migrated existing service names to mainCategory and dropped `name` column');
            }
            if (hasDesc) {
                await connection.execute("ALTER TABLE services DROP COLUMN description");
                console.log('Dropped old `description` column from services');
            }
        } catch (e) {
            console.warn('Error migrating services table to new schema:', e && e.message);
        }

        // Ensure `first_name` exists in users table
        const [firstNameCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'first_name'`,
            [dbConfig.database]
        );

        if (firstNameCols[0] && firstNameCols[0].cnt === 0) {
            await connection.execute(`ALTER TABLE users ADD COLUMN first_name VARCHAR(255)`);
            console.log('Added missing column `first_name` to users table');
        }

        // Ensure `last_name` exists in users table
        const [lastNameCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_name'`,
            [dbConfig.database]
        );

        if (lastNameCols[0] && lastNameCols[0].cnt === 0) {
            await connection.execute(`ALTER TABLE users ADD COLUMN last_name VARCHAR(255)`);
            console.log('Added missing column `last_name` to users table');
        }

        // Ensure `remarks` exists in tickets table for storing remarks about tickets
        const [remarksCols] = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'remarks'`,
            [dbConfig.database]
        );

        if (remarksCols[0] && remarksCols[0].cnt === 0) {
            try {
                await connection.execute(`ALTER TABLE tickets ADD COLUMN remarks TEXT`);
                console.log('Added missing column `remarks` to tickets table');
            } catch (e) {
                console.warn('Could not add tickets.remarks:', e && e.message);
            }
        }
    } catch (error) {
        console.error('Error ensuring columns:', error);
        throw error;
    }
}

async function createTables(connection) {
    try {
        // Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                displayName VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                status VARCHAR(50) DEFAULT 'active',
                contactNumber VARCHAR(50),
                isVerified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table ready');

        // Services table now stores concerns categories with a main/sub hierarchy
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS services (
                id INT PRIMARY KEY AUTO_INCREMENT,
                mainCategory VARCHAR(255) NOT NULL,
                subCategory VARCHAR(255) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Services table ready (main/sub categories)');

        // Tickets table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                ticket_number VARCHAR(255) UNIQUE NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                branch VARCHAR(255),
                department VARCHAR(255),
                category VARCHAR(255),
                description TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                accepted_by VARCHAR(255),
                accepted_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Tickets table ready');

        // Audit Log table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS auditLog (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT,
                userEmail VARCHAR(255),
                action VARCHAR(255) NOT NULL,
                entityType VARCHAR(50),
                entityId VARCHAR(255),
                details JSON,
                ipAddress VARCHAR(45),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);
        console.log('AuditLog table ready');

        // Staff table (additional information for staff accounts)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS staff (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT UNIQUE NOT NULL,
                firstName VARCHAR(255),
                lastName VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);
        console.log('Staff table ready');

        // Branches table for post office branches
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS branches (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) UNIQUE NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Branches table ready');

        // JobOrders table to track work performed by staff
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS joborders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                staffId INT NOT NULL,
                ticketId INT,
                status VARCHAR(50) DEFAULT 'accepted',
                description TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (staffId) REFERENCES staff(id)
            )
        `);
        console.log('JobOrders table ready');

        // Notifications table for admin approval workflow
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                ticketId INT NOT NULL,
                staffId INT NOT NULL,
                staffName VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                branch VARCHAR(255),
                description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (ticketId) REFERENCES tickets(id),
                FOREIGN KEY (staffId) REFERENCES staff(id)
            )
        `);
        console.log('Notifications table ready');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

async function insertSampleData(connection) {
    try {
        // Check if tickets already exist
        const [tickets] = await connection.execute('SELECT COUNT(*) as count FROM tickets');
        
        if (tickets[0].count > 0) {
            console.log('Sample data already exists, skipping insertion');
            return;
        }

        console.log('Inserting sample data for reports...');

        // Insert sample services
        const servicesData = [
            ['Administrative Concerns', 'Scheduling'],
            ['Administrative Concerns', 'Policy'],
            ['Operational Concerns', 'Logistics'],
            ['Operational Concerns', 'Facilities'],
            ['IT Concerns', 'Software'],
            ['IT Concerns', 'Hardware'],
            ['Accounting Concerns', 'Invoices'],
            ['Accounting Concerns', 'Payroll'],
            ['Human Resource Concerns', 'Recruitment'],
            ['Human Resource Concerns', 'Training'],
            ['Marketing Concerns', 'Campaigns'],
            ['Marketing Concerns', 'Public Relations']
        ];

        for (const [main, sub] of servicesData) {
            await connection.execute(
                'INSERT INTO services (mainCategory, subCategory) VALUES (?, ?)',
                [main, sub]
            );
        }

        // Insert sample branches (if not already exist)
        const [branchCount] = await connection.execute('SELECT COUNT(*) as count FROM branches');
        if (branchCount[0].count === 0) {
            const branchesData = [
                'Manila Central Post Office',
                'Makati Central Post Office',
                'Quezon City Central Post Office',
                'Pasay City Post Office',
                'Taguig Post Office',
                'Paranaque Post Office',
                'Las Piñas Post Office',
                'Marikina Central Post Office',
                'San Juan Central Post Office',
                'Pateros Post Office',
                'Valenzuela Post Office',
                'Caloocan Central Post Office'
            ];

            for (const branchName of branchesData) {
                await connection.execute(
                    'INSERT INTO branches (name) VALUES (?)',
                    [branchName]
                );
            }
        }

        // Insert sample departments (if not already exist)
        const [deptCount] = await connection.execute('SELECT COUNT(*) as count FROM departments');
        if (deptCount[0].count === 0) {
            const departmentsData = [
                'Mail Services',
                'Parcel Services',
                'Customer Service',
                'IT Support',
                'Accounting'
            ];
            for (const dept of departmentsData) {
                await connection.execute(
                    'INSERT INTO departments (department) VALUES (?)',
                    [dept]
                );
            }
        }

        // Insert sample users (staff)
        const usersData = [
            ['John', 'Smith', 'john.smith@postoffice.com', 'staff', '1234567890'],
            ['Sarah', 'Johnson', 'sarah.johnson@postoffice.com', 'staff', '1234567891'],
            ['Michael', 'Brown', 'michael.brown@postoffice.com', 'staff', '1234567892'],
            ['Emily', 'Davis', 'emily.davis@postoffice.com', 'staff', '1234567893'],
            ['David', 'Wilson', 'david.wilson@postoffice.com', 'staff', '1234567894']
        ];

        for (const [firstName, lastName, email, role, contact] of usersData) {
            const displayName = firstName + ' ' + lastName;
            const tempPassword = lastName.toLowerCase() + '.123';
            const hashed = bcrypt.hashSync(tempPassword, 10);
            await connection.execute(
                'INSERT INTO users (first_name, last_name, displayName, email, password, role, status, contactNumber, isVerified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                [firstName, lastName, displayName, email, hashed, role, 'active', contact, 1]
            );
        }

        // Insert sample tickets with various data for reports
        const branches = ['Manila Central Post Office', 'Makati Central Post Office', 'Quezon City Central Post Office', 'Pasay City Post Office', 'Taguig Post Office', 'Paranaque Post Office', 'Las Piñas Post office', 'Marikina Central Post Office', 'San Juan Central Post Office', 'Pateros Post Office', 'Valenzuela Post Office', 'Caloocan Central Post Office'];
        // try to load department names from table if available
        let departments = ['Mail Services', 'Parcel Services', 'Customer Service', 'IT Support', 'Accounting'];
        try {
            const [deptRows] = await connection.execute('SELECT department FROM departments');
            if (Array.isArray(deptRows) && deptRows.length) {
                departments = deptRows.map(r => r.department);
            }
        } catch (e) {
            // table might not exist yet or query failed, keep fallback
        }
        const categories = ['Administrative Concerns', 'Operational Concerns', 'IT Concerns', 'Accounting Concerns', 'Human Resource Concerns'];
        const statuses = ['pending', 'inprogress', 'completed', 'awaitingapproval'];
        const staffEmails = ['john.smith@postoffice.com', 'sarah.johnson@postoffice.com', 'michael.brown@postoffice.com', 'emily.davis@postoffice.com', 'david.wilson@postoffice.com'];

        // Generate tickets over the last 90 days
        const now = new Date();
        const ticketsData = [];

        for (let i = 1; i <= 200; i++) {
            const ticketNumber = 'T' + String(700000 + i).padStart(6, '0');
            const customerName = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis', 'Frank Miller', 'Grace Wilson', 'Henry Taylor', 'Ivy Anderson', 'Jack Thomas'][Math.floor(Math.random() * 10)];
            const email = customerName.toLowerCase().replace(' ', '.') + '@example.com';
            const branch = branches[Math.floor(Math.random() * branches.length)];
            const department = departments[Math.floor(Math.random() * departments.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const description = `Sample ticket ${i} for ${category.toLowerCase()} in ${department}`;

            // Random status with weighted distribution
            const statusRand = Math.random();
            let status;
            if (statusRand < 0.4) status = 'completed';
            else if (statusRand < 0.6) status = 'pending';
            else if (statusRand < 0.8) status = 'inprogress';
            else status = 'awaitingapproval';

            // Random creation date in last 90 days
            const daysAgo = Math.floor(Math.random() * 90);
            const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            let acceptedBy = null;
            let acceptedAt = null;
            let completedAt = null;

            if (status !== 'pending') {
                acceptedBy = staffEmails[Math.floor(Math.random() * staffEmails.length)];
                acceptedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)); // Within 24 hours
            }

            if (status === 'completed') {
                completedAt = new Date(acceptedAt.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // Within 7 days
            }

            ticketsData.push([
                ticketNumber,
                customerName,
                email,
                branch,
                department,
                category,
                description,
                status,
                acceptedBy,
                acceptedAt ? acceptedAt.toISOString().slice(0, 19).replace('T', ' ') : null,
                completedAt ? completedAt.toISOString().slice(0, 19).replace('T', ' ') : null,
                createdAt.toISOString().slice(0, 19).replace('T', ' '),
                createdAt.toISOString().slice(0, 19).replace('T', ' ')
            ]);
        }

        // Insert tickets in batches
        for (let i = 0; i < ticketsData.length; i += 10) {
            const batch = ticketsData.slice(i, i + 10);
            for (const ticket of batch) {
                await connection.execute(
                    `INSERT INTO tickets 
                     (ticket_number, customer_name, email, branch, department, category, description, status, accepted_by, accepted_at, completed_at, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    ticket
                );
            }
        }

        console.log(`Inserted ${ticketsData.length} sample tickets`);
        console.log('Sample data insertion complete');
    } catch (error) {
        console.error('Error inserting sample data:', error);
        throw error;
    }
}

// Run initialization
initializeDatabase();
