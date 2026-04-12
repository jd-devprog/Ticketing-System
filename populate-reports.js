const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { dbConfig } = require('./config');

async function populateReportsData() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database for reports population');

        // Check current ticket count
        const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM tickets');
        const currentCount = countResult[0].count;
        console.log(`Current tickets: ${currentCount}`);

        if (currentCount > 50) {
            console.log('Already have sufficient data for reports');
            await connection.end();
            return;
        }

        // Insert additional sample users if needed
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "staff"');
        if (userCount[0].count < 5) {
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
                try {
                    await connection.execute(
                        'INSERT INTO users (first_name, last_name, displayName, email, password, role, status, contactNumber, isVerified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                        [firstName, lastName, displayName, email, hashed, role, 'active', contact, 1]
                    );
                    console.log(`Added user: ${displayName}`);
                } catch (e) {
                    // User might already exist
                }
            }
        }

        // Generate comprehensive sample tickets
        const branches = ['Downtown Branch', 'North Branch', 'South Branch', 'East Branch', 'West Branch'];
        const departments = ['Mail Services', 'Parcel Services', 'Customer Service', 'IT Support', 'Accounting'];
        const categories = ['Administrative Concerns', 'Operational Concerns', 'IT Concerns', 'Accounting Concerns', 'Human Resource Concerns'];
        const statuses = ['pending', 'inprogress', 'completed', 'awaitingapproval'];
        const staffEmails = ['john.smith@postoffice.com', 'sarah.johnson@postoffice.com', 'michael.brown@postoffice.com', 'emily.davis@postoffice.com', 'david.wilson@postoffice.com'];
        const customerNames = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis', 'Frank Miller', 'Grace Wilson', 'Henry Taylor', 'Ivy Anderson', 'Jack Thomas', 'Karen Moore', 'Larry White', 'Mary Garcia', 'Nancy Martinez', 'Oscar Robinson'];

        const now = new Date();
        const ticketsToAdd = 150; // Add 150 more tickets

        console.log(`Adding ${ticketsToAdd} sample tickets...`);

        for (let i = currentCount + 1; i <= currentCount + ticketsToAdd; i++) {
            const ticketNumber = 'T' + String(700000 + i).padStart(6, '0');
            const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
            const email = customerName.toLowerCase().replace(/\s+/g, '.') + '@example.com';
            const branch = branches[Math.floor(Math.random() * branches.length)];
            const department = departments[Math.floor(Math.random() * departments.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const description = `Ticket ${i}: ${category} issue in ${department} at ${branch}`;

            // Weighted status distribution for realistic data
            const statusRand = Math.random();
            let status;
            if (statusRand < 0.45) status = 'completed';      // 45% completed
            else if (statusRand < 0.65) status = 'pending';   // 20% pending
            else if (statusRand < 0.85) status = 'inprogress'; // 20% in progress
            else status = 'awaitingapproval';                 // 15% awaiting approval

            // Random creation date in last 90 days
            const daysAgo = Math.floor(Math.random() * 90);
            const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            let acceptedBy = null;
            let acceptedAt = null;
            let completedAt = null;

            if (status !== 'pending') {
                acceptedBy = staffEmails[Math.floor(Math.random() * staffEmails.length)];
                // Accepted within 1-48 hours of creation
                const acceptDelay = Math.floor(Math.random() * 47 * 60 * 60 * 1000) + 60 * 60 * 1000;
                acceptedAt = new Date(createdAt.getTime() + acceptDelay);
            }

            if (status === 'completed') {
                // Completed within 1-14 days of acceptance
                const completeDelay = Math.floor(Math.random() * 13 * 24 * 60 * 60 * 1000) + 24 * 60 * 60 * 1000;
                completedAt = new Date(acceptedAt.getTime() + completeDelay);
            }

            await connection.execute(
                `INSERT INTO tickets
                 (ticket_number, customer_name, email, branch, department, category, description, status, accepted_by, accepted_at, completed_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
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
                ]
            );
        }

        console.log(`Successfully added ${ticketsToAdd} tickets`);

        // Verify the data
        const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM tickets');
        const [statusBreakdown] = await connection.execute('SELECT status, COUNT(*) as count FROM tickets GROUP BY status ORDER BY status');

        console.log(`\nFinal ticket count: ${finalCount[0].count}`);
        console.log('Status breakdown:');
        statusBreakdown.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        await connection.end();
        console.log('\nReports data population complete!');
    } catch (error) {
        console.error('Error populating reports data:', error);
        process.exit(1);
    }
}

populateReportsData();