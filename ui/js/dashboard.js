console.log('dashboard.js loaded');
const API_BASE = 'http://localhost:8000';

// Helper function to get user role from localStorage
function getUserRole() {
    try {
        const user = JSON.parse(window.localStorage.getItem('user') || '{}');
        const role = user.role || 'user';
        console.log('[Dashboard.js] UserRole from localStorage:', role, '| Full user obj:', user);
        return role;
    } catch (e) {
        console.error('[Dashboard.js] Error reading user role:', e);
        return 'user';
    }
}

// Helper to get user department from localStorage
function getUserDepartment() {
    try {
        const user = JSON.parse(window.localStorage.getItem('user') || '{}');
        const dept = user.department || '';
        console.log('[Dashboard.js] UserDepartment from localStorage:', dept);
        return dept;
    } catch (e) {
        console.error('[Dashboard.js] Error reading department:', e);
        return '';
    }
}

// Helper to add authorization headers for restricted endpoints
function getRestrictedHeaders() {
    const role = getUserRole();
    const dept = getUserDepartment();
    const headers = {
        'Content-Type': 'application/json',
        'x-user-role': role,
        'x-user-department': dept
    };
    console.log('[Dashboard.js] Sending headers:', headers);
    return headers;
}

async function showResetConfirmModal(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        const modal = document.getElementById('resetConfirmModal');
        if (!modal) {
            console.warn('resetConfirmModal not found, fallback to native confirm');
            resolve(window.confirm(message));
            return;
        }

        const titleElm = document.getElementById('resetConfirmTitle');
        const messageElm = document.getElementById('resetConfirmMessage');
        const confirmBtn = document.getElementById('resetAcceptBtn');
        const cancelBtn = document.getElementById('resetDeclineBtn');
        const closeBtn = document.getElementById('resetConfirmClose');
        const backdrop = modal.querySelector('.modal-backdrop');

        titleElm.textContent = title;
        messageElm.textContent = message;

        const cleanup = () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden','true');
            document.removeEventListener('keydown', onKeydown);
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            closeBtn.onclick = null;
            backdrop.onclick = null;
        };

        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        const onKeydown = (e) => { if (e.key === 'Escape') onCancel(); };

        confirmBtn.onclick = onConfirm;
        cancelBtn.onclick = onCancel;
        closeBtn.onclick = onCancel;
        backdrop.onclick = onCancel;
        document.addEventListener('keydown', onKeydown);

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden','false');
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    // verify user role; redirect staff to their portal
    let stored;
    try { stored = JSON.parse(window.localStorage.getItem('user') || '{}'); } catch(e){ stored = {}; }
    if (stored && stored.role === 'staff') {
        // if somehow a staff user ends up here, redirect to separate portal
        window.location.href = '/ui/staff.html';
        return;
    }
    if (stored && stored.role === 'admin') {
        // if an admin user ends up here by mistake, redirect to admin portal
        console.log('Admin user redirected to admin.html');
        window.location.href = '/ui/admin.html';
        return;
    }
    
    // Ensure user has department field - fetch from server if missing
    if (stored && stored.email && !stored.department) {
        console.log('User missing department - fetching from server');
        try {
            const res = await fetch(`${API_BASE}/api/user/details?email=${encodeURIComponent(stored.email)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user && data.user.department) {
                    stored.department = data.user.department;
                    console.log('Fetched department from server:', stored.department);
                    localStorage.setItem('user', JSON.stringify(stored));
                }
            }
        } catch (e) {
            console.warn('Could not fetch user department from server:', e);
        }
    }

    // hide the "Reports" link if we're not supposed to see analytics (e.g. staff users)
    // the menu is static in HTML so we remove it dynamically based on role
    const reportLink = document.querySelector('.nav-item[data-panel="Reports"]');
    if (reportLink && stored && stored.role === 'staff') {
        const li = reportLink.closest('li');
        if (li) li.remove();
    }

    // Get user email from session storage or localStorage
    const userEmail = sessionStorage.getItem('userEmail') || (stored && stored.email) || 'user@gmail.com';
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = userEmail;
    
    // Also update the profile dropdown name
    const profileNameEl = document.getElementById('profileName');
    if (profileNameEl) {
        profileNameEl.textContent = userEmail;
    }

    // Navigation and panel handling
    const navItems = document.querySelectorAll('.nav-item');
    const panels = {
        'Dashboard': document.getElementById('panel-dashboard'),
        'Tickets': document.getElementById('panel-tickets'),
        'Services': document.getElementById('panel-services'),
        'Reports': document.getElementById('panel-reports'),
        'Staff': document.getElementById('panel-Staff'),
        'Settings': document.getElementById('panel-settings')
    };

    // move any standalone report-only block into the reports panel body at runtime
    (function relocateReportBlock() {
        const reportBlock = document.querySelector('.report-only');
        const targetBody = document.querySelector('#panel-reports .panel-body');
        console.log('relocateReportBlock', reportBlock, '->', targetBody);
        if (reportBlock && targetBody && !targetBody.contains(reportBlock)) {
            targetBody.appendChild(reportBlock);
            console.log('reportBlock moved into reports panel');
        }
    })();

    function hideAllPanels() {
        Object.values(panels).forEach(p => p && p.classList.add('hidden'));
    }

    // populate staff table when panel shown
    async function loadStaffPanel() {
        const tbody = document.querySelector('#staffTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
        try {
            const res = await fetch(`${API_BASE}/api/users`);
            const data = await res.json();
            if (!data.success) throw new Error('Load failed');
            let users = data.data || [];
            // Filter to show only staff and admin users
            users = users.filter(u => {
                const role = (u.role || '').toLowerCase();
                return role === 'staff' || role === 'admin';
            });
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No staff or admin found</td></tr>';
                return;
            }
            tbody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                const role = (u.role || 'staff').toLowerCase();
                const roleBadge = role === 'admin' 
                    ? '<span style="background:#ff9800;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;font-size:12px;">ADMIN</span>'
                    : '<span style="background:#4caf50;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;font-size:12px;">Staff</span>';
                tr.innerHTML = `
                    <td>${u.first_name || ''}</td>
                    <td>${u.last_name || ''}</td>
                    <td>${u.email || ''}</td>
                    <td>${roleBadge}</td>
                    <td style="font-family:monospace;word-break:break-all;">${u.password || ''}</td>
                    <td><button class="reset-pass-btn btn-small" data-email="${u.email}">Reset</button></td>
                `;
                tbody.appendChild(tr);
            });
            // attach reset handlers
            tbody.querySelectorAll('.reset-pass-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const email = btn.getAttribute('data-email');
                    if (!email) return;
                    if (!await showResetConfirmModal(`Reset password for ${email}?`)) return;
                    try {
                        const r = await fetch(`${API_BASE}/api/staff/reset-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        });
                        const jd = await r.json();
                        if (jd.success) {
                            showToast('success','Done',`Password reset to ${jd.newPassword || 'lastname123'}`);
                            loadStaffPanel();
                        } else {
                            showToast('error','Error',jd.message||'Failed');
                        }
                    } catch(err){
                        console.error('reset error',err);
                        showToast('error','Error','Network');
                    }
                });
            });
        } catch(err) {
            console.error('Failed to load staff',err);
            tbody.innerHTML = '<tr><td colspan="6">Error loading</td></tr>';
        }
    }

    function showPanel(name) {
        console.log('showPanel called', name, 'report-only count before hide', document.querySelectorAll('.report-only').length);
        hideAllPanels();
        // hide any stray report-only sections by default
        document.querySelectorAll('.report-only').forEach(el => {
            el.classList.add('hidden');
        });
        console.log('report-only count after hide', document.querySelectorAll('.report-only').length);

        const panel = panels[name];
        if (panel) panel.classList.remove('hidden');
        // render dynamic content when switching
        if (name === 'Dashboard') loadDashboard();
        if (name === 'Tickets') renderTickets();
        if (name === 'Services') renderServices();
        if (name === 'Reports') {
            renderReports();
            // reveal report-only blocks when reports panel active
            document.querySelectorAll('.report-only').forEach(el => {
                el.classList.remove('hidden');
            });
        }
        if (name === 'Staff') loadStaffPanel();
        if (name === 'Settings') loadSettings();
    }

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const target = this.dataset.panel || this.textContent.trim();
            showPanel(target);
        });
    });

    // Ticket view button event delegation (table may be re-rendered)
    const ticketsTbody = document.querySelector('#ticketsTable tbody');
    if (ticketsTbody) {
        ticketsTbody.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('btn-view')) {
                const id = e.target.getAttribute('data-id');
                console.log('[ticket] view click', id);
                showTicketDetails(id);
            }
        });
    }

    // ticket modal close handlers (one-time setup)
    const ticketModal = document.getElementById('ticketViewModal');
    const ticketModalClose = document.getElementById('ticketViewClose');
    if (ticketModalClose) ticketModalClose.addEventListener('click', function(){
        ticketModal.classList.add('hidden'); 
        ticketModal.style.display = 'none';
        ticketModal.setAttribute('aria-hidden','true');
    });
    if (ticketModal) {
        ticketModal.addEventListener('click', function(e){
            if (e.target === ticketModal || e.target.classList.contains('modal-backdrop')) {
                ticketModal.classList.add('hidden'); 
                ticketModal.style.display = 'none';
                ticketModal.setAttribute('aria-hidden','true');
            }
        });
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && !ticketModal.classList.contains('hidden')) {
                ticketModal.classList.add('hidden'); 
                ticketModal.style.display = 'none';
                ticketModal.setAttribute('aria-hidden','true');
            }
        });
    }

    // Apply saved theme early
    function applyTheme(theme) {
        if (theme === 'dark') document.body.classList.add('theme-dark');
        else document.body.classList.remove('theme-dark');
        const tLabel = document.getElementById('themeLabel');
        if (tLabel) tLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }

    const savedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    const initialTheme = savedSettings.theme || localStorage.getItem('theme') || 'light';
    applyTheme(initialTheme);

    // Default view
    showPanel('Dashboard');

    // Profile dropdown and logout
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    // remove debug logging/style
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', e => {
            e.preventDefault();
            const hidden = profileDropdown.classList.toggle('hidden');
            profileBtn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
            // Close notification dropdown if open
            const notificationDropdown = document.getElementById('notificationDropdown');
            if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
                notificationDropdown.classList.add('hidden');
            }
        });
        document.addEventListener('click', e => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
                profileBtn.setAttribute('aria-expanded','false');
            }
        });
    }
    // debug log whenever panel switches or page reloads
    console.log('profileBtn in DOM?', document.getElementById('profileBtn'));
    const logoutBtn = document.getElementById('logoutMenuBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.localStorage.removeItem('user');
            window.location.href = 'http://localhost:8000/ui/index.html';
        });
    }

    // Notification dropdown
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', e => {
            e.preventDefault();
            const hidden = notificationDropdown.classList.toggle('hidden');
            notificationBtn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
            // Close profile dropdown if open
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
                profileBtn.setAttribute('aria-expanded','false');
            }
            // Load notifications when opening
            if (!hidden) {
                loadNotifications();
            }
        });
        document.addEventListener('click', e => {
            if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.add('hidden');
                notificationBtn.setAttribute('aria-expanded','false');
            }
        });
    }

    // ----- Dashboard Stats -----
    function loadDashboard() {
        loadStats();
        loadRecentTickets();
    }

    function loadNotifications() {
        const notificationList = document.querySelector('.notification-list');
        const notificationBadge = document.getElementById('notificationBadge');
        if (!notificationList) return;

        fetch(`${API_BASE}/api/notifications`, {
            method: 'GET',
            headers: getRestrictedHeaders()
        })
            .then(res => res.json())
            .then(data => {
                notificationList.innerHTML = '';

                if (data.success && Array.isArray(data.data)) {
                    // Filter to only show pending notifications
                    const pendingNotifications = data.data.filter(notification => notification.status === 'pending');
                    
                    // Update badge count
                    if (notificationBadge) {
                        if (pendingNotifications.length > 0) {
                            notificationBadge.textContent = pendingNotifications.length;
                            notificationBadge.style.display = 'flex';
                        } else {
                            notificationBadge.style.display = 'none';
                        }
                    }
                    
                    if (pendingNotifications.length > 0) {
                        pendingNotifications.forEach(notification => {
                        const item = document.createElement('div');
                        item.className = 'notification-item';
                        item.innerHTML = `
                            <div class="notification-content">
                                <strong>Accepted by: ${escapeHtml(notification.staffName || 'Unknown Staff')}</strong>
                                <p>${escapeHtml(notification.category || '')} - ${escapeHtml(notification.branch || '')}</p>
                                <small>${truncate(notification.description || '', 50)}</small>
                            </div>
                            <div class="notification-actions">
                                <button class="btn-approve-small" data-id="${notification.id}" data-ticket-id="${notification.ticketId}">✓</button>
                                <button class="btn-reject-small" data-id="${notification.id}" data-ticket-id="${notification.ticketId}">✗</button>
                                <button class="btn-view-small" data-id="${notification.id}" data-ticket-id="${notification.ticketId}">👁</button>
                            </div>
                        `;
                        notificationList.appendChild(item);
                    });

                    // Add event listeners for buttons
                    notificationList.querySelectorAll('.btn-approve-small').forEach(btn => {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const notificationId = this.getAttribute('data-id');
                            const ticketId = this.getAttribute('data-ticket-id');
                            handleNotificationAction(notificationId, ticketId, 'approved');
                        });
                    });

                    notificationList.querySelectorAll('.btn-reject-small').forEach(btn => {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const notificationId = this.getAttribute('data-id');
                            const ticketId = this.getAttribute('data-ticket-id');
                            handleNotificationAction(notificationId, ticketId, 'rejected');
                        });
                    });

                    notificationList.querySelectorAll('.btn-view-small').forEach(btn => {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const ticketId = this.getAttribute('data-ticket-id');
                            console.log('[notif] view clicked, ticketId=', ticketId);
                            showTicketDetails(ticketId);
                            // Close dropdown after viewing
                            notificationDropdown.classList.add('hidden');
                            notificationBtn.setAttribute('aria-expanded','false');
                        });
                    });
                    } else {
                        notificationList.innerHTML = '<div class="no-notifications">No pending notifications</div>';
                    }
                } else {
                    notificationList.innerHTML = '<div class="no-notifications">Error loading notifications</div>';
                }
            })
            .catch(err => {
                console.error('Error loading notifications:', err);
                notificationList.innerHTML = '<div class="no-notifications">Error loading notifications</div>';
            });
    }

    function handleNotificationAction(notificationId, ticketId, action) {
        fetch(`${API_BASE}/api/notifications/${notificationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Success', `Ticket ${action}`);
                loadNotifications(); // Refresh the notifications
                loadDashboard(); // Refresh stats
            } else {
                showToast('error', 'Error', data.message || 'Failed to process notification');
            }
        })
        .catch(err => {
            console.error('Error processing notification:', err);
            showToast('error', 'Error', 'Network error');
        });
    }

    function loadStats() {
        fetch(`${API_BASE}/api/stats`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    const stats = data.data;
                    const cards = document.querySelectorAll('#statsContainer .stat-card');
                    if (cards.length >= 4) {
                        cards[0].querySelector('.stat-number').textContent = stats.total || 0;
                        cards[1].querySelector('.stat-number').textContent = stats.pending || 0;
                        cards[2].querySelector('.stat-number').textContent = stats.inprogress || 0;
                        cards[3].querySelector('.stat-number').textContent = stats.completed || 0;
                    }

                }
            })
            .catch(err => console.error('Error loading stats:', err));
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function truncate(s, n) {
        if (!s) return '';
        s = String(s);
        return s.length > n ? s.slice(0, n - 1) + '…' : s;
    }

    function showToast(type, title, message, timeout = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<div class="t-title">${title}</div><div class="t-msg">${message}</div>`;
        container.appendChild(toast);
        // show animation
        setTimeout(() => toast.classList.add('show'), 10);
        const remove = () => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 220);
        };
        setTimeout(remove, timeout);
    }

    function getSubmitterName(t) {
        if (!t || typeof t !== 'object') return '';
        const first = t.firstName || t.first_name || t.firstname || t.fname || '';
        const last = t.lastName || t.last_name || t.lastname || t.lname || '';
        if (first || last) return (first + ' ' + last).trim();
        if (t.customer_name) return String(t.customer_name);
        if (t.customerName) return String(t.customerName);
        if (t.customer) return String(t.customer);
        if (t.name) return String(t.name);
        if (t.submitter) return String(t.submitter);
        if (t.submittedBy) return String(t.submittedBy);
        if (t.requesterName) return String(t.requesterName);
        const email = t.email || t.userEmail || t.requesterEmail || t.submitted_email || '';
        if (email && typeof email === 'string') {
            const p = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\d+/g, '').trim();
            if (p) return p.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        return '';
    }

    async function loadRecentTickets() {
        await syncOfflineUpdates();
        const tbody = document.querySelector('#recentTicketsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        try {
            const res = await fetch(`${API_BASE}/api/tickets`, {
                method: 'GET',
                headers: getRestrictedHeaders()
            });
            const data = await res.json();
            if (data && Array.isArray(data.data)) {
                data.data.slice(0, 5).forEach(t => {
                    const tr = document.createElement('tr');
                    const status = (t.status || '').toString() || 'Pending';
                    const statusClass = status.toLowerCase().replace(/\s+/g, '') || 'pending';
                    const ticketId = t.ticket_id || t.ticketId || t.ticket_number || (t.id || '');
                    const submitter = getSubmitterName(t) || '';
                    const service = t.serviceName || t.service_name || t.service || '';
                    const category = t.category || '';
                    const description = t.description || t.desc || t.details || t.note || '';
                    const numericId = t.id || ticketId || null;
                    tr.innerHTML = `
                        <td>#${ticketId}</td>
                        <td>${submitter}</td>
                        <td>${category}</td>
                        <td title="${escapeHtml(String(description))}">${truncate(description, 60)}</td>
                        <td><span class="status ${statusClass}">${status}</span></td>
                        <td class="view-col"><button class="small-btn btn-view" data-id="${numericId}" data-ticketid="${ticketId}">View</button></td>
                    `;
                    tbody.appendChild(tr);
                });
                window.__ticketsCache = data.data.slice();
                return;
            }
        } catch (e) {
            console.warn('API unavailable for recent tickets, falling back to localStorage');
        }
        const local = getTickets().slice(0,5);
        local.forEach(t => {
            const tr = document.createElement('tr');
            const status = (t.status || '').toString() || 'Pending';
            const statusClass = status.toLowerCase().replace(/\s+/g, '') || 'pending';
            const ticketId = t.ticket_id || t.ticketId || t.ticket_number || (t.id || '');
            const numericId = t.id || ticketId || null;
            const submitter = getSubmitterName(t) || t.customer || '';
            const service = t.serviceName || t.service || '';
            const category = t.category || '';
            const description = t.description || t.desc || t.details || t.note || '';
            tr.innerHTML = `
                <td>#${ticketId}</td>
                <td>${submitter}</td>
                <td>${category}</td>
                <td title="${escapeHtml(String(description))}">${truncate(description, 60)}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td class="view-col"><button class="small-btn btn-view" data-id="${numericId}" data-ticketid="${ticketId}">View</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function getTickets() {
        if (window.__ticketsCache && Array.isArray(window.__ticketsCache)) return window.__ticketsCache;
        try {
            const s = JSON.parse(localStorage.getItem('tickets') || '[]');
            if (Array.isArray(s)) return s;
        } catch (e) {}
        return [];
    }

    // global ticket detail viewer used by both renderTickets and notifications
    function showTicketDetails(id) {
        console.log('[showTicketDetails] called with id =', id);
        const modal = document.getElementById('ticketViewModal');
        const form = document.getElementById('ticketViewForm');
        if (!modal || !form) return;

        function populate(ticket) {
            if (!ticket) {
                showToast('error','Not found','Ticket not found');
                console.warn('showTicketDetails: ticket not found for',id);
                return;
            }
            const ticketId = ticket.ticket_id || ticket.ticketId || ticket.ticket_number || ticket.id || '';
            form.querySelector('#viewTicketId').value = ticketId;
            let category = ticket.category || '';
            let fullDesc = ticket.description || ticket.problem || '';
            let desc = fullDesc;
            if (!category) {
                const pipeIdx = fullDesc.indexOf(' | ');
                if (pipeIdx !== -1) {
                    category = fullDesc.slice(0, pipeIdx);
                    desc = fullDesc.slice(pipeIdx + 3);
                }
            }
            form.querySelector('#viewCategory').value = category;
            let fname = ticket.firstName || ticket.first_name || '';
            let lname = ticket.lastName || ticket.last_name || '';
            if (!fname && !lname && ticket.customerName) {
                const parts = ticket.customerName.trim().split(/\s+/);
                fname = parts.shift() || '';
                lname = parts.join(' ') || '';
            }
            form.querySelector('#viewFirstName').value = fname;
            form.querySelector('#viewLastName').value = lname;
            form.querySelector('#viewEmail').value = ticket.email || ticket.customerEmail || ticket.userEmail || '';
            form.querySelector('#viewProblem').value = desc;
            form.querySelector('#viewBranch').value = ticket.branch || '';
            form.querySelector('#viewDepartment').value = ticket.department || '';
            form.querySelector('#viewAcceptedBy').value = ticket.acceptedByName || ticket.acceptedBy || '';
            form.querySelector('#viewRemarks').value = ticket.remarks || '';
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden','false');
        }

        const tickets = getTickets();
        const ticket = tickets.find(x => String(x.id) === String(id) || String(x.ticketId) === String(id));
        if (ticket) {
            populate(ticket);
            return;
        }

        // fallback to re‑fetching all tickets if we did not find a local match
        fetch(`${API_BASE}/api/tickets?includeAccepted=1`)
            .then(r => r.json())
            .then(d => {
                const list = Array.isArray(d.data) ? d.data : [];
                window.__ticketsCache = list.slice();
                const t = list.find(x => String(x.id) === String(id) || String(x.ticketId) === String(id));
                populate(t);
            })
            .catch(err => {
                console.error('Failed to load ticket for view', err);
                showToast('error','Network','Unable to fetch ticket details');
            });
    }

    function showToast(type, title, message, timeout = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const t = document.createElement('div');
        t.className = `toast ${type || 'info'}`;
        t.innerHTML = `<div class="t-body"><div class="t-title">${escapeHtml(title || '')}</div><div class="t-msg">${escapeHtml(message || '')}</div></div>`;
        container.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        const tid = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 220); }, timeout);
        t.addEventListener('click', () => { clearTimeout(tid); t.classList.remove('show'); setTimeout(() => t.remove(), 180); });
    }

    function enqueueTicketUpdate(update) {
        try {
            const q = JSON.parse(localStorage.getItem('ticketUpdatesQueue') || '[]');
            q.push(update);
            localStorage.setItem('ticketUpdatesQueue', JSON.stringify(q));
            showToast('info', 'Queued', 'Change queued for synchronization');
        } catch (e) { console.error('Failed to enqueue ticket update', e); }
    }

    async function syncOfflineUpdates() {
        try {
            const q = JSON.parse(localStorage.getItem('ticketUpdatesQueue') || '[]');
            if (!Array.isArray(q) || q.length === 0) return;
            const remaining = [];
            for (const upd of q) {
                try {
                    const res = await fetch(`${API_BASE}/api/tickets/${upd.id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: upd.status })
                    });
                    const data = await res.json();
                    if (!(data && data.success)) {
                        remaining.push(upd);
                    } else {
                        showToast('success', 'Synced', `Ticket ${upd.id} → ${upd.status}`);
                    }
                } catch (e) {
                    remaining.push(upd);
                }
            }
            localStorage.setItem('ticketUpdatesQueue', JSON.stringify(remaining));
        } catch (e) { console.error('Error syncing offline updates', e); }
    }

    async function renderTickets() {
        await syncOfflineUpdates();
        const tbody = document.querySelector('#ticketsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        let ticketsData = null;
        // apply admin-side status filter
        const filterEl = document.getElementById('ticketStatusFilter');
        const filterVal = filterEl ? filterEl.value.toLowerCase() : 'pending';
        
        // Clear old cache to ensure fresh data
        window.__ticketsCache = [];
        
        try {
            const res = await fetch(`${API_BASE}/api/tickets?includeAccepted=1`, {
                headers: getRestrictedHeaders()
            });
            const data = await res.json();
            console.log('===== [DASHBOARD.JS RENDER TICKETS] =====');
            console.log('API Response:', data);
            console.log('Total tickets from API:', data && data.data ? data.data.length : 0);
            if (data.data && data.data.length > 0) {
                // Show first few tickets' categories
                console.log('Sample tickets (first 3):');
                data.data.slice(0, 3).forEach(t => {
                    console.log(`  - ID: ${t.id}, Category: ${t.category}, Status: ${t.status}`);
                });
            }
            if (data && Array.isArray(data.data)) {
                ticketsData = data.data.slice();
                window.__ticketsCache = ticketsData.slice();
            }
        } catch (e) {
            console.warn('API unavailable for tickets, falling back to localStorage');
            ticketsData = getTickets();
        }

        if (!ticketsData) {
            ticketsData = [];
        }
        
        console.log('Tickets before status filter:', ticketsData.length);
        
        // filter based on dropdown
        if (filterVal) {
            ticketsData = ticketsData.filter(t => {
                let st = (t.status || '').toString().toLowerCase();
                // normalize spacing so 'In Progress' becomes 'inprogress'
                st = st.replace(/\s+/g, '');
                if (st === 'awaitingapproval') st = 'pending';
                if (filterVal === 'pending') return st === 'pending';
                if (filterVal === 'inprogress') return st === 'inprogress';
                if (filterVal === 'completed') return st === 'completed';
                return true;
            });
        }
        
        console.log(`Tickets after filtering by ${filterVal}:`, ticketsData.length);
        console.log('===== [END RENDER TICKETS] =====');

        ticketsData.forEach(t => {
            const tr = document.createElement('tr');
            let status = (t.status || '').toString();
            // user-friendly label
            let normalized = status;
            if (status.toLowerCase() === 'awaitingapproval') {
                normalized = 'Pending';
            }
            const statusClass = normalized.toLowerCase().replace(/\s+/g, '') || 'pending';
            const ticketId = t.ticketId || t.ticket_number || t.id || '';
            const serverId = t.id || t.ticketId || t.ticket_number || ticketId || '';
            const submitter = getSubmitterName(t) || t.customer || '';
            const service = t.serviceName || t.service_name || t.service || '';
            const category = t.category || '';
            const description = t.description || t.desc || t.details || t.note || '';
            tr.innerHTML = `
                <td>#${ticketId}</td>
                <td>${submitter}</td>
                <td>${category}</td>
                <td title="${escapeHtml(String(description))}">${truncate(description, 60)}</td>
                <td><span class="status ${statusClass}">${normalized}</span></td>
                <td class="view-col">
                    <button class="small-btn btn-view" data-id="${serverId}" data-ticketid="${ticketId}">View</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Store full filtered data for search functionality
        window.__dashboardTicketsForSearch = ticketsData.slice();

        // view-button listeners are handled via delegation outside this function

        // (modal close handlers were moved to initialization section)



        // branch modal close logic
        const branchModalEl = document.getElementById('branchModal');
        if (branchModalEl) {
            branchModalEl.addEventListener('click', function(e){ if (e.target === branchModalEl || e.target.classList.contains('modal-backdrop')) { branchModalEl.style.display='none'; } });
            document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && branchModalEl.style.display !== 'none') { branchModalEl.style.display='none'; } });
        }
        const departmentModalEl = document.getElementById('departmentModal');
        if (departmentModalEl) {
            departmentModalEl.addEventListener('click', function(e){ if (e.target === departmentModalEl || e.target.classList.contains('modal-backdrop')) { departmentModalEl.style.display='none'; } });
            // reuse same escape handler above
        }
    }

    function updateTicketStatus(id, status) {
        fetch(`${API_BASE}/api/tickets/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, id })
        })
            .then(res => {
                if (!res.ok) return res.text().then(t => ({ ok: false, text: t }));
                return res.json();
            })
            .then(async data => {
                if (data && data.ok === false) {
                    try {
                        const resp = await fetch(`${API_BASE}/api/tickets/update`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status })
                        });
                        const j = await (resp.ok ? resp.json() : { success: false });
                        if (j && j.success) {
                            renderTickets();
                            loadDashboard();
                            return;
                        }
                    } catch (e) {}
                }
                if (data && data.success) {
                    renderTickets();
                    loadDashboard();
                    return;
                }
                try {
                    const lst = JSON.parse(localStorage.getItem('tickets') || '[]');
                    let found = false;
                    for (let i = 0; i < lst.length; i++) {
                        if (String(lst[i].id) === String(id) || String(lst[i].ticketId) === String(id)) {
                            lst[i].status = status;
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        localStorage.setItem('tickets', JSON.stringify(lst));
                    }
                } catch (e) { console.error('Error updating ticket status locally', e); }
                enqueueTicketUpdate({ id, status, ts: Date.now() });
                renderTickets();
                loadDashboard();
            })
            .catch(err => {
                console.error('Error updating ticket:', err);
                try {
                    const lst = JSON.parse(localStorage.getItem('tickets') || '[]');
                    let found = false;
                    for (let i = 0; i < lst.length; i++) {
                        if (String(lst[i].id) === String(id) || String(lst[i].ticketId) === String(id)) {
                            lst[i].status = status;
                            found = true;
                            break;
                        }
                    }
                    if (found) localStorage.setItem('tickets', JSON.stringify(lst));
                } catch (e) { console.error('Error updating ticket status locally', e); }
                enqueueTicketUpdate({ id, status, ts: Date.now() });
                renderTickets();
                loadDashboard();
            });
    }

    // ticket creation from admin UI was removed when "New Ticket" button
    // and associated form were deleted.  Previous code here attempted to
    // POST using variables that no longer exist, leading to reference errors.
    // The block has been removed entirely to avoid runtime crashes.
    function renderServices() {
        console.log('renderServices called');
        fetch(`${API_BASE}/api/services`)
            .then(res => res.json())
            .then(data => {
                console.log('services response', data);
                const container = document.getElementById('mainCategoriesList');
                if (!container) {
                    console.warn('mainCategoriesList container not found');
                    return;
                }
                container.innerHTML = '';
                
                if (data.success && Array.isArray(data.data)) {
                    // Group services by mainCategory
                    const grouped = {};
                    data.data.forEach(s => {
                        if (!grouped[s.mainCategory]) {
                            grouped[s.mainCategory] = [];
                        }
                        grouped[s.mainCategory].push(s);
                    });
                    
                    // Sort main categories alphabetically
                    const sortedMains = Object.keys(grouped).sort();
                    
                    console.log('sorted main categories', sortedMains);
                    // Render each main category as a card
                    sortedMains.forEach(mainCat => {
                        const card = createMainCategoryCard(mainCat, grouped[mainCat]);
                        container.appendChild(card);
                    });
                }
            })
            .catch(err => console.error('Error loading services:', err));
    }

    function createMainCategoryCard(mainCategory, services) {
        console.log('creating card for', mainCategory, services);
        const card = document.createElement('div');
        card.className = 'main-category-card';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <div style="flex: 1;">
                <h3 style="margin: 0;">${mainCategory}</h3>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="tiny-btn btn-add-sub" data-main="${mainCategory}">+ Sub</button>
                <button class="tiny-btn btn-delete-main" style="background: #dc3545;" data-main="${mainCategory}">Delete</button>
            </div>
        `;
        
        const subList = document.createElement('div');
        subList.className = 'subcategories-list';
        
        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'subcat-item';
            item.innerHTML = `
                <span>${service.subCategory}</span>
                <button class="tiny-btn btn-delete-sub" data-id="${service.id}" style="background: #dc3545;">✕</button>
            `;
            subList.appendChild(item);
        });
        
        card.appendChild(header);
        card.appendChild(subList);
        
        // Event listeners
        const addSubBtn = card.querySelector('.btn-add-sub');
        if (addSubBtn) {
            addSubBtn.addEventListener('click', function() {
                openSubCategoryModal(mainCategory);
            });
        }
        
        const deleteMainBtn = card.querySelector('.btn-delete-main');
        if (deleteMainBtn) {
            deleteMainBtn.addEventListener('click', async function() {
                if (await showResetConfirmModal(`Delete entire "${mainCategory}" category and all its sub-categories?`)) {
                    deleteMainCategory(mainCategory, () => {
                        renderServices();
                    });
                }
            });
        }
        
        card.querySelectorAll('.btn-delete-sub').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                if (await showResetConfirmModal('Delete this sub-category?')) {
                    deleteCategory(id, () => {
                        renderServices();
                    });
                }
            });
        });
        
        return card;
    }

    function openSubCategoryModal(mainCategory) {
        const modal = document.getElementById('subCategoryModal');
        const form = document.getElementById('subCategoryForm');
        if (!modal || !form) return;
        
        // Set the parent main category
        document.getElementById('parentMainCategory').value = mainCategory;
        document.getElementById('subCategoryParent').textContent = mainCategory;
        
        // Reset form
        form.reset();
        
        // Show modal
        modal.style.display = 'flex';
    }

    function closeSubCategoryModal() {
        const modal = document.getElementById('subCategoryModal');
        if (modal) modal.style.display = 'none';
    }

    function deleteCategory(id, callback) {
        fetch(`${API_BASE}/api/services/${id}`, {
            method: 'DELETE',
            headers: getRestrictedHeaders()
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (callback) callback();
                }
            })
            .catch(err => console.error('Error deleting sub-category:', err));
    }

    function deleteMainCategory(mainCategory, callback) {
        fetch(`${API_BASE}/api/services/main/${encodeURIComponent(mainCategory)}`, {
            method: 'DELETE',
            headers: getRestrictedHeaders()
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(`Category "${mainCategory}" and all its sub-categories deleted successfully.`);
                    if (callback) callback();
                } else {
                    alert(`Error: ${data.message || 'Failed to delete category'}`);
                }
            })
            .catch(err => {
                console.error('Error deleting main category:', err);
                alert(`Error deleting category: ${err.message}`);
            });
    }

    // Add main category button
    const addMainCategoryBtn = document.getElementById('addMainCategoryBtn');
    if (addMainCategoryBtn) {
        addMainCategoryBtn.addEventListener('click', function() {
            const modal = document.getElementById('categoryModal');
            const form = document.getElementById('categoryForm');
            if (modal && form) {
                form.reset();
                modal.style.display = 'flex';
            }
        });
    }

    // Branch management
    const addBranchBtn = document.getElementById('addBranchBtn');
    if (addBranchBtn) {
        addBranchBtn.addEventListener('click', function() {
            const modal = document.getElementById('branchModal');
            if (modal) {
                renderBranches();
                modal.style.display = 'flex';
            }
        });
    }
    const branchForm = document.getElementById('branchForm');
    if (branchForm) {
        branchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('newBranchName').value.trim();
            if (!name) return;
            fetch(`${API_BASE}/api/branches`, {
                method: 'POST', headers: getRestrictedHeaders(),
                body: JSON.stringify({ name })
            })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    renderBranches();
                    document.getElementById('newBranchName').value = '';
                } else {
                    alert(`Error: ${d.message || 'Could not add branch'}`);
                }
            }).catch(err => console.error('Error adding branch', err));
        });
    }

    function renderBranches() {
        const list = document.getElementById('branchList');
        if (!list) return;
        fetch(`${API_BASE}/api/branches`)
            .then(r => r.json())
            .then(d => {
                list.innerHTML = '';
                if (d.success && Array.isArray(d.data)) {
                    d.data.forEach(b => {
                        const item = document.createElement('div');
                        item.className = 'branch-item';
                        item.innerHTML = `
                            <span>${escapeHtml(b.name)}</span>
                            <button class="tiny-btn btn-delete-branch" data-id="${b.id}" style="background:#dc3545;">✕</button>
                        `;
                        list.appendChild(item);
                    });
                    list.querySelectorAll('.btn-delete-branch').forEach(btn => {
                        btn.addEventListener('click', async function() {
                            const id = this.getAttribute('data-id');
                            if (await showResetConfirmModal('Delete this branch?')) {
                                fetch(`${API_BASE}/api/branches/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getRestrictedHeaders() })
                                    .then(r=>r.json())
                                    .then(resp=>{
                                        if(resp.success) {
                                            renderBranches();
                                        }
                                    }).catch(e=>console.error('Failed to delete branch',e));
                            }
                        });
                    });
                } else {
                    list.innerHTML = '<em>No branches</em>';
                }
            }).catch(err => { console.error('Error loading branches', err); list.innerHTML = '<em>Error</em>'; });
    }

    // Department management
    const addDepartmentBtn = document.getElementById('addDepartmentBtn');
    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener('click', function() {
            const modal = document.getElementById('departmentModal');
            if (modal) {
                renderDepartments();
                modal.style.display = 'flex';
            }
        });
    }
    const departmentForm = document.getElementById('departmentForm');
    if (departmentForm) {
        departmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('newDepartmentName').value.trim();
            if (!name) return;
            fetch(`${API_BASE}/api/departments`, {
                method: 'POST', headers: getRestrictedHeaders(),
                body: JSON.stringify({ department: name })
            })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    renderDepartments();
                    document.getElementById('newDepartmentName').value = '';
                } else {
                    alert(`Error: ${d.message || 'Could not add department'}`);
                }
            }).catch(err => console.error('Error adding department', err));
        });
    }

    function renderDepartments() {
        const list = document.getElementById('departmentList');
        if (!list) return;
        fetch(`${API_BASE}/api/departments`)
            .then(r => r.json())
            .then(d => {
                list.innerHTML = '';
                if (d.success && Array.isArray(d.data)) {
                    d.data.forEach(b => {
                        const item = document.createElement('div');
                        item.className = 'department-item';
                        item.innerHTML = `
                            <span>${escapeHtml(b.department)}</span>
                            <button class="tiny-btn btn-delete-dept" data-id="${b.id}" style="background:#dc3545;">✕</button>
                        `;
                        list.appendChild(item);
                    });
                    list.querySelectorAll('.btn-delete-dept').forEach(btn => {
                        btn.addEventListener('click', async function() {
                            const id = this.getAttribute('data-id');
                            if (await showResetConfirmModal('Delete this department?')) {
                                fetch(`${API_BASE}/api/departments/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getRestrictedHeaders() })
                                    .then(r=>r.json())
                                    .then(resp=>{
                                        if(resp.success) {
                                            renderDepartments();
                                        }
                                    }).catch(e=>console.error('Failed to delete department',e));
                            }
                        });
                    });
                } else {
                    list.innerHTML = '<em>No departments</em>';
                }
            }).catch(err => { console.error('Error loading departments', err); list.innerHTML = '<em>Error</em>'; });
    }

    // Category form submission
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const mainCat = document.getElementById('categoryName').value.trim();
            const subCat = document.getElementById('initialSubCategory').value.trim();
            
            if (!mainCat) {
                alert('Please enter a main category name');
                return;
            }
            
            fetch(`${API_BASE}/api/services`, {
                method: 'POST',
                headers: getRestrictedHeaders(),
                body: JSON.stringify({
                    mainCategory: mainCat,
                    subCategory: subCat || 'General'
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const modal = document.getElementById('categoryModal');
                        if (modal) modal.style.display = 'none';
                        renderServices();
                    }
                })
                .catch(err => console.error('Error creating category:', err));
        });
    }

    // Sub-category form submission
    const subCategoryForm = document.getElementById('subCategoryForm');
    if (subCategoryForm) {
        subCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const mainCat = document.getElementById('parentMainCategory').value;
            const subCat = document.getElementById('newSubCategoryName').value.trim();
            
            if (!mainCat || !subCat) {
                alert('Please enter a sub-category name');
                return;
            }
            
            fetch(`${API_BASE}/api/services`, {
                method: 'POST',
                headers: getRestrictedHeaders(),
                body: JSON.stringify({
                    mainCategory: mainCat,
                    subCategory: subCat
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        closeSubCategoryModal();
                        renderServices();
                    }
                })
                .catch(err => console.error('Error creating sub-category:', err));
        });
    }

    // Modal close buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        }
    });

    // Notifications panel
    function renderNotifications() {
        const tbody = document.querySelector('#notificationsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        fetch(`${API_BASE}/api/notifications`, {
            method: 'GET',
            headers: getRestrictedHeaders()
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    data.data.forEach(notification => {
                        const tr = document.createElement('tr');
                        const submittedDate = notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : '';
                        const description = truncate(notification.description || '', 60);

                        tr.innerHTML = `
                            <td>${escapeHtml(notification.staffName || '')}</td>
                            <td>${escapeHtml(notification.category || '')}</td>
                            <td>${escapeHtml(notification.branch || '')}</td>
                            <td title="${escapeHtml(notification.description || '')}">${description}</td>
                            <td>${submittedDate}</td>
                            <td class="actions">
                                <button class="small-btn btn-approve" data-id="${notification.id}" data-ticket-id="${notification.ticketId}">Approve</button>
                                <button class="small-btn btn-reject" data-id="${notification.id}" data-ticket-id="${notification.ticketId}">Reject</button>
                                <button class="small-btn btn-view-notification" data-id="${notification.id}" data-ticket-id="${notification.ticketId}">View</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });

                    // Add event listeners for buttons
                    tbody.querySelectorAll('.btn-approve').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const notificationId = this.getAttribute('data-id');
                            const ticketId = this.getAttribute('data-ticket-id');
                            handleNotificationAction(notificationId, ticketId, 'approved');
                        });
                    });

                    tbody.querySelectorAll('.btn-reject').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const notificationId = this.getAttribute('data-id');
                            const ticketId = this.getAttribute('data-ticket-id');
                            handleNotificationAction(notificationId, ticketId, 'rejected');
                        });
                    });

                    tbody.querySelectorAll('.btn-view-notification').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const ticketId = this.getAttribute('data-ticket-id');
                            showTicketDetails(ticketId);
                        });
                    });
                }
            })
            .catch(err => console.error('Error loading notifications:', err));
    }

    function handleNotificationAction(notificationId, ticketId, action) {
        fetch(`${API_BASE}/api/notifications/${notificationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Success', `Ticket ${action}`);
                renderNotifications(); // Refresh the notifications list
                loadDashboard(); // Refresh stats
            } else {
                showToast('error', 'Error', data.message || 'Failed to process notification');
            }
        })
        .catch(err => {
            console.error('Error processing notification:', err);
            showToast('error', 'Error', 'Network error');
        });
    }

    // Reports panel
    function renderReports() {
        populateBranchDropdown();  // Load branches when Reports panel opens
        const container = document.getElementById('reportsSummary');
        if (container) {
            container.innerHTML = '';
            fetch(`${API_BASE}/api/stats`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        const stats = data.data;
                        const cards = ['Total: ' + (stats.total || 0), 'Pending: ' + (stats.pending || 0), 'Completed: ' + (stats.completed || 0), 'In Progress: ' + (stats.inprogress || 0)];
                        container.innerHTML = cards.map(c => `<div class="stat-card"><p>${c}</p></div>`).join('');
                    }
                })
                .catch(e => console.error('Error loading reports:', e));
        }
    }

    // Populate branch dropdown from API
    async function populateBranchDropdown() {
        const branchSelect = document.getElementById('reportBranch');
        if (!branchSelect) return;
        
        try {
            const res = await fetch(`${API_BASE}/api/branches`);
            const data = await res.json();
            
            if (data.success && Array.isArray(data.data)) {
                // Store current value to restore after populating
                const currentValue = branchSelect.value;
                
                // Clear and repopulate dropdown
                branchSelect.innerHTML = '<option value="">All Branches</option>';
                data.data.forEach(branch => {
                    const option = document.createElement('option');
                    // API returns objects {id,name}
                    const name = (branch && branch.name) ? branch.name : '';
                    option.value = name;
                    option.textContent = name || '[unknown]';
                    branchSelect.appendChild(option);
                });
                
                // Restore selected value if it still exists
                if (currentValue) {
                    branchSelect.value = currentValue;
                }
            }
        } catch (error) {
            console.warn('Could not fetch branches from API:', error);
            // Fallback to hardcoded branches if API fails
            const branches = ['Manila Central Post Office', 'Makati Central Post Office', 'Quezon City Central Post Office', 'Pasay City Post Office', 'Taguig Post Office', 'Paranaque Post Office', 'Las Piñas Post office', 'Marikina Central Post Office', 'San Juan Central Post Office', 'Pateros Post Office', 'Valenzuela Post Office', 'Caloocan Central Post Office'];
            branchSelect.innerHTML = '<option value="">All Branches</option>';
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        }
    }

    // Audit panel

    // Settings panel
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        document.getElementById('settingDisplayName').value = settings.displayName || '';
        document.getElementById('settingEmail').value = settings.email || userEmail;
        document.getElementById('settingThemeToggle').checked = settings.theme === 'dark';
    }

    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const settings = {
                displayName: document.getElementById('settingDisplayName').value,
                email: document.getElementById('settingEmail').value,
                theme: document.getElementById('settingThemeToggle').checked ? 'dark' : 'light'
            };
            localStorage.setItem('settings', JSON.stringify(settings));
            applyTheme(settings.theme);
            showToast('success', 'Saved', 'Settings saved successfully');
        });
    }

    const themeSwitch = document.getElementById('settingThemeToggle');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            applyTheme(theme);
        });
    }

    // Load notifications on page load
    loadNotifications();

    // Load departments for add user dropdown
    function loadDepartmentsToDropdown() {
        const select = document.getElementById('addUserDepartment');
        if (!select) return;
        
        fetch(`${API_BASE}/api/departments`)
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    // Clear existing options except the placeholder
                    select.innerHTML = '<option value="">-- Select Department --</option>';
                    // Add departments from database
                    data.data.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept.name || dept.department; // use name or department field
                        option.textContent = dept.name || dept.department;
                        select.appendChild(option);
                    });
                }
            })
            .catch(err => console.error('Error loading departments:', err));
    }

    // Add User functionality
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserModal = document.getElementById('addUserModal');
    if (addUserBtn && addUserModal) {
        addUserBtn.addEventListener('click', () => {
            loadDepartmentsToDropdown(); // Populate dropdown when modal opens
            addUserModal.style.display = 'flex';
            document.getElementById('addUserForm').reset();
            // clear contact field
            const contactEl = document.getElementById('addUserContact');
            if (contactEl) contactEl.value = '';
        });
    }

    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const firstName = document.getElementById('addUserFirst').value.trim();
            const lastName = document.getElementById('addUserLast').value.trim();
            const contact = document.getElementById('addUserContact').value.trim();
            const email = document.getElementById('addUserEmail').value.trim();
            const department = document.getElementById('addUserDepartment').value;
            const role = document.getElementById('addUserRole').value;

            if (!firstName || !lastName || !email) {
                showToast('error', 'Error', 'Please fill in all required fields');
                return;
            }
            // phone number validation: either empty or 0 followed by 10 digits
            if (contact && !/^0\d{10}$/.test(contact)) {
                showToast('error', 'Error', 'Contact number must be 11 digits starting with 0');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/users`, {
                    method: 'POST',
                    headers: getRestrictedHeaders(),
                    body: JSON.stringify({
                        firstName: firstName,
                        lastName: lastName,
                        contactNumber: contact,
                        email: email,
                        department: department,
                        role: role
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('success', 'success', `User created! Temporary password: ${data.tempPassword}`);
                    addUserModal.style.display = 'none';
                    addUserForm.reset();
                } else {
                    showToast('error', 'Error', data.message || 'Failed to create user');
                }
            } catch (err) {
                console.error('Error creating user:', err);
                showToast('error', 'Error', 'Network error while creating user');
            }
        });
    }

    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    if (changePasswordBtn && changePasswordModal) {
        changePasswordBtn.addEventListener('click', () => {
            changePasswordModal.style.display = 'flex';
            ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.type = 'password';
            });
            document.querySelectorAll('.password-toggle').forEach(icon => icon.textContent = '👁️');
        });
    }
    // handle icon toggles inside password inputs
    document.querySelectorAll('.password-toggle').forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const el = document.getElementById(targetId);
            if (!el) return;
            if (el.type === 'password') {
                el.type = 'text';
                icon.textContent = '🙈';
            } else {
                el.type = 'password';
                icon.textContent = '👁️';
            }
        });
    });
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const current = document.getElementById('currentPassword').value;
            const np = document.getElementById('newPassword').value;
            const conf = document.getElementById('confirmPassword').value;
            if (np !== conf) {
                showToast('error', 'Error', 'New passwords do not match');
                return;
            }
            if (!await showResetConfirmModal('Confirm password change?')) {
                return;
            }
            try {
                // include email and rename currentPassword -> oldPassword for server
                const userEmail = sessionStorage.getItem('userEmail') || (stored && stored.email) || '';
                const res = await fetch(`${API_BASE}/api/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail, oldPassword: current, newPassword: np })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('success', 'Changed', 'Password updated');
                    changePasswordModal.style.display = 'none';
                } else {
                    showToast('error', 'Failed', data.message || 'Unable to change password');
                }
            } catch (err) {
                console.error('change password failed', err);
                showToast('error', 'Error', 'Network error');
            }
        });
    }

    // ===== REPORTS & ANALYTICS MODULE =====
    let reportChartInstances = {
        status: null,
        branch: null,
        trend: null
    };

    // Set default date range (last 90 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 90*24*60*60*1000);
    document.getElementById('reportStartDate').valueAsDate = startDate;
    document.getElementById('reportEndDate').valueAsDate = endDate;

    // Load and generate reports
    async function loadReports() {
        try {
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            const department = document.getElementById('reportDepartment').value;
            const branch = document.getElementById('reportBranch').value;
            const staff = document.getElementById('reportStaff').value;
            const status = document.getElementById('reportStatus').value;

            let url = `${API_BASE}/api/analytics?startDate=${startDate}&endDate=${endDate}`;
            if (department) url += `&department=${encodeURIComponent(department)}`;
            if (branch) url += `&branch=${encodeURIComponent(branch)}`;
            if (staff) url += `&staff=${encodeURIComponent(staff)}`;
            if (status) url += `&status=${encodeURIComponent(status)}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: getRestrictedHeaders()
            });
            const data = await res.json();
            console.log('analytics response', data);
            
            if (!data.success) {
                showToast('error', 'Error', 'Failed to load analytics');
                return;
            }

            const analytics = data.data;
            
            // Update summary statistics
            document.getElementById('statTotal').textContent = analytics.summary.total;
            document.getElementById('statCompleted').textContent = analytics.summary.completed;
            document.getElementById('statPending').textContent = analytics.summary.pending;
            document.getElementById('statInprogress').textContent = analytics.summary.inprogress;
            document.getElementById('statCompletionRate').textContent = analytics.summary.completionRate + '%';
            document.getElementById('statAvgResolution').textContent = analytics.summary.avgResolutionHours + 'h';

            // Update filter dropdowns
            const branchSelect = document.getElementById('reportBranch');
            const oldBranchValue = branchSelect.value;
            branchSelect.innerHTML = '<option value="">All Branches</option>';
            analytics.filters.branches.forEach(b => {
                const option = document.createElement('option');
                // b should be a string, but protect against objects
                let name = (typeof b === 'string') ? b : (b && b.branch) ? b.branch : '';
                option.value = name;
                option.textContent = name;
                branchSelect.appendChild(option);
            });
            branchSelect.value = oldBranchValue;

            const staffSelect = document.getElementById('reportStaff');
            const oldStaffValue = staffSelect.value;
            staffSelect.innerHTML = '<option value="">All Staff</option>';
            // Deduplicate staff by name to avoid showing duplicates
            const nameMap = new Map();
            analytics.filters.staff.forEach(s => {
                let name = '';
                let value = '';
                
                // Try to get first and last name
                if (typeof s === 'string') {
                    // If it's just a string, try to parse it as an email
                    const emailParts = s.split('@')[0].split(/[._-]/);
                    name = emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                    value = s;
                } else if (s && (s.first_name || s.firstName || s.lastName || s.last_name)) {
                    const firstName = s.first_name || s.firstName || '';
                    const lastName = s.last_name || s.lastName || '';
                    name = (firstName + ' ' + lastName).trim();
                    value = s.email || name;
                } else if (s && s.email) {
                    // Parse email to extract name
                    const emailParts = s.email.split('@')[0].split(/[._-]/);
                    name = emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                    value = s.email;
                }
                
                // Only add if name is not empty and hasn't been added yet
                if (name && !nameMap.has(name)) {
                    nameMap.set(name, value);
                }
            });
            
            // Populate dropdown with deduplicated staff
            nameMap.forEach((value, name) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = name;
                staffSelect.appendChild(option);
            });
            staffSelect.value = oldStaffValue;

            // Render charts
            renderStatusChart(analytics.statusBreakdown);
            renderBranchChart(analytics.perBranch);
            renderTrendChart(analytics.timeSeries);

            // Populate tables
            populateStaffTable(analytics.perStaff);
            populateBranchTable(analytics.perBranch);

            // Store data globally for export
            window.currentReportData = analytics;

        } catch (err) {
            console.error('Error loading reports:', err);
            showToast('error', 'Error', 'Failed to load analytics');
        }
    }

    function renderStatusChart(statusData) {
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        const labels = statusData.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1));
        const values = statusData.map(s => s.count);
        // assign colors by status key so we can control the palette
        const statusColorMap = {
            completed: '#388e3c',      // green
            inprogress: '#ffeb3b',     // yellow
            pending: '#f44336',        // red
            awaitingapproval: '#1976d2'// blue
        };
        const colors = statusData.map(s => {
            const key = String(s.status || '').toLowerCase().replace(/\s+/g, '');
            return statusColorMap[key] || '#cccccc';
        });

        if (reportChartInstances.status) {
            reportChartInstances.status.destroy();
        }

        reportChartInstances.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    function renderBranchChart(branchData) {
        const ctx = document.getElementById('branchChart').getContext('2d');
        
        const labels = branchData.map(b => b.branch || 'Unknown');
        const values = branchData.map(b => b.total);

        if (reportChartInstances.branch) {
            reportChartInstances.branch.destroy();
        }

        reportChartInstances.branch = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Tickets',
                    data: values,
                    backgroundColor: '#1976d2',
                    borderColor: '#1565c0',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }

    function renderTrendChart(timeSeriesData) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        const labels = timeSeriesData.map(t => {
            // ensure we show only YYYY-MM-DD
            if (!t || t.date === undefined || t.date === null) return '';
            const d = new Date(t.date);
            // fallback when input is already string
            if (isNaN(d.getTime())) {
                // maybe server already sent 'YYYY-MM-DD'
                return String(t.date).slice(0,10);
            }
            return d.toISOString().slice(0,10);
        });
        const totalValues = timeSeriesData.map(t => t.total);
        const completedValues = timeSeriesData.map(t => t.completed || 0);

        if (reportChartInstances.trend) {
            reportChartInstances.trend.destroy();
        }

        reportChartInstances.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Created',
                        data: totalValues,
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Completed',
                        data: completedValues,
                        borderColor: '#388e3c',
                        backgroundColor: 'rgba(56, 142, 60, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    function populateStaffTable(perStaffData) {
        const tbody = document.querySelector('#analyticsStaffTable tbody');
        if (!tbody) {
            console.warn('analyticsStaffTable not found');
            return;
        }
        tbody.innerHTML = '';
        
        // Deduplicate staff data by name, aggregating totals
        const staffMap = new Map();
        perStaffData.forEach(staff => {
            const name = staff.staffName || 'Unknown';
            if (staffMap.has(name)) {
                // If staff already exists, add to their totals
                const existing = staffMap.get(name);
                existing.total += staff.total || 0;
                existing.completed += staff.completed || 0;
            } else {
                // First occurrence, create new entry
                staffMap.set(name, {
                    staffName: name,
                    total: staff.total || 0,
                    completed: staff.completed || 0
                });
            }
        });
        
        // Display deduplicated data
        staffMap.forEach(staff => {
            const completionRate = staff.total > 0 ? Math.round((staff.completed / staff.total) * 100) : 0;
            // Parse staff name to show only first and last name, not email
            let displayName = staff.staffName || 'Unknown';
            if (displayName.includes('@')) {
                // It's an email, parse it to extract name
                const emailParts = displayName.split('@')[0].split(/[._-]/);
                displayName = emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            }
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #eee';
            row.innerHTML = `
                <td style="padding: 10px;">${displayName}</td>
                <td style="padding: 10px; text-align: center;">${staff.total}</td>
                <td style="padding: 10px; text-align: center;">${staff.completed}</td>
                <td style="padding: 10px; text-align: center;"><strong>${completionRate}%</strong></td>
            `;
            tbody.appendChild(row);
        });

        if (staffMap.size === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">No data available</td></tr>';
        }
    }

    function populateBranchTable(perBranchData) {
        const tbody = document.querySelector('#analyticsBranchTable tbody');
        if (!tbody) {
            console.warn('analyticsBranchTable not found');
            return;
        }
        tbody.innerHTML = '';
        
        // Deduplicate branch data by name, aggregating totals
        const branchMap = new Map();
        perBranchData.forEach(branch => {
            const name = branch.branch || 'Unknown';
            if (branchMap.has(name)) {
                // If branch already exists, add to their totals
                const existing = branchMap.get(name);
                existing.total += branch.total || 0;
                existing.completed += branch.completed || 0;
            } else {
                // First occurrence, create new entry
                branchMap.set(name, {
                    branch: name,
                    total: branch.total || 0,
                    completed: branch.completed || 0
                });
            }
        });
        
        // Display deduplicated data
        branchMap.forEach(branch => {
            const completionRate = branch.total > 0 ? Math.round((branch.completed / branch.total) * 100) : 0;
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #eee';
            row.innerHTML = `
                <td style="padding: 10px;">${branch.branch || 'Unknown'}</td>
                <td style="padding: 10px; text-align: center;">${branch.total}</td>
                <td style="padding: 10px; text-align: center;">${branch.completed}</td>
                <td style="padding: 10px; text-align: center;"><strong>${completionRate}%</strong></td>
            `;
            tbody.appendChild(row);
        });

        if (branchMap.size === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">No data available</td></tr>';
        }
    }

    // Event listeners for reports
    document.getElementById('generateReportBtn').addEventListener('click', loadReports);
    document.getElementById('reportStartDate').addEventListener('change', loadReports);
    document.getElementById('reportEndDate').addEventListener('change', loadReports);
    document.getElementById('reportDepartment').addEventListener('change', loadReports);
    document.getElementById('reportBranch').addEventListener('change', loadReports);
    document.getElementById('reportStaff').addEventListener('change', loadReports);
    document.getElementById('reportStatus').addEventListener('change', loadReports);

    // helper functions for CSV/PDF download
    function downloadCSV(filename, rows) {
        const csv = rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
        const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        window.open(dataUrl, '_blank');
    }

    function exportChartPdf(chartId, title, csvRows) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        // header
        doc.setFontSize(16);
        doc.text(title, pageWidth / 2, margin, { align: 'center' });
        // image of chart
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const img = canvas.toDataURL('image/png');
            doc.addImage(img, 'PNG', margin, margin + 8, pageWidth - margin * 2, 0);
        }
        // add data table if provided
        if (csvRows && csvRows.length) {
            const startY = (canvas ? margin + 8 + canvas.height * (pageWidth - margin*2) / canvas.width + 10 : margin + 20);
            doc.autoTable({
                startY: startY,
                head: [csvRows[0]],
                body: csvRows.slice(1),
                margin: margin,
                theme: 'grid'
            });
        }
        // prepared by
        const userEmail = document.getElementById('userEmail')?.textContent || '';
        doc.setFontSize(10);
        doc.text(`Prepared by: ${userEmail}`, pageWidth - margin, pageHeight - margin, { align: 'right' });

        doc.save(title.replace(/\s+/g,'_') + '.pdf');
    }

    // Export to PDF
    document.getElementById('exportPdfBtn').addEventListener('click', async function() {
        if (!window.currentReportData) {
            showToast('warning', 'Warning', 'Please generate a report first');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            
            let yPos = 20;
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;

            // Title (centered)
            doc.setFontSize(18);
            doc.text('Ticketing System Report', pageWidth/2, yPos, { align: 'center' });
            yPos += 15;

            // Date range
            doc.setFontSize(10);
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            doc.text(`Period: ${startDate} to ${endDate}`, margin, yPos);
            yPos += 10;

            // Summary Section
            doc.setFontSize(12);
            doc.text('Summary Statistics', margin, yPos);
            yPos += 8;

            const summary = window.currentReportData.summary;
            const summaryData = [
                ['Metric', 'Value'],
                ['Total Tickets', summary.total],
                ['Completed', summary.completed],
                ['Pending', summary.pending],
                ['In Progress', summary.inprogress],
                ['Awaiting Approval', summary.awaitingapproval],
                ['Completion Rate', summary.completionRate + '%'],
                ['Avg Resolution Time', summary.avgResolutionHours + ' hours']
            ];

            doc.autoTable({
                startY: yPos,
                head: [summaryData[0]],
                body: summaryData.slice(1),
                margin: margin,
                didDrawPage: (data) => {
                    yPos = data.lastAutoTable.finalY + 10;
                }
            });

            yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPos + 40;

            // Staff Table
            if (window.currentReportData.perStaff.length > 0) {
                if (yPos > pageHeight - 50) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFontSize(12);
                doc.text('Tickets by Staff', margin, yPos);
                yPos += 8;

                const staffData = [
                    ['Staff Member', 'Total', 'Completed', 'Rate'],
                    ...window.currentReportData.perStaff.map(s => [
                        s.staffName || 'Unknown',
                        s.total,
                        s.completed,
                        s.total > 0 ? Math.round((s.completed / s.total) * 100) + '%' : '0%'
                    ])
                ];

                doc.autoTable({
                    startY: yPos,
                    head: [staffData[0]],
                    body: staffData.slice(1),
                    margin: margin,
                    didDrawPage: (data) => {
                        yPos = data.lastAutoTable.finalY + 10;
                    }
                });
            }

            yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPos + 40;

            // Branch Table
            if (window.currentReportData.perBranch.length > 0) {
                if (yPos > pageHeight - 50) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(12);
                doc.text('Tickets by Branch', margin, yPos);
                yPos += 8;

                const branchData = [
                    ['Branch', 'Total', 'Completed', 'Rate'],
                    ...window.currentReportData.perBranch.map(b => [
                        b.branch || 'Unknown',
                        b.total,
                        b.completed,
                        b.total > 0 ? Math.round((b.completed / b.total) * 100) + '%' : '0%'
                    ])
                ];

                doc.autoTable({
                    startY: yPos,
                    head: [branchData[0]],
                    body: branchData.slice(1),
                    margin: margin
                });
            }

            // add prepared by footer
            const userEmail = document.getElementById('userEmail')?.textContent || '';
            doc.setFontSize(10);
            doc.text(`Prepared by: ${userEmail}`, pageWidth - margin, pageHeight - margin, { align: 'right' });

            doc.save('ticketing_report.pdf');
            showToast('success', 'Success', 'Report exported to PDF');
        } catch (err) {
            console.error('Error exporting PDF:', err);
            showToast('error', 'Error', 'Failed to export PDF. Please ensure jsPDF is loaded.');
        }
    });

    // Export to CSV
    document.getElementById('exportCsvBtn').addEventListener('click', async function() {
        if (!window.currentReportData) {
            showToast('warning', 'Warning', 'Please generate a report first');
            return;
        }

        try {
            const csv = [];

            // Fetch detailed tickets - get ALL tickets regardless of status
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            const branch = document.getElementById('reportBranch').value;
            const staff = document.getElementById('reportStaff').value;
            const status = document.getElementById('reportStatus').value;

            console.log('CSV Export - Filters:', { startDate, endDate, branch, staff, status });

            let ticketsUrl = `${API_BASE}/api/tickets?includeAccepted=1`;
            if (status) ticketsUrl += `&status=${encodeURIComponent(status)}`;

            console.log('Fetching tickets from:', ticketsUrl);
            const ticketsRes = await fetch(ticketsUrl, {
                method: 'GET',
                headers: getRestrictedHeaders()
            });
            const ticketsData = await ticketsRes.json();
            console.log('Tickets response:', ticketsData);
            
            let tickets = Array.isArray(ticketsData.data) ? ticketsData.data : [];
            console.log('Initial tickets count:', tickets.length);

            // Client-side filtering for date, branch, and staff
            if (startDate || endDate || branch || staff) {
                const beforeFilter = tickets.length;
                tickets = tickets.filter(ticket => {
                    let ticketDate = '';
                    try {
                        const d = new Date(ticket.createdAt);
                        if (!isNaN(d.getTime())) {
                            ticketDate = d.toISOString().split('T')[0];
                        }
                    } catch (e) {
                        ticketDate = '';
                    }
                    
                    if (startDate && ticketDate && ticketDate < startDate) return false;
                    if (endDate && ticketDate && ticketDate > endDate) return false;
                    if (branch && ticket.branch !== branch) return false;
                    if (staff && ticket.acceptedBy !== staff && ticket.acceptedByName !== staff) return false;
                    
                    return true;
                });
                console.log('After filtering - Before:', beforeFilter, 'After:', tickets.length);
            }

            // Detailed Tickets Section - all fields visible in ticket detail view
            csv.push(['Ticketing System Report - All Tickets']);
            csv.push(['Generated', new Date().toLocaleString()]);
            csv.push([]);
            csv.push(['Ticket ID', 'Status', 'Category', 'First Name', 'Last Name', 'Email', 'Branch', 'Department', 'Description', 'Created Date', 'Accepted By', 'Completed Date']);
            
            // Add branch/department distribution counts with status breakdown
            const initDist = () => ({ total:0, pending:0, inprogress:0, awaitingapproval:0, completed:0 });
            const byBranch = {};
            const byDepartment = {};

            tickets.forEach(ticket => {
                const branchVal = ticket.branch || 'Unknown';
                const deptVal = ticket.department || 'Unknown';
                const status = (ticket.status || '').toLowerCase();

                if (!byBranch[branchVal]) byBranch[branchVal] = initDist();
                if (!byDepartment[deptVal]) byDepartment[deptVal] = initDist();

                byBranch[branchVal].total += 1;
                byDepartment[deptVal].total += 1;

                if (status === 'pending') { byBranch[branchVal].pending += 1; byDepartment[deptVal].pending += 1; }
                else if (status === 'inprogress') { byBranch[branchVal].inprogress += 1; byDepartment[deptVal].inprogress += 1; }
                else if (status === 'awaitingapproval') { byBranch[branchVal].awaitingapproval += 1; byDepartment[deptVal].awaitingapproval += 1; }
                else if (status === 'completed') { byBranch[branchVal].completed += 1; byDepartment[deptVal].completed += 1; }
            });

            csv.push(['Branch Distribution']);
            csv.push(['Branch', 'Total', 'Pending', 'In Progress', 'Awaiting Approval', 'Completed']);
            Object.entries(byBranch).forEach(([name,stats]) => csv.push([name, stats.total, stats.pending, stats.inprogress, stats.awaitingapproval, stats.completed]));
            csv.push([]);

            csv.push(['Department Distribution']);
            csv.push(['Department', 'Total', 'Pending', 'In Progress', 'Awaiting Approval', 'Completed']);
            Object.entries(byDepartment).forEach(([name,stats]) => csv.push([name, stats.total, stats.pending, stats.inprogress, stats.awaitingapproval, stats.completed]));
            csv.push([]);

            if (tickets.length > 0) {
                tickets.forEach(ticket => {
                    let fname = ticket.firstName || ticket.first_name || '';
                    let lname = ticket.lastName || ticket.last_name || '';
                    if (!fname && !lname && ticket.customerName) {
                        const parts = ticket.customerName.trim().split(/\s+/);
                        fname = parts.shift() || '';
                        lname = parts.join(' ') || '';
                    }
                    
                    let createdDate = '';
                    let completedDate = '';
                    try {
                        if (ticket.createdAt) {
                            const d = new Date(ticket.createdAt);
                            if (!isNaN(d.getTime())) {
                                createdDate = d.toLocaleString();
                            }
                        }
                        if (ticket.completedAt) {
                            const d = new Date(ticket.completedAt);
                            if (!isNaN(d.getTime())) {
                                completedDate = d.toLocaleString();
                            }
                        }
                    } catch (e) {
                        // date parsing failed
                    }
                    
                    const acceptedBy = ticket.acceptedByName || ticket.acceptedBy || '';
                    const description = (ticket.description || '').replace(/\n/g, ' ').substring(0, 500);
                    
                    csv.push([
                        ticket.ticketId || ticket.id || '',
                        ticket.status || '',
                        ticket.category || '',
                        fname,
                        lname,
                        ticket.email || '',
                        ticket.branch || '',
                        ticket.department || '',
                        description,
                        createdDate,
                        acceptedBy,
                        completedDate
                    ]);
                });
            } else {
                csv.push(['No tickets found']);
            }

            console.log('CSV rows:', csv.length);
            
            // Convert to CSV string
            const csvContent = csv.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
            
            console.log('CSV Content length:', csvContent.length);
            
            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'ticketing_report.csv';
            link.click();
            
            showToast('success', 'Success', 'Report exported to CSV');
        } catch (err) {
            console.error('Error exporting CSV:', err);
            showToast('error', 'Error', 'Failed to export CSV: ' + err.message);
        }
    });

    // after the CSV export listener add individual chart export handlers
    function prepareChartCsvRows(type) {
        const analytics = window.currentReportData || {};
        if (type === 'status') {
            const data = analytics.statusBreakdown || [];
            return [['Status','Count'], ...data.map(s=>[s.status, s.count])];
        }
        if (type === 'branch') {
            const data = analytics.perBranch || [];
            return [['Branch','Total'], ...data.map(b=>[b.branch||'Unknown', b.total])];
        }
        if (type === 'trend') {
            const data = analytics.timeSeries || [];
            return [['Date','Total','Completed'], ...data.map(t=>[String(t.date).slice(0,10), t.total, t.completed||0])];
        }
        return [];
    }

    document.getElementById('statusPdfBtn').addEventListener('click', function(){
        const rows = prepareChartCsvRows('status');
        exportChartPdf('statusChart','Status Distribution', rows);
    });
    document.getElementById('statusCsvBtn').addEventListener('click', async function(){
        try {
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            const branch = document.getElementById('reportBranch').value;
            const staff = document.getElementById('reportStaff').value;

            let url = `${API_BASE}/api/tickets?includeAccepted=1`;
            if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
            if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
            if (branch) url += `&branch=${encodeURIComponent(branch)}`;
            if (staff) url += `&staff=${encodeURIComponent(staff)}`;

            const res = await fetch(url, { method: 'GET', headers: getRestrictedHeaders() });
            const data = await res.json();
            const tickets = Array.isArray(data.data) ? data.data : [];

            const order = ['awaitingapproval', 'pending', 'inprogress', 'completed'];
            const sorted = tickets.slice().sort((a,b) => {
                const aStatus = (a.status||'').toLowerCase();
                const bStatus = (b.status||'').toLowerCase();
                const ai = order.indexOf(aStatus)>=0 ? order.indexOf(aStatus) : order.length;
                const bi = order.indexOf(bStatus)>=0 ? order.indexOf(bStatus) : order.length;
                if (ai !== bi) return ai-bi;
                return String(a.id || a.ticketId || '').localeCompare(String(b.id || b.ticketId || ''));
            });

            const csv = [];
            csv.push(['Ticket Status Distribution Export']);
            csv.push(['Generated', new Date().toLocaleString()]);
            csv.push([]);
            csv.push(['Status','Ticket ID','Category','First Name','Last Name','Email','Branch','Department','Description','Created Date','Accepted By','Completed Date']);

            sorted.forEach(ticket => {
                let fname = ticket.firstName || ticket.first_name || '';
                let lname = ticket.lastName || ticket.last_name || '';
                if (!fname && !lname && ticket.customerName) {
                    const parts = ticket.customerName.trim().split(/\s+/);
                    fname = parts.shift() || '';
                    lname = parts.join(' ') || '';
                }
                const createdDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '';
                const completedDate = ticket.completedAt ? new Date(ticket.completedAt).toLocaleString() : '';
                const acceptedBy = ticket.acceptedByName || ticket.acceptedBy || '';
                const description = (ticket.description || '').replace(/\n/g, ' ').substring(0, 500);

                csv.push([
                    ticket.status || '',
                    ticket.ticketId || ticket.id || '',
                    ticket.category || '',
                    fname,
                    lname,
                    ticket.email || '',
                    ticket.branch || '',
                    ticket.department || '',
                    description,
                    createdDate,
                    acceptedBy,
                    completedDate
                ]);
            });

            downloadCSV('status_distribution.csv', csv);
        } catch (err) {
            console.error('Error exporting status CSV', err);
            showToast('error', 'Error', 'Failed to export status distribution CSV');
        }
    });

    document.getElementById('branchPdfBtn').addEventListener('click', function(){
        const rows = prepareChartCsvRows('branch');
        exportChartPdf('branchChart','Tickets by Branch', rows);
    });
    document.getElementById('branchCsvBtn').addEventListener('click', async function(){
        try {
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            const branch = document.getElementById('reportBranch').value;
            const staff = document.getElementById('reportStaff').value;
            const status = document.getElementById('reportStatus').value;

            let url = `${API_BASE}/api/tickets?includeAccepted=1`;
            if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
            if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
            if (branch) url += `&branch=${encodeURIComponent(branch)}`;
            if (staff) url += `&staff=${encodeURIComponent(staff)}`;
            if (status) url += `&status=${encodeURIComponent(status)}`;

            const res = await fetch(url, { method: 'GET', headers: getRestrictedHeaders() });
            const data = await res.json();
            const tickets = Array.isArray(data.data) ? data.data : [];

            const statusOrder = ['awaitingapproval', 'pending', 'inprogress', 'completed'];
            const sorted = tickets.slice().sort((a,b) => {
                const aBranch = (a.branch||'').toLowerCase();
                const bBranch = (b.branch||'').toLowerCase();
                if (aBranch !== bBranch) return aBranch.localeCompare(bBranch);
                const aStatus = (a.status||'').toLowerCase();
                const bStatus = (b.status||'').toLowerCase();
                const ai = statusOrder.indexOf(aStatus) >= 0 ? statusOrder.indexOf(aStatus) : statusOrder.length;
                const bi = statusOrder.indexOf(bStatus) >= 0 ? statusOrder.indexOf(bStatus) : statusOrder.length;
                if (ai !== bi) return ai - bi;
                return String(a.ticketId || a.id || '').localeCompare(String(b.ticketId || b.id || ''));
            });

            const csv = [];
            csv.push(['Ticket Branch Distribution Export']);
            csv.push(['Generated', new Date().toLocaleString()]);
            csv.push([]);
            csv.push(['Branch','Status','Ticket ID','Category','First Name','Last Name','Email','Department','Description','Created Date','Accepted By','Completed Date']);

            sorted.forEach(ticket => {
                let fname = ticket.firstName || ticket.first_name || '';
                let lname = ticket.lastName || ticket.last_name || '';
                if (!fname && !lname && ticket.customerName) {
                    const parts = ticket.customerName.trim().split(/\s+/);
                    fname = parts.shift() || '';
                    lname = parts.join(' ') || '';
                }
                const createdDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '';
                const completedDate = ticket.completedAt ? new Date(ticket.completedAt).toLocaleString() : '';
                const acceptedBy = ticket.acceptedByName || ticket.acceptedBy || '';
                const description = (ticket.description || '').replace(/\n/g, ' ').substring(0, 500);

                csv.push([
                    ticket.branch || '',
                    ticket.status || '',
                    ticket.ticketId || ticket.id || '',
                    ticket.category || '',
                    fname,
                    lname,
                    ticket.email || '',
                    ticket.department || '',
                    description,
                    createdDate,
                    acceptedBy,
                    completedDate
                ]);
            });

            downloadCSV('tickets_by_branch.csv', csv);
        } catch (err) {
            console.error('Error exporting branch CSV', err);
            showToast('error','Error','Failed to export branch CSV');
        }
    });

    document.getElementById('trendPdfBtn').addEventListener('click', function(){
        const rows = prepareChartCsvRows('trend');
        exportChartPdf('trendChart','Daily Trend', rows);
    });
    document.getElementById('trendCsvBtn').addEventListener('click', function(){
        const rows = prepareChartCsvRows('trend');
        downloadCSV('daily_trend.csv', rows);
    });

    // hook status filter change
    const statusFilter = document.getElementById('ticketStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', renderTickets);
    }
    
    // Search functionality for tickets
    const ticketSearch = document.getElementById('ticketSearch');
    if (ticketSearch) {
        ticketSearch.addEventListener('input', function() {
            const searchQuery = this.value.toLowerCase().trim();
            const tbody = document.querySelector('#ticketsTable tbody');
            if (!tbody) return;
            
            if (!searchQuery) {
                // Clear search - re-render all tickets with current status filter
                renderTickets();
                return;
            }
            
            // Get the tickets to search through
            const ticketsToSearch = window.__dashboardTicketsForSearch || [];
            
            // Filter tickets based on search query
            const filtered = ticketsToSearch.filter(t => {
                const ticketId = (t.ticketId || t.ticket_number || t.id || '').toString().toLowerCase();
                const customer = ((t.first_name || '') + ' ' + (t.last_name || '') + ' ' + (t.customer_name || '')).toLowerCase();
                const category = (t.category || '').toLowerCase();
                const description = (t.description || t.desc || t.details || t.note || '').toLowerCase();
                const email = (t.email || '').toLowerCase();
                
                return ticketId.includes(searchQuery) || 
                       customer.includes(searchQuery) || 
                       category.includes(searchQuery) || 
                       description.includes(searchQuery) ||
                       email.includes(searchQuery);
            });
            
            // Re-render table with filtered results
            tbody.innerHTML = '';
            filtered.forEach(t => {
                const tr = document.createElement('tr');
                let status = (t.status || '').toString();
                let normalized = status;
                if (status.toLowerCase() === 'awaitingapproval') {
                    normalized = 'Pending Approval';
                }
                const statusClass = normalized.toLowerCase().replace(/\s+/g, '') || 'pending';
                const ticketId = t.ticketId || t.ticket_number || t.id || '';
                const serverId = t.id || t.ticketId || t.ticket_number || ticketId || '';
                const submitter = getSubmitterName(t) || t.customer || '';
                const category = t.category || '';
                const description = t.description || t.desc || t.details || t.note || '';
                tr.innerHTML = `
                    <td>#${ticketId}</td>
                    <td>${submitter}</td>
                    <td>${category}</td>
                    <td title="${escapeHtml(String(description))}">${truncate(description, 60)}</td>
                    <td><span class="status ${statusClass}">${normalized}</span></td>
                    <td class="view-col">
                        <button class="small-btn btn-view" data-id="${serverId}" data-ticketid="${ticketId}">View</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
    }
    
    // Load initial report
    loadReports();

});

