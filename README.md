<<<<<<< HEAD
# Post Office Management Information System

A modern web-based ticket management system for post office operations using Node.js and MySQL.

## Prerequisites

- **XAMPP** installed with MySQL running
- **Node.js** (version 14 or higher)
- **MySQL database** named `postoffice` on localhost

## Setup Instructions

### 1. Create MySQL Database

You already have the `postoffice` database in phpMyAdmin. The setup script will create the required tables automatically.

### 2. Install Dependencies

```bash
npm install
```

This will install Node.js packages including mysql2.

### 3. Initialize Database Tables

```bash
npm run setup
```

This will:
- Connect to your XAMPP MySQL database
- Create required tables (users, services with main/sub categories, tickets, auditLog)
- Insert sample data (6 main concerns each with 2 sub‑categories)


### 4. Start the Server

```bash
npm start
```

The server will run on `http://localhost:8000`

## Database Configuration

The system uses XAMPP's default MySQL credentials:
- **Host**: localhost
- **User**: root  
- **Password**: (empty)
- **Database**: postoffice

To use different credentials, edit the `dbConfig` in both `db-setup.js` and `server.js`:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'postoffice'
};
```

## Access Your Data

### Via phpMyAdmin
1. Navigate to `http://localhost/phpmyadmin`
2. Select the `postoffice` database
3. View and manage tables: services, tickets, users, auditLog

### Via REST API
The Node.js server exposes endpoints at `http://localhost:8000/api/...`

## Project Structure

```
PostOffice/
├── server.js              # Node.js HTTP server with MySQL API endpoints
├── db-setup.js            # Database initialization script
├── package.json           # Node.js dependencies
├── README.md              # This file
├── ui/
│   ├── dashboard.html     # Main dashboard page
│   ├── dashboard.js       # Dashboard logic (API-driven)
│   ├── dashboard.css      # Dashboard styles
│   ├── index.html      # Login/homepage
│   ├── homepage.js        # Homepage logic
│   └── homepage.css       # Homepage styles
```

## API Endpoints

All endpoints base URL: `http://localhost:8000`

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/:id` - Update ticket status
- `DELETE /api/tickets/:id` - Delete a ticket

### Services (now used for ticket concern categories)
- `GET /api/services` - Get all main/sub category pairs
- `POST /api/services` - Create a new category (requires `mainCategory` and `subCategory` in JSON body)

The UI for creating a ticket will always ask for an email address and no longer auto‑prefills the address of the currently logged in user.

### Dashboard Stats
- `GET /api/stats` - Get dashboard statistics (total, pending, completed, in-progress)
- [NEW] `POST /api/staff` - create or fetch staff record by supplying `{ userId }` (returns `staffId`)
- [NEW] `GET /api/joborders` - list job orders (optionally filter with `?staffId=`)
- [NEW] `POST /api/joborders` - create a job order `{ staffId, ticketId?, description?, status? }`
- [NEW] `PUT /api/joborders/:id` - update job order fields (status/description/ticketId)

Database changes:
- added `staff` table linking back to `users`
- added `joborders` table for storing work performed by staff (status `accepted`/`done`)

UI additions:
- new staff portal at `/ui/staff.html` with corresponding CSS/JS. Staff logging in are redirected here and can accept/complete jobs; their activity is tracked in the `joborders` table for admin statistics.

### Audit Log
- `GET /api/audit` - Get audit trail entries (last 100)
- `POST /api/audit` - Log an audit event

> **Note:** The `auditLog` table now includes an `ipAddress` column. Server endpoints automatically record the client IP for operations that mutate data, including:
> 
> * Ticket creation, updates, deletion
> * Service category or sub-category creation/deletion
> * Branch and department creation/deletion
> * Notification creation and approval/rejection
> * Job order creation and modifications
> * Any manual `POST /api/audit` requests from the client
> 
> Additional events can be logged by calling the `/api/audit` endpoint. The `ipAddress` is captured from the incoming request, giving administrators visibility into where each action originated.

### Authentication
- `POST /api/login` - User login
- `POST /api/forgot-password` - Request password reset email

## Database Schema

### services Table
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(255) NOT NULL
description TEXT
createdAt TIMESTAMP
```

### tickets Table
```sql
id INT PRIMARY KEY AUTO_INCREMENT
ticketId VARCHAR(255) UNIQUE
customerName VARCHAR(255)
serviceName VARCHAR(255)
status VARCHAR(50) (Pending, In Progress, Completed)
description TEXT
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

### users Table
```sql
id INT PRIMARY KEY AUTO_INCREMENT
email VARCHAR(255) UNIQUE
password VARCHAR(255)
displayName VARCHAR(255)
role VARCHAR(50)
createdAt TIMESTAMP
```

### auditLog Table
```sql
id INT PRIMARY KEY AUTO_INCREMENT
userEmail VARCHAR(255)
action VARCHAR(255)
entityType VARCHAR(50)
entityId VARCHAR(255)
details JSON
timestamp TIMESTAMP
```

## Features

- ✅ **Dashboard**: Real-time statistics and recent ticket overview
- ✅ **Ticket Management**: Create, view, update, and delete tickets
- ✅ **Services**: Manage available post office services
- ✅ **Audit Trail**: Track all system actions and changes
- ✅ **Settings**: User preferences and theme customization
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **MySQL Integration**: Persistent data storage via XAMPP

## Troubleshooting

### Connection Refused Error
- Ensure XAMPP MySQL is running (check Services or XAMPP Control Panel)
- Verify database name is `postoffice`

### Database Not Found
- Run `npm run setup` to create tables and sample data

### Port 8000 Already in Use
- Change PORT in server.js or kill the process using port 8000

## Future Enhancements

- [ ] User authentication with password hashing
- [ ] Edit and delete service functionality  
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Role-based access control (RBAC)
- [ ] Database backups

## License

MIT
=======
# Ticketing-System
PhlPost Ticketing System
>>>>>>> af8e24ad841acb8f17e99bfe2ad86976ac64bed0
