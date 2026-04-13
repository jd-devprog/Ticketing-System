const http = require('http');
const url = require('url');
const querystring = require('querystring');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { dbConfig, emailConfig } = require('./config');

// Create connection pool
const pool = mysql.createPool(dbConfig);
console.log('MySQL connection pool created');
console.log(`Connecting to: ${dbConfig.host}/${dbConfig.database}`);

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = {};
const VERIFICATION_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const CODE_LENGTH = 6;

// IMPORTANT: Role-Based Access Control
// The following endpoints are restricted to SUPER_ADMIN role only (enforce at server level):
//   - POST   /api/users           (create new users)
//   - POST   /api/branches        (create branches)
//   - DELETE /api/branches/*      (delete branches)
//   - POST   /api/departments     (create departments)
//   - DELETE /api/departments/*   (delete departments)
//   - POST   /api/services        (create service categories)
//   - DELETE /api/services/*      (delete service categories)
//   - DELETE /api/services/main/* (delete main category)
// To implement: extract user role from request header/session, verify role before processing request.
// Current UI prevents admin users from triggering these operations (removed buttons in admin.html).
// Server-side checks provide defense-in-depth security.

// Create email transporter (will be used only if email is enabled)
let emailTransporter = null;
if (emailConfig.enabled) {
    emailTransporter = nodemailer.createTransport({
        service: emailConfig.service,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        }
    });
    console.log('Email transporter configured');
}

