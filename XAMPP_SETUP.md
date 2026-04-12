# MySQL Setup Guide for Post Office MIS

## Quick Start with XAMPP

Since you already have XAMPP with MySQL and phpMyAdmin, follow these steps:

### Step 1: Verify XAMPP is Running

1. Open XAMPP Control Panel
2. Make sure **MySQL** is running (you should see "Running" status)
3. If not running, click the **Start** button next to MySQL

### Step 2: Verify the Database Exists

1. Open browser and go to: `http://localhost/phpmyadmin`
2. Look for `postoffice` database in the left sidebar
3. If it doesn't exist:
   - Click "New" in the left sidebar
   - Enter database name: `postoffice`
   - Click "Create"

### Step 3: Install Node Packages

```bash
cd C:\VSCode\PostOffice
npm install
```

This will install `mysql2` (the MySQL driver for Node.js).

### Step 4: Create Tables and Insert Sample Data

```bash
npm run setup
```

You should see output like:
```
Connected to MySQL database
Users table ready
Services table ready
Tickets table ready
AuditLog table ready
Inserted service: Mail Services
...
Database initialization complete!
```

### Step 5: Start the Server

```bash
npm start
```

You should see:
```
MySQL connection pool created
Connecting to: localhost/postoffice
Server running at http://localhost:8000/...
```

### Step 6: Access the Application

1. Open browser and go to: `http://localhost:8000/ui/dashboard.html`
2. You should see the dashboard with data from your MySQL database

## Verify Data in phpMyAdmin

To confirm data is being stored correctly:

1. Go to `http://localhost/phpmyadmin`
2. Select the `postoffice` database
3. Click on each table to view the data:
   - **services** - Should have 4 sample services
   - **tickets** - Should have 4 sample tickets
   - **auditLog** - Will populate as you use the application
   - **users** - Will populate when you add users

## Configuration

Edit `config.js` if you need to change database credentials:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',           // Change if you created a different user
    password: '',           // Add password if you set one
    database: 'postoffice'  // Change if you named database differently
};
```

## Troubleshooting

### "Cannot GET /ui/dashboard.html"
- The static files are served from the `ui` folder
- Make sure you're accessing the full path: `http://localhost:8000/ui/dashboard.html`

### "Error: connect ECONNREFUSED 127.0.0.1:3306"
- MySQL is not running. Start it from XAMPP Control Panel

### "Error: ER_BAD_DB_ERROR: Unknown database 'postoffice'"
- Create the `postoffice` database in phpMyAdmin (see Step 2 above)
- Then run `npm run setup`

### "Module not found: mysql2"
- Make sure you ran `npm install`
- Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

## Data Flow

```
User Browser
    ↓
http://localhost:8000
    ↓
Node.js Server (server.js)
    ↓
MySQL Connection Pool
    ↓
XAMPP MySQL Database (postoffice)
    ↓
phpMyAdmin (view/manage data)
```

## Next Steps

- Customize the dashboard in `ui/dashboard.html`
- Update stylesheet in `ui/dashboard.css`
- Modify business logic in `ui/dashboard.js`
- Add more API endpoints in `server.js`
- Create user authentication with password hashing

Happy coding! 🎉
