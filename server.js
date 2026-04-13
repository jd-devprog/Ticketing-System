const http = require('http');
const url = require('url');
const querystring = require('querystring');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const express = require('express');
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

const app = express();
    // Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    const host = process.env.HOST || 'localhost';
    console.log(`Server running at http://${host}:${PORT}/`);
    console.log('Ready to handle login requests and ticket creation!');
});