// Helper function to serve static files
function serveFile(filePath, res) {
    // strip leading slash to avoid path.join treating segment as absolute
    const relativePath = filePath.replace(/^\//, '');
    const fullPath = path.join(__dirname, relativePath);
    
    // Security check - ensure the target is within the ui directory
    const uiRoot = path.join(__dirname, 'ui');
    if (!fullPath.startsWith(uiRoot)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'text/plain';
        if (ext === '.html') contentType = 'text/html; charset=utf-8';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.js') contentType = 'application/javascript';
        // disable caching for UI assets to ensure clients always fetch latest
        if (['.html', '.css', '.js', '.png', '.svg', '.avif'].includes(ext)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.avif') contentType = 'image/avif';
        else if (ext === '.svg') contentType = 'image/svg+xml';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// ============ AUTHORIZATION HELPERS ============
// Extract user role from request (sent via x-user-role header)
function getUserRoleFromRequest(req) {
    const userRole = req.headers['x-user-role'] || '';
    console.log('Received headers:', req.headers);
    console.log('User role from header:', userRole);
    return userRole.toLowerCase();
}

// Check if user has super_admin role for restricted operations
function isSuperAdmin(req) {
    const role = getUserRoleFromRequest(req);
    const isAdmin = role === 'super_admin';
    console.log('[Authorization Check] Role:', role, 'Is Super Admin:', isAdmin);
    return isAdmin;
}

// Check if user is admin (either super_admin or restricted admin)
function isAdmin(req) {
    const role = getUserRoleFromRequest(req);
    const isAdminRole = role === 'super_admin' || role === 'admin';
    console.log('[Authorization Check] Role:', role, 'Is Admin:', isAdminRole);
    return isAdminRole;
}

// Return 403 Forbidden response for unauthorized access
function rejectUnauthorized(res, message = 'Unauthorized: Super Admin access required') {
    res.writeHead(403);
    res.end(JSON.stringify({ success: false, message }));
}

// Map mainCategory to department for ticket segregation
function getCategoryToDepartmentMap() {
    return {
        'Accounting Concern': 'Accounting',
        'Accounting Concerns': 'Accounting',
        'Marketing Concern': 'Marketing',
        'Marketing Concerns': 'Marketing',
        'Administrative Concern': 'Administrative',
        'Administrative Concerns': 'Administrative',
        'Human Resource': 'Human Resource',
        'Human Resource Concerns': 'Human Resource',
        'HR': 'Human Resource',
        'IT Concerns': 'MIS',
        'IT concern': 'MIS',
        'MIS': 'MIS',
        'Operational Concern': 'Operations',
        'Operational Concerns': 'Operations',
        'Operations': 'Operations',
    };
}

// Extract main category from category string (e.g., "Accounting Concern - Invoices")
function getMainCategory(category) {
    if (!category || typeof category !== 'string') return '';
    return category.split('-')[0].trim();
}

// Get department from mainCategory
function getDepartmentFromCategory(mainCategory) {
    const map = getCategoryToDepartmentMap();
    const key = (mainCategory || '').trim();
    return map[key] || mainCategory;
}

const server = http.createServer(async (req, res) => {
    console.log('Incoming request:', req.method, req.url);
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    function getClientIp(req) {
        // try forwarded header first (if behind proxy)
        let ip = req.headers['x-forwarded-for'];
        if (ip) {
            // header can contain multiple IPs
            ip = ip.split(',')[0].trim();
        }
        if (!ip) ip = req.socket && req.socket.remoteAddress;
        if (!ip) return null;
        // convert IPv6 loopback or mapped addresses to IPv4 form
        if (ip === '::1') {
            return '127.0.0.1';
        }
        if (ip.startsWith('::ffff:')) {
            return ip.split(':').pop();
        }
        return ip;
    }

    // Serve static files from /ui directory
    if (pathname.startsWith('/ui/')) {
        const filePath = pathname; // /ui/dashboard.html or /ui/dashboard.css etc
        serveFile(filePath, res);
        return;
    }

    // Serve homepage at root
    if (pathname === '/' || pathname === '') {
        serveFile('/ui/index.html', res);
        return;
    }

    // Change content type back to JSON for API responses
    res.setHeader('Content-Type', 'application/json');

    // API Routes for tickets
    if (pathname === '/api/tickets' && req.method === 'GET') {
        console.log('GET /api/tickets called');
        let connection;
        try {
            connection = await pool.getConnection();

            // Determine a suitable ordering column that exists in the tickets table
            const [colsRows] = await connection.execute('SHOW COLUMNS FROM tickets');
            const columns = colsRows.map(r => r.Field);
            const pick = (...cands) => { for (const c of cands) if (columns.includes(c)) return c; return null; };
            const orderCol = pick('createdAt', 'created_at', 'created', 'createdOn', 'id') || 'id';

            // build WHERE clauses dynamically; admin list normally hides tickets
            // that have been accepted by staff, but callers can request all
            // records by supplying includeAccepted=1 in the query string.
            const whereClauses = [];
            const params = [];
            if (!parsedUrl.query.includeAccepted) {
                whereClauses.push('accepted_by IS NULL');
            }
            if (parsedUrl.query.status) {
                whereClauses.push('status = ?');
                params.push(parsedUrl.query.status);
            }
            
            // Department-based filtering: restrict staff/admin to their department tickets
            // Super admin can see all tickets
            const userRole = (req.headers['x-user-role'] || '').toLowerCase();
            const userDepartment = (req.headers['x-user-department'] || '').trim();
            console.log('[Ticket Filter] User role:', userRole, 'User department:', userDepartment);
            
            let query = 'SELECT * FROM tickets';
            if (whereClauses.length) query += ' WHERE ' + whereClauses.join(' AND ');
            query += ' ORDER BY `id` ASC';
            console.log('Query:', query, 'Params:', params);

            const [rows] = params.length > 0 ? await connection.execute(query, params) : await connection.execute(query);
            console.log('Rows fetched:', rows.length);

            // Normalize column names to expected camelCase keys for the frontend
            const normalized = [];
            for (const r of rows) {
                const obj = {};
                obj.id = r.id || r.ID || null;
                obj.ticket_id = r.ticket_id || r.ticketId || r.ticketNumber || r.ticket_number || r.ticket_no || r.ticketnumber || '';
                obj.customer_name = r.customer_name || r.customerName || r.customer || r.name || r.requester || '';
                obj.first_name = r.first_name || r.firstName || '';
                obj.last_name = r.last_name || r.lastName || '';
                obj.email = r.email || r.contact || r.emailAddress || '';
                obj.branch = r.branch || r.branch_name || '';
                obj.department = r.department || r.dept || '';
                obj.category = r.category || r.cat || '';
                obj.description = r.description || r.problem || r.details || '';
                obj.status = r.status || r.state || 'pending';
                obj.accepted_by = r.accepted_by || r.acceptedBy || null;
                obj.accepted_by_name = r.accepted_by_name || r.acceptedByName || r.accepted_by || '';
                obj.accepted_at = r.accepted_at || r.acceptedAt || null;
                obj.completed_at = r.completed_at || r.completedAt || null;
                obj.created_at = r.created_at || r.createdAt || r.created || r.createdOn || r.timestamp || null;
                obj.updated_at = r.updated_at || r.updatedAt || null;
                obj.remarks = r.remarks || '';
                normalized.push(obj);
            }

            // Resolve service names for rows that only have serviceId
            const serviceIds = [...new Set(normalized.filter(x => x.serviceId).map(x => x.serviceId))];
            const serviceMap = {};
            if (serviceIds.length > 0) {
                try {
                    // services now store mainCategory/subCategory, compose a name string for backwards compatibility
            const [svcRows] = await connection.execute(`SELECT id, CONCAT(mainCategory, ' - ', subCategory) AS name FROM services WHERE id IN (${serviceIds.map(() => '?').join(',')})`, serviceIds);
                    svcRows.forEach(s => { serviceMap[s.id] = s.name; });
                } catch (e) {
                    console.warn('Could not resolve service names:', e && e.message);
                }
            }

            // Apply resolved service names
            normalized.forEach(x => {
                if ((!x.serviceName || x.serviceName === '') && x.serviceId && serviceMap[x.serviceId]) {
                    x.serviceName = serviceMap[x.serviceId];
                }
            });

            // Apply department-based filtering for staff/admin users
            // Super admin and admin see all tickets, only staff get filtered by department
            let filteredTickets = normalized;
            console.log('===== [TICKET FILTER DEBUG] =====');
            console.log('[Ticket Filter] User role:', userRole);
            console.log('[Ticket Filter] User department:', userDepartment);
            console.log('[Ticket Filter] Is super_admin?:', userRole === 'super_admin');
            console.log('[Ticket Filter] Is admin?:', userRole === 'admin');
            console.log('[Ticket Filter] Total tickets before filter:', normalized.length);
            
            if (userRole !== 'super_admin' && userRole !== 'admin' && userDepartment) {
                console.log('✓ APPLYING DEPARTMENT FILTER (not admin/super_admin)');
                const before = normalized.length;
                filteredTickets = normalized.filter(ticket => {
                    const mainCategory = getMainCategory(ticket.category || ticket.department || '');
                    const ticketDept = getDepartmentFromCategory(mainCategory || ticket.category || ticket.department);
                    const matches = ticketDept && ticketDept.toLowerCase() === userDepartment.toLowerCase();
                    if (before <= 15 || matches) {
                        console.log('[Ticket Filter] Ticket id:', ticket.id, 'category:', ticket.category, 'mainCategory:', mainCategory, 'mapped dept:', ticketDept, 'matches user dept:', matches);
                    }
                    return matches;
                });
                console.log('[Ticket Filter] Filtered from', before, 'to', filteredTickets.length, 'tickets');
            } else {
                console.log('✓ NO FILTER APPLIED - Admin/Super_admin sees ALL tickets');
            }
            console.log('[Ticket Filter] Returning', filteredTickets.length, 'tickets');
            console.log('===== [END TICKET FILTER DEBUG] =====');

            connection.release();

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: filteredTickets || [] }));
        } catch (err) {
            if (connection) connection.release();
            console.error('Error fetching tickets:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // DEBUG: Echo back headers for testing
    if (pathname === '/api/debug/headers') {
        const userRole = (req.headers['x-user-role'] || '').toLowerCase();
        const userDepartment = (req.headers['x-user-department'] || '').trim();
        const categoryMap = getCategoryToDepartmentMap();
        
        const deptCategories = Object.entries(categoryMap)
            .filter(([,dept]) => dept.toLowerCase() === userDepartment.toLowerCase())
            .map(([cat]) => cat);
        
        const result = {
            'x-user-role': userRole,
            'x-user-department': userDepartment,
            'will-filter-categories': deptCategories,
            'all-headers': req.headers
        };
        res.writeHead(200);
        res.end(JSON.stringify(result, null, 2));
        return;
    }

    // Create ticket
    if (pathname === '/api/tickets' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            let connection;
            try {
                console.log('Raw /api/tickets body:', body);
                let data = null;
                const contentType = (req.headers['content-type'] || '').toLowerCase();

                if (contentType.includes('application/json')) {
                    try {
                        data = JSON.parse(body);
                    } catch (parseErr) {
                        console.error('Invalid JSON in /api/tickets body:', body);
                        res.writeHead(400);
                        res.end(JSON.stringify({ success: false, message: 'Invalid JSON body' }));
                        return;
                    }
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(body);
                    data = Object.fromEntries(params.entries());
                } else {
                    // Try JSON first, then try urlencoded as a fallback
                    try {
                        data = JSON.parse(body);
                    } catch (e) {
                        try {
                            const params = new URLSearchParams(body);
                            data = Object.fromEntries(params.entries());
                        } catch (e2) {
                            console.error('Unrecognized body format for /api/tickets:', body);
                            res.writeHead(400);
                            res.end(JSON.stringify({ success: false, message: 'Invalid request body' }));
                            return;
                        }
                    }
                }

                // expected fields: firstName, lastName, email, problem, branch, department
                console.log('Parsed /api/tickets data:', data);
                const firstName = (data.firstName || '').trim();
                const lastName = (data.lastName || '').trim();
                const email = (data.email || '').trim().toLowerCase();
                const problem = data.problem || data.description || '';
                const branch = data.branch || '';
                const department = data.department || '';
                const category = data.category || '';
                const acceptedBy = data.accepted_by || data.acceptedBy || null;
                const acceptedAt = data.accepted_at || data.acceptedAt || null;
                const completedAt = data.completed_at || data.completedAt || null;

                const missing = [];
                if (!firstName) missing.push('firstName');
                if (!lastName) missing.push('lastName');
                if (!email) missing.push('email');
                if (!problem) missing.push('problem');

                if (missing.length > 0) {
                    console.warn('Missing required ticket fields:', missing);
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Missing required ticket fields', missing }));
                    return;
                }

                const ticketId = 'T' + String(Date.now()).slice(-6);
                const ticker = (data.ticker && String(data.ticker).trim()) || ('TK' + String(Date.now()).slice(-6));
                const customerName = `${firstName} ${lastName}`.trim();
                const serviceName = branch && department ? `${branch} - ${department}` : (data.serviceName || 'General');

                connection = await pool.getConnection();

                // Determine best field names from schema to support snake_case and camelCase setups
                const [colsRows] = await connection.execute('SHOW COLUMNS FROM tickets');
                const columns = colsRows.map(r => r.Field);
                const pick = (...cands) => cands.find(c => columns.includes(c));

                const colTicket = pick('ticket_id', 'ticket_number', 'ticketId');
                const colTicker = pick('ticker', 'ticket_ticker', 'ticker_code');
                const colCustomer = pick('customer_name', 'customerName', 'customer');
                const colService = pick('service_name', 'serviceName', 'service');
                const colStatus = pick('status', 'state');
                const colCategory = pick('category', 'cat');
                const colDescription = pick('description', 'problem', 'details');
                const colEmail = pick('email', 'contact', 'emailAddress');
                const colBranch = pick('branch', 'branch_name');
                const colDepartment = pick('department', 'dept');
                const colAcceptedBy = pick('accepted_by', 'acceptedBy');
                const colAcceptedAt = pick('accepted_at', 'acceptedAt');
                const colCompletedAt = pick('completed_at', 'completedAt');
                const colCreated = pick('created_at', 'createdAt', 'created');

                const insertCols = [];
                const insertVals = [];
                const add = (col, val) => {
                    if (col) {
                        insertCols.push(`\`${col}\``);
                        insertVals.push(val);
                    }
                };

                add(colTicket, ticketId);
                add(colTicker, ticker);
                add(colCustomer, customerName);
                add(colService, serviceName);
                add(colStatus, 'pending');
                add(colCategory, category);
                add(colDescription, problem);
                add(colEmail, email);
                add(colBranch, branch);
                add(colDepartment, department);
                add(colAcceptedBy, acceptedBy);
                add(colAcceptedAt, acceptedAt);
                add(colCompletedAt, completedAt);
                if (colCreated) {
                    // preserve whatever created column exists
                    insertCols.push(`\`${colCreated}\``);
                    insertVals.push(new Date());
                }

                const insertSql = `INSERT INTO tickets (${insertCols.join(',')}) VALUES (${insertCols.map(() => '?').join(',')})`;

                let result;
                try {
                    [result] = await connection.execute(insertSql, insertVals);
                } catch (insertErr) {
                    console.warn('Dynamic tickets insert failed, attempting legacy fallback:', insertErr && insertErr.message);
                    // fallback to previous adaptive insert path
                    try {
                        const [colsRowsFallback] = await connection.execute('SHOW COLUMNS FROM tickets');
                        const columnsFallback = colsRowsFallback.map(r => r.Field);
                        const extras = Object.fromEntries(colsRowsFallback.map(r => [r.Field, r.Extra || '']));

                        const addIfMissing = async (col, ddl) => {
                            if (!columnsFallback.includes(col)) {
                                try {
                                    await connection.execute(ddl);
                                    console.log(`Added missing column '${col}' to tickets table`);
                                    columnsFallback.push(col);
                                } catch (e) {
                                    console.warn(`Could not add column '${col}':`, e && e.message);
                                }
                            }
                        };

                        await addIfMissing('ticket_id', "ALTER TABLE tickets ADD COLUMN ticket_id VARCHAR(255)");
                        await addIfMissing('ticket_number', "ALTER TABLE tickets ADD COLUMN ticket_number VARCHAR(255)");
                        await addIfMissing('ticker', "ALTER TABLE tickets ADD COLUMN ticker VARCHAR(255)");
                        await addIfMissing('customer_name', "ALTER TABLE tickets ADD COLUMN customer_name VARCHAR(255)");
                        await addIfMissing('description', "ALTER TABLE tickets ADD COLUMN description TEXT");
                        await addIfMissing('email', "ALTER TABLE tickets ADD COLUMN email VARCHAR(255)");
                        await addIfMissing('branch', "ALTER TABLE tickets ADD COLUMN branch VARCHAR(255)");
                        await addIfMissing('department', "ALTER TABLE tickets ADD COLUMN department VARCHAR(255)");
                        await addIfMissing('category', "ALTER TABLE tickets ADD COLUMN category VARCHAR(255)");
                        await addIfMissing('accepted_by', "ALTER TABLE tickets ADD COLUMN accepted_by VARCHAR(255) NULL");
                        await addIfMissing('accepted_at', "ALTER TABLE tickets ADD COLUMN accepted_at TIMESTAMP NULL");
                        await addIfMissing('completed_at', "ALTER TABLE tickets ADD COLUMN completed_at TIMESTAMP NULL");

                        const pickFallback = (...fCands) => fCands.find(c => columnsFallback.includes(c));
                        const colTicketFb = pickFallback('ticket_id', 'ticket_number', 'ticketId');
                        const colTickerFb = pickFallback('ticker', 'ticket_ticker', 'ticker_code');
                        const colCustomerFb = pickFallback('customer_name', 'customerName', 'customer');
                        const colServiceFb = pickFallback('service_name', 'serviceName', 'service');
                        const colStatusFb = pickFallback('status', 'state');
                        const colCategoryFb = pickFallback('category', 'cat');
                        const colDescriptionFb = pickFallback('description', 'problem', 'details');
                        const colEmailFb = pickFallback('email', 'contact', 'emailAddress');
                        const colBranchFb = pickFallback('branch', 'branch_name');
                        const colDepartmentFb = pickFallback('department', 'dept');
                        const colAcceptedByFb = pickFallback('accepted_by', 'acceptedBy');
                        const colAcceptedAtFb = pickFallback('accepted_at', 'acceptedAt');
                        const colCompletedAtFb = pickFallback('completed_at', 'completedAt');

                        const colsToInsert = [];
                        const valsToInsert = [];
                        const append = (c, v) => {
                            if (c) {
                                colsToInsert.push(`\`${c}\``);
                                valsToInsert.push(v);
                            }
                        };

                        append(colTicketFb, ticketId);
                        append(colTickerFb, ticker);
                        append(colCustomerFb, customerName);
                        append(colServiceFb, serviceName);
                        append(colStatusFb, 'pending');
                        append(colCategoryFb, category);
                        append(colDescriptionFb, problem);
                        append(colEmailFb, email);
                        append(colBranchFb, branch);
                        append(colDepartmentFb, department);
                        append(colAcceptedByFb, acceptedBy);
                        append(colAcceptedAtFb, acceptedAt);
                        append(colCompletedAtFb, completedAt);

                        const insertSqlFallback = `INSERT INTO tickets (${colsToInsert.join(',')}) VALUES (${colsToInsert.map(() => '?').join(',')})`;
                        [result] = await connection.execute(insertSqlFallback, valsToInsert);

                    } catch (fallbackErr) {
                        console.error('Fallback tickets insert failed:', fallbackErr);
                        res.writeHead(500);
                        res.end(JSON.stringify({ success: false, message: 'Failed to create ticket' }));
                        return;
                    }
                }

                // Log audit event for ticket creation
                try {
                    await connection.execute(
                        'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                        [email, 'Created ticket', 'ticket', ticketId, JSON.stringify({ branch, department, problem }), getClientIp(req)]
                    );
                } catch (auditErr) {
                    console.error('Failed to write audit log for ticket creation:', auditErr);
                }

                // Try sending confirmation email to the submitter
                let emailSent = false;
                let emailError = null;
                try {
                    if (emailTransporter) {
                        const mailOptions = {
                            from: (emailConfig && emailConfig.from) || emailConfig.user,
                            to: email,
                            subject: `Support Ticket Created - ${ticketId}`,
                            html: `
                                <h2>Support Ticket Confirmation</h2>
                                <p>Dear ${firstName} ${lastName},</p>
                                <p>Your support ticket has been created successfully.</p>
                                <hr>
                                <h3>Ticket Details:</h3>
                                <ul>
                                    <li><strong>Ticket ID:</strong> ${ticketId}</li>
                                    <li><strong>Created:</strong> ${new Date().toLocaleString()}</li>
                                    <li><strong>Branch:</strong> ${branch}</li>
                                    <li><strong>Department:</strong> ${department}</li>
                                </ul>
                                <h3>Your Issue:</h3>
                                <p>${problem}</p>
                                <hr>
                                <p>Our support team will review your ticket and get back to you soon.</p>
                                <p>Please keep your ticket ID for reference: <strong>${ticketId}</strong></p>
                                <p>Best regards,<br>Post Office Support</p>
                            `
                        };

                        await emailTransporter.sendMail(mailOptions);
                        emailSent = true;
                    }
                } catch (mailErr) {
                    console.error('Failed to send ticket confirmation email:', mailErr);
                    emailError = mailErr && mailErr.message ? mailErr.message : String(mailErr);
                }

                res.writeHead(201);
                res.end(JSON.stringify({ success: true, data: { id: result.insertId, ticket_id: ticketId, ticker: ticker, email_sent: emailSent, email_error: emailError } }));
            } catch (error) {
                console.error('Error creating ticket:', error);
                console.error('Error details:', error.message, error.code, error.sql);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error while creating ticket: ' + (error.message || 'Unknown error') }));
            } finally {
                if (connection) connection.release();
            }
        });
        return;
    }

    // Update ticket status (and optional acceptedBy/acceptedAt/completedAt)
    if (pathname.match(/^\/api\/tickets\/\d+$/) && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body || '{}');
                const id = parseInt(pathname.split('/')[3]);
                const connection = await pool.getConnection();
                const fields = [];
                const params = [];
                console.log('[TICKET UPDATE] id=', id, 'payload=', data);
                console.log('[TICKET UPDATE] checking remarks:', 'remarks' in data, 'value:', data.remarks);

                const acceptedByValue = data.accepted_by !== undefined ? data.accepted_by : data.acceptedBy;
                const acceptedAtValue = data.accepted_at !== undefined ? data.accepted_at : data.acceptedAt;
                const completedAtValue = data.completed_at !== undefined ? data.completed_at : data.completedAt;

                // If staff supplied accepted_by but didn't provide status, assume inprogress
                if (acceptedByValue !== undefined && (data.status === undefined || data.status === '' || data.status === null)) {
                    data.status = 'inprogress';
                }

                if (data.status !== undefined && data.status !== '' && data.status !== null) {
                    const normalizedStatus = String(data.status).toLowerCase().replace(/\s+/g,'');
                    fields.push('status = ?'); params.push(normalizedStatus);
                    // Helper to get current time in Philippines (Asia/Manila) as MySQL DATETIME string
                    const getPhilippinesTimestamp = () => {
                        const now = new Date();
                        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                        const manilaOffset = 8 * 60 * 60 * 1000; // +8 hours
                        const manila = new Date(utc + manilaOffset);
                        const yr = manila.getFullYear();
                        const mo = String(manila.getMonth() + 1).padStart(2, '0');
                        const da = String(manila.getDate()).padStart(2, '0');
                        const hr = String(manila.getHours()).padStart(2, '0');
                        const mn = String(manila.getMinutes()).padStart(2, '0');
                        const sc = String(manila.getSeconds()).padStart(2, '0');
                        return `${yr}-${mo}-${da} ${hr}:${mn}:${sc}`;
                    };

                    if (normalizedStatus === 'inprogress' && (acceptedAtValue === undefined || acceptedAtValue === null)) {
                        fields.push('accepted_at = ?'); params.push(getPhilippinesTimestamp());
                    }
                    // mark completed_at when status moves to completed (or awaitingapproval, for legacy)
                    if ((normalizedStatus === 'completed' || normalizedStatus === 'awaitingapproval') && (completedAtValue === undefined || completedAtValue === null)) {
                        // completed_at should also respect Philippines time
                        fields.push('completed_at = ?'); params.push(getPhilippinesTimestamp());
                    }
                }

                if (acceptedByValue !== undefined) { fields.push('accepted_by = ?'); params.push(acceptedByValue); }
                if (acceptedAtValue !== undefined && acceptedAtValue !== null) {
                    let tsVal = acceptedAtValue;
                    if (typeof tsVal === 'string') {
                        const parsed = new Date(tsVal);
                        if (!isNaN(parsed.getTime())) {
                            const yr = parsed.getUTCFullYear();
                            const mo = String(parsed.getUTCMonth() + 1).padStart(2, '0');
                            const da = String(parsed.getUTCDate()).padStart(2, '0');
                            const hr = String(parsed.getUTCHours()).padStart(2, '0');
                            const mn = String(parsed.getUTCMinutes()).padStart(2, '0');
                            const sc = String(parsed.getUTCSeconds()).padStart(2, '0');
                            tsVal = `${yr}-${mo}-${da} ${hr}:${mn}:${sc}`;
                        } else {
                            tsVal = null;
                        }
                    }
                    if (tsVal) { fields.push('accepted_at = ?'); params.push(tsVal); }
                }

                if (completedAtValue !== undefined && completedAtValue !== null) {
                    let tsVal = completedAtValue;
                    if (typeof tsVal === 'string') {
                        const parsed = new Date(tsVal);
                        if (!isNaN(parsed.getTime())) {
                            const yr = parsed.getUTCFullYear();
                            const mo = String(parsed.getUTCMonth() + 1).padStart(2, '0');
                            const da = String(parsed.getUTCDate()).padStart(2, '0');
                            const hr = String(parsed.getUTCHours()).padStart(2, '0');
                            const mn = String(parsed.getUTCMinutes()).padStart(2, '0');
                            const sc = String(parsed.getUTCSeconds()).padStart(2, '0');
                            tsVal = `${yr}-${mo}-${da} ${hr}:${mn}:${sc}`;
                        } else {
                            tsVal = null;
                        }
                    }
                    if (tsVal) { fields.push('completed_at = ?'); params.push(tsVal); }
                }

                if ('remarks' in data) {
                    fields.push('remarks = ?');
                    params.push(data.remarks || '');
                }

                if (fields.length === 0) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'No fields to update' }));
                    connection.release();
                    return;
                }

                params.push(id);
                const [updateRes] = await connection.execute(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`, params);
                console.log('[TICKET UPDATE] mysql result', updateRes);

                // Audit ticket update with details of changed fields
                try {
                    await connection.execute(
                        'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                        [null, 'Updated ticket', 'ticket', id, JSON.stringify(data), getClientIp(req)]
                    );

                    // additional semantic events
                    if (acceptedByValue !== undefined) {
                        await connection.execute(
                            'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                            [null, 'Accepted ticket', 'ticket', id, JSON.stringify({ accepted_by: acceptedByValue }), getClientIp(req)]
                        );
                    }
                    if (data.status && String(data.status).toLowerCase().includes('completed')) {
                        await connection.execute(
                            'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                            [null, 'Completed ticket', 'ticket', id, JSON.stringify({ status: data.status }), getClientIp(req)]
                        );
                    }
                } catch (auditErr) {
                    console.error('Failed to write audit log for ticket update:', auditErr);
                }

                // If status changed to awaitingapproval, create a notification for admin
                if (data.status && String(data.status).toLowerCase().replace(/\s+/g,'') === 'awaitingapproval') {
                    try {
                        // Get ticket details for notification
                        const [ticketRows] = await connection.execute(
                            'SELECT t.*, s.name as staffName FROM tickets t LEFT JOIN staff s ON t.accepted_by = s.name WHERE t.id = ?',
                            [id]
                        );
                        
                        if (ticketRows.length > 0) {
                            const ticket = ticketRows[0];
                            // Create notification record
                            await connection.execute(
                                'INSERT INTO notifications (ticketId, staffId, staffName, category, branch, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                [
                                    ticket.id,
                                    ticket.accepted_by ? 1 : null, // Default staffId if not available
                                    ticket.staffName || ticket.accepted_by || 'Unknown Staff',
                                    ticket.category || ticket.serviceName || 'General',
                                    ticket.branch || '',
                                    ticket.description || ticket.problemDescription || 'Ticket completed and awaiting approval',
                                    'pending'
                                ]
                            );
                            console.log('[NOTIFICATION CREATED] for ticket', id);
                        }
                    } catch (notifError) {
                        console.error('Error creating notification:', notifError);
                        // Don't fail the whole request if notification creation fails
                    }
                }

                connection.release();

                const affectedRows = updateRes.affectedRows || 0;
                if (affectedRows === 0) {
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: false, warning: 'No ticket found with that ID', id }));
                    return;
                }

                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'Ticket updated' }));
            } catch (error) {
                console.error('Error updating ticket:', error);
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
            }
        });
        return;
    }

    // Delete ticket
    if (pathname.match(/^\/api\/tickets\/\d+$/) && req.method === 'DELETE') {
        try {
            const id = parseInt(pathname.split('/')[3]);
            const connection = await pool.getConnection();
            await connection.execute('DELETE FROM tickets WHERE id = ?', [id]);
            await connection.execute(
                'INSERT INTO auditLog (userEmail, action, entityType, entityId, ipAddress) VALUES (?, ?, ?, ?, ?)',
                [null, 'Deleted ticket', 'ticket', id, getClientIp(req)]
            );
            connection.release();

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, message: 'Ticket deleted' }));
        } catch (error) {
            console.error('Error deleting ticket:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // API Routes for services
    if (pathname === '/api/services' && req.method === 'GET') {
        try {
            const connection = await pool.getConnection();
            // return category list with main and sub fields
            const [rows] = await connection.execute('SELECT id, mainCategory, subCategory FROM services ORDER BY mainCategory ASC, subCategory ASC');
            connection.release();

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: rows || [] }));
        } catch (err) {
            console.error('Error fetching services:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // Create service
    // ⚠️ RESTRICTED TO SUPER_ADMIN ROLE ONLY - enforce user role check here
    if (pathname === '/api/services' && req.method === 'POST') {
        // Authorization check - allow both super_admin and admin
        if (!isAdmin(req)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Only admins can create services' }));
            return;
        }
        console.log('service create called from', getClientIp(req));
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const connection = await pool.getConnection();
                // expect { mainCategory, subCategory }
                const mainCat = (data.mainCategory || '').trim();
                const subCat = (data.subCategory || '').trim();
                if (!mainCat || !subCat) {
                    throw new Error('mainCategory and subCategory are required');
                }
                const [result] = await connection.execute(
                    'INSERT INTO services (mainCategory, subCategory) VALUES (?, ?)',
                    [mainCat, subCat]
                );
                await connection.execute(
                    'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                    [null, 'Created service', 'service', result.insertId, JSON.stringify({ mainCat, subCat }), getClientIp(req)]
                );
                connection.release();
                res.writeHead(201);
                res.end(JSON.stringify({ success: true, data: { id: result.insertId, name: data.name } }));
            } catch (error) {
                console.error('Error creating service:', error);
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
            }
        });
        return;
    }

    // Delete a single sub-category by ID
    // ⚠️ RESTRICTED TO ADMIN ROLE (super_admin and admin) - enforce user role check here
    if (pathname.match(/^\/api\/services\/\d+$/) && req.method === 'DELETE') {
        // Authorization check - allow both super_admin and admin
        if (!isAdmin(req)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Only admins can delete services' }));
            return;
        }
        try {
            const id = parseInt(pathname.split('/')[3]);
            const connection = await pool.getConnection();
            await connection.execute('DELETE FROM services WHERE id = ?', [id]);
            await connection.execute(
                'INSERT INTO auditLog (userEmail, action, entityType, entityId, ipAddress) VALUES (?, ?, ?, ?, ?)',
                [null, 'Deleted service', 'service', id, getClientIp(req)]
            );
            connection.release();

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, message: 'Service deleted' }));
        } catch (error) {
            console.error('Error deleting service:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // Delete all sub-categories under a main category
    // ⚠️ RESTRICTED TO SUPER_ADMIN ROLE ONLY - enforce user role check here
    if (pathname.match(/^\/api\/services\/main\/.+$/) && req.method === 'DELETE') {
        // Authorization check
        if (!isAdmin(req)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Only admins can delete service categories' }));
            return;
        }
        let connection;
        try {
            // Use URL API to properly extract the main category
            const pathParts = pathname.split('/api/services/main/');
            if (pathParts.length < 2) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Invalid URL format' }));
                return;
            }
            
            const mainCategory = decodeURIComponent(pathParts[1]).trim();
            console.log(`[DELETE MAIN] Attempting to delete main category: "${mainCategory}"`);
            
            if (!mainCategory) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Main category name is required' }));
                return;
            }
            
            connection = await pool.getConnection();
            
            // Delete tickets that reference services in this main category (using subquery)
            const [ticketResult] = await connection.execute(
                'DELETE FROM tickets WHERE service_id IN (SELECT id FROM services WHERE mainCategory = ?)',
                [mainCategory]
            );
            await connection.execute(
                'INSERT INTO auditLog (userEmail, action, entityType, details, ipAddress) VALUES (?, ?, ?, ?, ?)',
                [null, 'Deleted main category', 'service', JSON.stringify({ mainCategory }), getClientIp(req)]
            );
            console.log(`[DELETE MAIN] Deleted ${ticketResult.affectedRows} referencing tickets`);
            
            // Delete the services themselves
            const [serviceResult] = await connection.execute(
                'DELETE FROM services WHERE mainCategory = ?',
                [mainCategory]
            );
            console.log(`[DELETE MAIN] Deleted ${serviceResult.affectedRows} services`);

            res.writeHead(200);
            res.end(JSON.stringify({ 
                success: true,
                message: 'Main category and associated tickets deleted', 
                deletedServices: serviceResult.affectedRows,
                deletedTickets: ticketResult.affectedRows
            }));
        } catch (error) {
            console.error('Error deleting main category:', error.message, error.stack);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: `Database error: ${error.message}` }));
        } finally {
            if (connection) connection.release();
        }
        return;
    }

    // API Routes for branches
    if (pathname === '/api/branches' && req.method === 'GET') {
        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.execute('SELECT id, name FROM branches ORDER BY name ASC');
            connection.release();

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: rows || [] }));
        } catch (err) {
            console.error('Error fetching branches:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // create new branch (accept trailing slash too)
    // ⚠️ RESTRICTED TO SUPER_ADMIN ROLE ONLY - enforce user role check here
    if ((pathname === '/api/branches' || pathname === '/api/branches/') && req.method === 'POST') {
        // Authorization check
        if (!isSuperAdmin(req)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Only super admins can create branches' }));
            return;
        }
        console.log('POST /api/branches called');
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const name = (data.name || '').trim();
                if (!name) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Branch name required' }));
                    return;
                }
                const connection = await pool.getConnection();
                const [resu] = await connection.execute('INSERT INTO branches (name) VALUES (?)', [name]);
                await connection.execute(
                    'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                    [null, 'Created branch', 'branch', resu.insertId, JSON.stringify({ name }), getClientIp(req)]
                );
                connection.release();
                res.writeHead(201);
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('Error creating branch:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Database error' }));
            }
        });
        return;
    }

    // delete branch by id
    // ⚠️ RESTRICTED TO SUPER_ADMIN ROLE ONLY - enforce user role check here
    if (pathname.startsWith('/api/branches/') && req.method === 'DELETE') {
        // Authorization check
        if (!isSuperAdmin(req)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Only super admins can delete branches' }));
            return;
        }
        const parts = pathname.split('/');
        const bid = parts[3];
        if (!bid) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Branch id missing' }));
            return;
        }
        try {
            const connection = await pool.getConnection();
            await connection.execute('DELETE FROM branches WHERE id = ?', [bid]);
            await connection.execute(
                'INSERT INTO auditLog (userEmail, action, entityType, entityId, ipAddress) VALUES (?, ?, ?, ?, ?)',
                [null, 'Deleted branch', 'branch', bid, getClientIp(req)]
            );
            connection.release();

            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } catch (err) {
            console.error('Error deleting branch:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    if (pathname === '/api/departments' && req.method === 'GET') {
        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.execute('SELECT id, department FROM departments ORDER BY department ASC');
            connection.release();

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: rows || [] }));
        } catch (err) {
            console.error('Error fetching departments:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // create department (allow trailing slash)
    // ⚠️ RESTRICTED TO SUPER_ADMIN ROLE ONLY - enforce user role check here
    if ((pathname === '/api/departments' || pathname === '/api/departments/') && req.method === 'POST') {
        // Authorization check
        if (!isSuperAdmin(req)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Only super admins can create departments' }));
            return;
        }
        console.log('POST /api/departments called');
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const dept = (data.department || '').trim();
                if (!dept) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Department name required' }));
                    return;
                }
                const connection = await pool.getConnection();
                const [resu] = await connection.execute('INSERT INTO departments (department) VALUES (?)', [dept]);
                await connection.execute(
                    'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                    [null, 'Created department', 'department', resu.insertId, JSON.stringify({ dept }), getClientIp(req)]
                );
                connection.release();
                res.writeHead(201);
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('Error creating department:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Database error' }));
            }
        });
        return;
    }

    // delete department
    // ⚠️ RESTRICTED TO SUPER_ADMIN ROLE ONLY - enforce user role check here
    if (pathname.startsWith('/api/departments/') && req.method === 'DELETE') {
        // Authorization check
        if (!isSuperAdmin(req)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Only super admins can delete departments' }));
            return;
        }
        const parts = pathname.split('/');
        const did = parts[3];
        if (!did) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Department id missing' }));
            return;
        }
        try {
            const connection = await pool.getConnection();
            await connection.execute('DELETE FROM departments WHERE id = ?', [did]);
            await connection.execute(
                'INSERT INTO auditLog (userEmail, action, entityType, entityId, ipAddress) VALUES (?, ?, ?, ?, ?)',
                [null, 'Deleted department', 'department', did, getClientIp(req)]
            );
            connection.release();
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } catch (err) {
            console.error('Error deleting department:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // API Routes for audit log

    // API Routes for comprehensive analytics
    if (pathname === '/api/analytics' && req.method === 'GET') {
        try {
            const connection = await pool.getConnection();
            
            // Get user role and department from headers
            const userRole = (req.headers['x-user-role'] || '').toLowerCase();
            const userDepartment = (req.headers['x-user-department'] || '').trim();
            
            // Get query parameters for filtering
            const startDate = parsedUrl.query.startDate ? new Date(parsedUrl.query.startDate) : new Date(Date.now() - 90*24*60*60*1000);
            const endDate = parsedUrl.query.endDate ? new Date(parsedUrl.query.endDate) : new Date();
            const queryDepartment = parsedUrl.query.department || null; // Super admin can filter by dept
            const branch = parsedUrl.query.branch || null;
            const staff = parsedUrl.query.staff || null;
            const status = parsedUrl.query.status || null;
            
            // Format dates for SQL
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = new Date(endDate.getTime() + 24*60*60*1000).toISOString().split('T')[0];
            
            // Build base query with department filtering
            let whereClause = 'WHERE DATE(created_at) >= ? AND DATE(created_at) < ?';
            const params = [startDateStr, endDateStr];
            
            // Helper to get categories for a department
            const getCategoriesForDepartment = (dept) => {
                const categoryToDept = {
                    'Accounting Concerns': 'Accounting',
                    'Marketing Concerns': 'Marketing',
                    'Administrative Concerns': 'Administrative',
                    'Human Resource Concerns': 'Human Resource',
                    'IT Concerns': 'MIS',
                    'Operational Concerns': 'Operations'
                };
                return Object.entries(categoryToDept)
                    .filter(([,d]) => d.toLowerCase() === dept.toLowerCase())
                    .map(([cat]) => cat);
            };
            
            // Add department filter: either from super_admin query param or from user's department
            let deptToFilter = queryDepartment || (userRole !== 'super_admin' ? userDepartment : null);
            if (deptToFilter) {
                const deptCategories = getCategoriesForDepartment(deptToFilter);
                if (deptCategories.length > 0) {
                    whereClause += ' AND category IN (' + deptCategories.map(() => '?').join(',') + ')';
                    params.push(...deptCategories);
                }
            }
            
            if (branch) { whereClause += ' AND branch = ?'; params.push(branch); }
            if (staff) { whereClause += ' AND accepted_by = ?'; params.push(staff); }
            if (status) { whereClause += ' AND status = ?'; params.push(status); }
            
            // Overall stats
            const [statsRows] = await connection.execute(
                `SELECT COUNT(*) as total, 
                        SUM(status = 'completed') as completed,
                        SUM(status = 'pending') as pending,
                        SUM(status = 'inprogress') as inprogress,
                        SUM(status = 'awaitingapproval') as awaitingapproval
                 FROM tickets ${whereClause}`,
                params
            );
            
            // Per status breakdown
            const [statusBreakdown] = await connection.execute(
                `SELECT status, COUNT(*) as count FROM tickets ${whereClause} GROUP BY status`,
                params
            );
            
            // Per branch stats
            const [perBranch] = await connection.execute(
                `SELECT branch, COUNT(*) as total, SUM(status = 'completed') as completed FROM tickets ${whereClause} GROUP BY branch ORDER BY total DESC`,
                params
            );
            
            // Per staff stats
            const [perStaff] = await connection.execute(
                `SELECT accepted_by as staffName, COUNT(*) as total, SUM(status = 'completed') as completed FROM tickets ${whereClause} AND accepted_by IS NOT NULL GROUP BY accepted_by ORDER BY total DESC`,
                params
            );
            
            // Time series data (daily)
            const [timeSeries] = await connection.execute(
                `SELECT DATE(created_at) as date, COUNT(*) as total, SUM(status = 'completed') as completed FROM tickets ${whereClause} GROUP BY DATE(created_at) ORDER BY date ASC`,
                params
            );
            
            // Average resolution time
            const [resolutionTime] = await connection.execute(
                `SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avgHours FROM tickets ${whereClause} AND status = 'completed' AND completed_at IS NOT NULL`,
                params
            );
            
            // Branches list
            const [branches] = await connection.execute('SELECT DISTINCT branch FROM tickets WHERE branch IS NOT NULL AND branch != "" ORDER BY branch');
            
            // Staff list used for various stats (accepted_by)
            const [staffList] = await connection.execute('SELECT DISTINCT accepted_by FROM tickets WHERE accepted_by IS NOT NULL ORDER BY accepted_by');

            // full staff roster (users table filter on role) – return full name
            const [allStaffRows] = await connection.execute(
                'SELECT CONCAT(first_name, " ", last_name) as name FROM users WHERE role = ? ORDER BY name',
                ['staff']
            );
            console.log('/api/analytics: allStaffRows count', allStaffRows.length, 'accepted list count', staffList.length);
            
            connection.release();
            
            const stats = statsRows[0] || {};
            const avgResolutionHours = resolutionTime[0]?.avgHours || 0;
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: {
                    summary: {
                        total: stats.total || 0,
                        completed: stats.completed || 0,
                        pending: stats.pending || 0,
                        inprogress: stats.inprogress || 0,
                        awaitingapproval: stats.awaitingapproval || 0,
                        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
                        avgResolutionHours: Math.round(avgResolutionHours * 10) / 10
                    },
                    statusBreakdown: statusBreakdown || [],
                    perBranch: perBranch || [],
                    perStaff: perStaff || [],
                    timeSeries: timeSeries || [],
                    filters: {
                        branches: branches.map(b => b.branch),
                        // combine full staff roster with those who have accepted tickets
                        staff: Array.from(new Set([
                            ...allStaffRows.map(s => s.name),
                            ...staffList.map(s => s.accepted_by)
                        ]))
                    }
                }
            }));
        } catch (err) {
            console.error('Error fetching analytics:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // API Routes for dashboard stats
    if (pathname === '/api/stats' && req.method === 'GET') {
        try {
            const connection = await pool.getConnection();
            
            // Get user role and department from headers for filtering
            const userRole = (req.headers['x-user-role'] || '').toLowerCase();
            const userDepartment = (req.headers['x-user-department'] || '').trim();
            
            // Build department filter if not admin or super_admin
            let deptFilter = '';
            let params = [];
            if (userRole !== 'super_admin' && userRole !== 'admin' && userDepartment) {
                // Map department to categories
                const categoryToDept = {
                    'Accounting Concerns': 'Accounting',
                    'Marketing Concerns': 'Marketing',
                    'Administrative Concerns': 'Administrative',
                    'Human Resource Concerns': 'Human Resource',
                    'IT Concerns': 'MIS',
                    'Operational Concerns': 'Operations'
                };
                const deptCategories = Object.entries(categoryToDept)
                    .filter(([,dept]) => dept.toLowerCase() === userDepartment.toLowerCase())
                    .map(([cat]) => cat);
                
                if (deptCategories.length > 0) {
                    deptFilter = ' WHERE category IN (' + deptCategories.map(() => '?').join(',') + ')';
                    params = deptCategories;
                }
            }
            
            const ticketQuery = 'SELECT status, COUNT(*) as count FROM tickets' + deptFilter + ' GROUP BY status';
            const [rows] = params.length > 0 
                ? await connection.execute(ticketQuery, params)
                : await connection.execute(ticketQuery);

            // additionally gather joborder stats
            const [jobRows] = await connection.execute('SELECT status, COUNT(*) as count FROM joborders GROUP BY status');
            const [perStaff] = await connection.execute(
                `SELECT s.id AS staffId, u.email AS userEmail,
                        COUNT(j.id) AS total,
                        SUM(j.status='done') AS doneCount,
                        SUM(j.status='accepted') AS acceptedCount
                 FROM joborders j
                 JOIN staff s ON j.staffId = s.id
                 JOIN users u ON s.userId = u.id
                 GROUP BY s.id, u.email`
            );

            connection.release();

            const stats = {
                total: 0,
                completed: 0,
                pending: 0,
                inprogress: 0,
                joborders: {
                    total: 0,
                    accepted: 0,
                    done: 0
                },
                perStaff: perStaff || []
            };

            if (rows) {
                rows.forEach(row => {
                    stats.total += row.count;
                    if (row.status.toLowerCase() === 'completed') stats.completed = row.count;
                    if (row.status.toLowerCase() === 'pending') stats.pending = row.count;
                    if (row.status.toLowerCase() === 'inprogress') stats.inprogress = row.count;
                });
            }
            if (jobRows) {
                jobRows.forEach(r => {
                    stats.joborders.total += r.count;
                    if (r.status.toLowerCase() === 'accepted') stats.joborders.accepted = r.count;
                    if (r.status.toLowerCase() === 'done') stats.joborders.done = r.count;
                });
            }

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: stats }));
        } catch (err) {
            console.error('Error fetching stats:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // API to ensure a staff record exists and return the staff id
    // Get user details by email
    if (pathname === '/api/user/details' && req.method === 'GET') {
        try {
            const email = parsedUrl.query && parsedUrl.query.email ? String(parsedUrl.query.email).toLowerCase().trim() : null;
            if (!email) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'email query parameter required' }));
                return;
            }
            const connection = await pool.getConnection();
            const [rows] = await connection.execute('SELECT id, email, first_name, last_name FROM users WHERE LOWER(email) = ? LIMIT 1', [email]);
            connection.release();
            
            if (rows && rows.length > 0) {
                const user = rows[0];
                const firstName = user.first_name || '';
                const lastName = user.last_name || '';
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, email: user.email, firstName, lastName }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, message: 'User not found' }));
            }
        } catch (e) {
            console.error('Error in /api/user/details', e);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Server error' }));
        }
        return;
    }

    if (pathname === '/api/staff' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body || '{}');
                const userId = data.userId;
                const firstName = (data.firstName || '').trim() || null;
                const lastName = (data.lastName || '').trim() || null;
                if (!userId) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'userId required' }));
                    return;
                }
                const connection = await pool.getConnection();
                // check existing
                const [rows] = await connection.execute('SELECT id, firstName, lastName FROM staff WHERE userId = ? LIMIT 1', [userId]);
                let staffId;
                let existingFirst = null;
                let existingLast = null;
                if (rows && rows.length > 0) {
                    staffId = rows[0].id;
                    existingFirst = rows[0].firstName || null;
                    existingLast = rows[0].lastName || null;
                    // if names provided in request and missing in DB, update
                    if ((firstName && !existingFirst) || (lastName && !existingLast)) {
                        const updFields = [];
                        const updParams = [];
                        if (firstName && !existingFirst) { updFields.push('firstName = ?'); updParams.push(firstName); }
                        if (lastName && !existingLast) { updFields.push('lastName = ?'); updParams.push(lastName); }
                        if (updFields.length > 0) {
                            updParams.push(staffId);
                            await connection.execute(`UPDATE staff SET ${updFields.join(', ')} WHERE id = ?`, updParams);
                        }
                    }
                } else {
                    const [ins] = await connection.execute('INSERT INTO staff (userId, firstName, lastName) VALUES (?, ?, ?)', [userId, firstName, lastName]);
                    staffId = ins.insertId;
                }
                connection.release();
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, staffId, firstName: firstName || existingFirst, lastName: lastName || existingLast }));
            } catch (e) {
                console.error('Error in /api/staff', e);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }

    // Joborder CRUD endpoints
    if (pathname === '/api/joborders' && req.method === 'GET') {
        try {
            const connection = await pool.getConnection();
            const staffFilter = parsedUrl.query && parsedUrl.query.staffId ? ' WHERE staffId = ?' : '';
            const params = staffFilter ? [parsedUrl.query.staffId] : [];
            const [rows] = await connection.execute('SELECT * FROM joborders' + staffFilter, params);
            connection.release();
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: rows }));
        } catch (err) {
            console.error('Error fetching joborders:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    if (pathname === '/api/joborders' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { staffId, ticketId, description, status } = data;
                if (!staffId) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'staffId required' }));
                    return;
                }
                const connection = await pool.getConnection();
                const [result] = await connection.execute(
                    'INSERT INTO joborders (staffId, ticketId, description, status) VALUES (?, ?, ?, ?)',
                    [staffId, ticketId || null, description || null, status || 'accepted']
                );
                await connection.execute(
                    'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                    [null, 'Created joborder', 'joborder', result.insertId, JSON.stringify({ staffId, ticketId, status }), getClientIp(req)]
                );
                connection.release();
                res.writeHead(201);
                res.end(JSON.stringify({ success: true, id: result.insertId }));
            } catch (e) {
                console.error('Error creating joborder:', e);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }

    if (pathname.startsWith('/api/joborders/') && req.method === 'PUT') {
        const parts = pathname.split('/');
        const jId = parts[3];
        if (!jId) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Joborder id missing' }));
            return;
        }
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const fields = [];
                const params = [];
                if (data.status) { fields.push('status = ?'); params.push(data.status); }
                if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
                if (data.ticketId !== undefined) { fields.push('ticketId = ?'); params.push(data.ticketId); }
                if (fields.length === 0) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'No fields to update' }));
                    return;
                }
                params.push(jId);
                const connection = await pool.getConnection();
                await connection.execute(`UPDATE joborders SET ${fields.join(', ')} WHERE id = ?`, params);
                await connection.execute(
                    'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                    [null, 'Updated joborder', 'joborder', jId, JSON.stringify(data), getClientIp(req)]
                );
                connection.release();
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                console.error('Error updating joborder:', e);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }

    // Debug: list users (local dev only)
    if (pathname === '/debug/users' && req.method === 'GET') {
        try {
            const connection = await pool.getConnection();
            // ensure contactNumber and department columns exist for debugging output
            try {
                await connection.execute('ALTER TABLE users ADD COLUMN contactNumber VARCHAR(50) DEFAULT ""');
            } catch(e) { /* ignore if already exists */ }
            try {
                await connection.execute('ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT ""');
            } catch(e) { /* ignore if already exists */ }
            const [rows] = await connection.execute('SELECT id, email, password, displayName, role, contactNumber, department FROM users');
            connection.release();
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: rows }));
        } catch (err) {
            console.error('Error fetching users:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // List users (optionally filter by role) for admin
    if (pathname === '/api/users' && req.method === 'GET') {
        try {
            const roleFilter = parsedUrl.query && parsedUrl.query.role ? parsedUrl.query.role.toLowerCase() : null;
            const connection = await pool.getConnection();
            let sql = 'SELECT id, first_name, last_name, email, password, role, department FROM users';
            const params = [];
            if (roleFilter) {
                sql += ' WHERE LOWER(role) = ?';
                params.push(roleFilter);
            }
            sql += ' ORDER BY email';
            const [rows] = await connection.execute(sql, params);
            connection.release();
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: rows }));
        } catch (err) {
            console.error('Error listing users:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }

    // Create new user (admin interface)
    // ⚠️ RESTRICTED TO SUPER_ADMIN ROLE ONLY - enforce user role check here
    if (pathname === '/api/users' && req.method === 'POST') {
        // Authorization check
        if (!isSuperAdmin(req)) {
            return rejectUnauthorized(res, 'Only super admins can create users');
        }
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                let firstName = (data.first_name || data.firstName || '').trim();
                let lastName = (data.last_name || data.lastName || '').trim();
                let contact = (data.contact_number || data.contactNumber || '').trim();
                const department = (data.department || '').trim();
                const email = (data.email || '').trim().toLowerCase();
                const role = (data.role || 'staff').toLowerCase();
                
                // validate Philippine mobile number: 11 digits starting with 0
                if (contact && !/^0\d{10}$/.test(contact)) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Invalid contact number format' }));
                    return;
                }
                
                // Capitalize first letter of first and last name
                firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
                
                if (!firstName || !lastName || !email || !role) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Missing fields' }));
                    return;
                }
                // add contactNumber and department columns if not present
                const connection = await pool.getConnection();
                try {
                    await connection.execute('ALTER TABLE users ADD COLUMN contactNumber VARCHAR(50) DEFAULT ""');
                } catch(e) {}
                try {
                    await connection.execute('ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT ""');
                } catch(e) {}
                const displayName = firstName + ' ' + lastName;
                const tempPassword = lastName + '.123';
                const hash = await bcrypt.hash(tempPassword, 10);
                await connection.execute(
                    'INSERT INTO users (email, password, displayName, first_name, last_name, role, contactNumber, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [email, hash, displayName, firstName, lastName, role, contact, department]
                );
                connection.release();
                // audit user creation
                try {
                    const ip = getClientIp(req);
                    await pool.execute(
                        'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                        [email, 'Created user', 'user', null, JSON.stringify({ role }), ip]
                    );
                } catch(audErr) {
                    console.error('Failed to log audit for new user:', audErr);
                }

                res.writeHead(200);
                res.end(JSON.stringify({ success: true, tempPassword }));
            } catch (err) {
                console.error('Error creating user:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Database error' }));
            }
        });
        return;
    }

    // Change password for a user
    if (pathname === '/api/change-password' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const email = (data.email || '').trim().toLowerCase();
                // support either field name
                const oldPassword = data.oldPassword || data.currentPassword || '';
                const newPassword = data.newPassword || '';
                if (!email || !oldPassword || !newPassword) {
                    console.warn('/api/change-password missing', { email, oldPasswordExists: !!oldPassword, newPasswordExists: !!newPassword });
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Missing fields' }));
                    return;
                }
                const connection = await pool.getConnection();
                const [rows] = await connection.execute('SELECT password FROM users WHERE email = ? LIMIT 1', [email]);
                if (!rows || rows.length === 0) {
                    connection.release();
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, message: 'User not found' }));
                    return;
                }
                const user = rows[0];
                const match = await bcrypt.compare(oldPassword, user.password);
                if (!match) {
                    connection.release();
                    res.writeHead(401);
                    res.end(JSON.stringify({ success: false, message: 'Incorrect current password' }));
                    return;
                }
                const newHash = await bcrypt.hash(newPassword, 10);
                await connection.execute('UPDATE users SET password = ? WHERE email = ?', [newHash, email]);
                connection.release();
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('Error changing password:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }

    // Reset staff password to lastname123
    if (pathname === '/api/staff/reset-password' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                console.log('Reset-password request data', data);
                const email = (data.email || '').trim().toLowerCase();
                if (!email) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Email required' }));
                    return;
                }
                const connection = await pool.getConnection();
                const [rows] = await connection.execute('SELECT last_name FROM users WHERE email = ? LIMIT 1', [email]);
                if (!rows || rows.length === 0) {
                    connection.release();
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, message: 'User not found' }));
                    return;
                }
                const lastName = rows[0].last_name || '';
                const newPass = (lastName + '123').toLowerCase();
                const hash = await bcrypt.hash(newPass, 10);
                await connection.execute('UPDATE users SET password = ? WHERE email = ?', [hash, email]);
                connection.release();
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'Password reset', newPassword: newPass }));
            } catch (err) {
                console.error('Error resetting password:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }

    // Handle POST requests to /php/login.php - verify user exists in DB
    if (req.method === 'POST' && req.url === '/php/login.php') {
        try {
            // collect body
            const body = await new Promise((resolve, reject) => {
                let data = '';
                req.on('data', chunk => data += chunk.toString());
                req.on('end', () => resolve(data));
                req.on('error', err => reject(err));
            });

            const params = new URLSearchParams(body);
            const email = (params.get('email') || '').trim();
            const password = params.get('password') || '';

            if (!email || !password) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Email and password are required' }));
                return;
            }

            // Lookup user in database
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.execute('SELECT id, email, password, displayName, role, department, isVerified FROM users WHERE email = ? LIMIT 1', [email]);
                console.log(`[LOGIN] Email: ${email}, Password: ${password}`);
                console.log(`[LOGIN] User found: ${rows && rows.length > 0}`);
                
                if (!rows || rows.length === 0) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
                    return;
                }

                const user = rows[0];
                console.log(`[LOGIN] User object from DB:`, JSON.stringify(user));
                console.log(`[LOGIN] User role: ${user.role}, User department: ${user.department}`);
                console.log(`[LOGIN] Stored hash: ${user.password.substring(0, 20)}...`);

                // Support legacy plain-text passwords: if stored password is not a bcrypt hash,
                // compare directly and re-hash on successful match.
                let match = false;
                const stored = user.password || '';
                const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$') || stored.startsWith('$2$');
                console.log(`[LOGIN] Looks hashed: ${looksHashed}`);

                if (looksHashed) {
                    console.log(`[LOGIN] Comparing bcrypt...`);
                    match = await bcrypt.compare(password, stored);
                    console.log(`[LOGIN] Bcrypt match: ${match}`);
                } else {
                    // legacy: plain-text stored password
                    if (password === stored) {
                        // re-hash and update record
                        try {
                            const newHash = await bcrypt.hash(password, 10);
                            await connection.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
                            console.log(`Upgraded password hash for user ${user.email}`);
                        } catch (e) {
                            console.warn('Failed to upgrade password hash:', e);
                        }
                        match = true;
                    }
                }

                if (!match) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
                    return;
                }

                // Check if email is verified
                if (!user.isVerified) {
                    res.writeHead(200);
                    res.end(JSON.stringify({ 
                        success: true, 
                        requiresVerification: true,
                        message: 'Email verification required',
                        user: { id: user.id, email: user.email, department: user.department }
                    }));
                    return;
                }

                // Successful login
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'Login successful', user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, department: user.department } }));
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Login error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Server error' }));
        }
        return;
    }
    // Send verification code endpoint
    else if (req.method === 'POST' && req.url === '/api/send-verification-code') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            let connection;
            try {
                const params = new URLSearchParams(body);
                const email = (params.get('email') || '').trim().toLowerCase();

                if (!email) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Email is required' }));
                    return;
                }

                connection = await pool.getConnection();

                // Ensure user exists; if not, create a placeholder user with a random password
                const [rows] = await connection.execute('SELECT id, isVerified FROM users WHERE email = ? LIMIT 1', [email]);
                let userId = null;
                let isVerified = false;

                if (rows && rows.length > 0) {
                    userId = rows[0].id;
                    isVerified = !!rows[0].isVerified;
                } else {
                    // create user with random password hash
                    const crypto = require('crypto');
                    const tempPass = crypto.randomBytes(16).toString('hex');
                    const hash = await bcrypt.hash(tempPass, 10);
                    const [result] = await connection.execute(
                        'INSERT INTO users (email, password, displayName, role, isVerified) VALUES (?, ?, ?, ?, ?)',
                        [email, hash, '', 'user', 0]
                    );
                    userId = result.insertId;
                    isVerified = false;
                    console.log(`[VERIFY] Created placeholder user id=${userId} for ${email}`);
                }

                // Generate 6-digit code, even if the address has been verified previously.
                // The client-side ticket flow should always require entry of an email and a
                // fresh verification code so that users can switch addresses if they need to.
                const code = Math.floor(100000 + Math.random() * 900000).toString();

                // Store code with expiry time (existing structure used by verify-email endpoint)
                verificationCodes[email] = {
                    code: code,
                    expiresAt: Date.now() + VERIFICATION_EXPIRY,
                    userId: userId
                };

                console.log(`[VERIFY] Generated code for ${email}: ${code} (alreadyVerified=${isVerified})`);

                // respond with success; include alreadyVerified flag so callers still know the
                // existing verification state if they care.
                // we do NOT return early here; downstream mail-sending logic will run below.
                // Try to send email if configured
                if (emailConfig.enabled && emailTransporter) {
                    try {
                        await emailTransporter.sendMail({
                            from: emailConfig.from,
                            to: email,
                            subject: 'Email Verification Code',
                            html: `
                                <h2>Email Verification</h2>
                                <p>Your verification code is:</p>
                                <h1 style="color: #003f8f; letter-spacing: 5px;">${code}</h1>
                                <p style="color: #666;">This code will expire in 5 minutes.</p>
                                <p style="color: #666;">Do not share this code with anyone.</p>
                            `
                        });
                        console.log(`[VERIFY] Sent verification code to ${email}`);
                    } catch (emailErr) {
                        console.error('Failed to send email:', emailErr);
                    }
                } else {
                    console.log('[VERIFY] Email not configured - code stored in memory');
                }

                // Send ONE response after all async work completes
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    success: true, 
                    alreadyVerified: isVerified,
                    userId,
                    code: (!emailConfig.enabled || !emailTransporter) ? code : undefined
                }));
            } catch (error) {
                console.error('Error sending verification code:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            } finally {
                if (connection) connection.release();
            }
        });
        return;
    }
    // Verify code and mark email as verified endpoint
    else if (req.method === 'POST' && req.url === '/api/verify-email') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            let connection;
            try {
                const params = new URLSearchParams(body);
                const email = (params.get('email') || '').trim().toLowerCase();
                const code = (params.get('code') || '').trim();

                if (!email || !code) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Email and code are required' }));
                    return;
                }

                // Check if code exists and hasn't expired
                const stored = verificationCodes[email];
                if (!stored) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'No verification code found. Request a new one.' }));
                    return;
                }

                if (Date.now() > stored.expiresAt) {
                    delete verificationCodes[email];
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Verification code expired. Request a new one.' }));
                    return;
                }

                if (stored.code !== code) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Incorrect verification code' }));
                    return;
                }

                // Code is valid - mark email as verified in database
                connection = await pool.getConnection();
                try {
                    // Ensure user exists (should exist since send endpoint creates placeholder)
                    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
                    if (rows && rows.length > 0) {
                        const userId = rows[0].id;
                        await connection.execute('UPDATE users SET isVerified = true WHERE id = ?', [userId]);
                    } else {
                        // create and mark verified (fallback)
                        const tempHash = await bcrypt.hash('temp' + Date.now(), 10);
                        await connection.execute('INSERT INTO users (email, password, displayName, role, isVerified) VALUES (?, ?, ?, ?, ?)', [email, tempHash, '', 'user', 1]);
                    }

                    // Clean up code
                    delete verificationCodes[email];

                    console.log(`[VERIFY] Email verified for ${email}`);

                    res.writeHead(200);
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Email verified successfully'
                    }));
                } finally {
                    connection.release();
                }
            } catch (error) {
                console.error('Error verifying email:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }
    // Handle ticket email sending
    else if (req.method === 'POST' && req.url === '/send-ticket-email') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const ticketData = JSON.parse(body);
                
                // For now, just log the ticket
                console.log('Ticket email request:', ticketData);
                
                // TODO: Configure email sending when SMTP credentials are available
                // If email service is enabled, send email
                if (emailConfig.enabled) {
                    sendTicketEmail(ticketData, (err, result) => {
                        if (err) {
                            res.writeHead(500);
                            res.end(JSON.stringify({ success: false, message: 'Failed to send email' }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ success: true, message: 'Email sent successfully' }));
                        }
                    });
                } else {
                    // Email service not configured, but ticket is created
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: false, message: 'Email service not configured. Ticket created but no confirmation email sent.' }));
                }
            } catch (error) {
                console.error('Error processing ticket email:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
    } 
    // API Routes for notifications
    else if (pathname === '/api/notifications' && req.method === 'GET') {
        console.log('GET /api/notifications called');
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.execute('SELECT * FROM notifications ORDER BY createdAt DESC');
            connection.release();

            // Apply department-based filtering for staff/admin users
            // Super admin and admin see all notifications
            const userRole = (req.headers['x-user-role'] || '').toLowerCase();
            const userDepartment = (req.headers['x-user-department'] || '').trim();
            console.log('[Notifications] User role:', userRole, 'User department:', userDepartment);
            
            let filteredNotifications = rows;
            if (userRole !== 'super_admin' && userRole !== 'admin' && userDepartment) {
                console.log('[Notifications] APPLYING FILTER - Filtering for user with department:', userDepartment);
                const categoryMap = getCategoryToDepartmentMap();
                const before = rows.length;
                filteredNotifications = rows.filter(notification => {
                    // Get the department from notification's category field
                    const notifDept = categoryMap[notification.category] || notification.category || '';
                    const matches = notifDept && notifDept.toLowerCase() === userDepartment.toLowerCase();
                    if (before <= 15 || matches) { // Log first 15 or when matches
                        console.log('[Notifications] Notification id:', notification.id, 'category:', notification.category, 'mapped dept:', notifDept, 'matches user dept:', matches);
                    }
                    return matches;
                });
                console.log('[Notifications] RESULT: Filtered from', before, 'to', filteredNotifications.length, 'notifications');
            } else {
                console.log('[Notifications] NO FILTER APPLIED - returning all', rows.length, 'notifications');
            }

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: filteredNotifications || [] }));
        } catch (err) {
            if (connection) connection.release();
            console.error('Error fetching notifications:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Database error' }));
        }
        return;
    }
    else if (pathname === '/api/notifications' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { ticketId, staffId, staffName, category, branch, description } = data;
                
                if (!ticketId || !staffId || !staffName || !description) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Missing required fields' }));
                    return;
                }

                const connection = await pool.getConnection();
                const [result] = await connection.execute(
                    'INSERT INTO notifications (ticketId, staffId, staffName, category, branch, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [ticketId, staffId, staffName, category || '', branch || '', description, 'pending']
                );
                await connection.execute(
                    'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                    [null, 'Created notification', 'notification', result.insertId, JSON.stringify({ ticketId, staffId, staffName }), getClientIp(req)]
                );
                connection.release();

                res.writeHead(201);
                res.end(JSON.stringify({ success: true, id: result.insertId }));
            } catch (error) {
                console.error('Error creating notification:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }
    else if (pathname.startsWith('/api/notifications/') && req.method === 'PUT') {
        const parts = pathname.split('/');
        const notificationId = parts[3];
        if (!notificationId) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'Notification id missing' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { status } = data; // 'approved' or 'rejected'
                
                if (!status || !['approved', 'rejected'].includes(status)) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Invalid status. Must be approved or rejected' }));
                    return;
                }

                const connection = await pool.getConnection();
                
                // Get notification details first
                const [notifRows] = await connection.execute('SELECT * FROM notifications WHERE id = ?', [notificationId]);
                if (!notifRows || notifRows.length === 0) {
                    connection.release();
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, message: 'Notification not found' }));
                    return;
                }
                
                const notification = notifRows[0];
                
                // Update notification status
                await connection.execute('UPDATE notifications SET status = ? WHERE id = ?', [status, notificationId]);
                
                // If approved, update ticket status to completed
                if (status === 'approved') {
                    await connection.execute('UPDATE tickets SET status = ? WHERE id = ?', ['completed', notification.ticketId]);
                }
                
                connection.release();
                
                // audit notification approval/rejection
                try {
                    await connection.execute(
                        'INSERT INTO auditLog (userEmail, action, entityType, entityId, details, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
                        [null, `Notification ${status}`, 'notification', notificationId, JSON.stringify({ ticketId: notification.ticketId }), getClientIp(req)]
                    );
                } catch (auditErr) {
                    console.error('Failed to log notification action:', auditErr);
                }

                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('Error updating notification:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
        return;
    }
    // Track ticket endpoint (public, no auth required)
    else if (pathname === '/api/track-ticket' && req.method === 'GET') {
        try {
            const ticketId = parsedUrl.query.ticket_id;
            if (!ticketId) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Ticket ID required' }));
                return;
            }

            const connection = await pool.getConnection();
            const [rows] = await connection.execute('SELECT id, ticket_number, customer_name, email, branch, department, category, description, status, created_at, updated_at, accepted_by, accepted_at, completed_at FROM tickets WHERE ticket_number = ? OR id = ? LIMIT 1', [ticketId, ticketId]);
            connection.release();

            if (rows.length === 0) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: false, message: 'Ticket not found' }));
                return;
            }

            const ticket = rows[0];
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, ticket: {
                id: ticket.id,
                ticket_number: ticket.ticket_number || ticket.ticket_id || ticket.id,
                customer_name: ticket.customer_name || ticket.customerName || '',
                email: ticket.email || '',
                branch: ticket.branch || '',
                department: ticket.department || '',
                category: ticket.category || '',
                description: ticket.description || '',
                status: ticket.status || '',
                accepted_by: ticket.accepted_by || ticket.acceptedBy || null,
                accepted_at: ticket.accepted_at || ticket.acceptedAt || null,
                completed_at: ticket.completed_at || ticket.completedAt || null,
                created_at: ticket.created_at || ticket.createdAt || null,
                updated_at: ticket.updated_at || ticket.updatedAt || null
            } }));
        } catch (error) {
            console.error('Error tracking ticket:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: 'Server error' }));
        }
        return;
    }
    else {
        // 404 for other routes
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Not found' }));
    }
});

// Function to send ticket confirmation email
function sendTicketEmail(ticketData, callback) {
    // This function uses nodemailer (needs to be installed: npm install nodemailer)
    // Uncomment and configure when ready to use
    
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
        service: emailConfig.service,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        }
    });
    
    const emailContent = `
        <h2>Support Ticket Confirmation</h2>
        <p>Dear ${ticketData.firstName} ${ticketData.lastName},</p>
        <p>Your support ticket has been created successfully.</p>
        <hr>
        <h3>Ticket Details:</h3>
        <ul>
            <li><strong>Ticket ID:</strong> ${ticketData.ticketId}</li>
            <li><strong>Created:</strong> ${ticketData.createdAt}</li>
            <li><strong>Post Office Branch:</strong> ${ticketData.branch}</li>
            <li><strong>Department:</strong> ${ticketData.department}</li>
        </ul>
        <h3>Your Issue:</h3>
        <p>${ticketData.problem}</p>
        <hr>
        <p>Our support team will review your ticket and get back to you soon.</p>
        <p>Please keep your ticket ID for reference: <strong>${ticketData.ticketId}</strong></p>
        <p>Best regards,<br>Post Office Management Information System</p>
    `;
    
    const mailOptions = {
        from: emailConfig.from,
        to: ticketData.email,
        subject: `Support Ticket Created - ${ticketData.ticketId}`,
        html: emailContent
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Email error:', error);
            callback(error, null);
        } else {
            console.log('Email sent:', info.response);
            callback(null, info);
        }
    });
    */
    
    // Placeholder - email sending not configured
    callback(null, { message: 'Email service not configured' });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const host = process.env.HOST || 'localhost';
    console.log(`Server running at http://${host}:${PORT}/`);
    console.log('Ready to handle login requests and ticket creation!');
});
