const API_BASE = 'http://localhost:8000';

// Helper to get user department from localStorage
function getUserDepartment() {
    try {
        const user = JSON.parse(window.localStorage.getItem('user') || '{}');
        const dept = user.department || '';
        console.log('[Staff.js] getUserDepartment:', dept, 'from user:', user);
        return dept;
    } catch (e) {
        console.error('[Staff.js] Error reading user department:', e);
        return '';
    }
}

// Helper to add headers with department for ticket filtering
function getTicketHeaders() {
    const dept = getUserDepartment();
    const headers = {
        'Content-Type': 'application/json',
        'x-user-department': dept
    };
    console.log('[Staff.js] getTicketHeaders:', headers);
    return headers;
}

let currentUser = null;
let currentStaffId = null;
let currentStaffName = ''; // Store staff member's full name
// simple cache mapping ticket server id -> joborder id for this staff
const joborderMap = {};
// keep recent tickets in case we need to join them for workload/accomplishments
let ticketsCache = [];
// store fetched joborders for this staff
let allJoborders = [];
let currentRemarkTicketId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // read login info from storage
    try {
        currentUser = JSON.parse(window.localStorage.getItem('user') || '{}');
    } catch (e) {
        currentUser = {};
    }
    if (!currentUser || !currentUser.email) {
        // not logged in, redirect to homepage
        window.location.href = '/ui/index.html';
        return;
    }
    
    // Fetch user details from server to get first_name and last_name from users table
    try {
        const userDetailsRes = await fetch(`${API_BASE}/api/user/details?email=${encodeURIComponent(currentUser.email)}`);
        const userDetailsData = await userDetailsRes.json();
        if (userDetailsData && userDetailsData.success) {
            currentUser.firstName = userDetailsData.firstName || currentUser.firstName || '';
            currentUser.lastName = userDetailsData.lastName || currentUser.lastName || '';
            // Also store in localStorage for future access
            window.localStorage.setItem('user', JSON.stringify(currentUser));
        }
    } catch (e) {
        console.warn('Could not fetch user details from server:', e);
    }
    
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = currentUser.email;
    const profileName = document.getElementById('profileName');
    if (profileName) profileName.textContent = currentUser.email;
    const profileRole = document.getElementById('profileRole');
    if (profileRole) profileRole.textContent = 'Staff';

    // profile dropdown and logout
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    // debug logging removed
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', e => {
            e.preventDefault();
            const hidden = profileDropdown.classList.toggle('hidden');
            profileBtn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
        });
        document.addEventListener('click', e => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
                profileBtn.setAttribute('aria-expanded','false');
            }
        });
    }
    console.log('profileBtn in DOM?', document.getElementById('profileBtn'));
    const logoutBtn = document.getElementById('logoutMenuBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.localStorage.removeItem('user');
            // navigate back to homepage served by Node
            window.location.href = '/ui/index.html';
        });
    }

    // make sure staff record exists
    await ensureStaffId();
    // fetch existing joborders for mapping and stats
    await loadJoborders();

    // set up navigation
    const navItems = document.querySelectorAll('.nav-item');
    const panels = {
        'Tickets': document.getElementById('panel-tickets'),
        'Workload': document.getElementById('panel-workload'),
        'Accomplishments': document.getElementById('panel-accomplishments')
    };
    function hideAllPanels() {
        Object.values(panels).forEach(p => p && p.classList.add('hidden'));
    }
    function showPanel(name) {
        hideAllPanels();
        const p = panels[name];
        if (p) p.classList.remove('hidden');

        // show/hide stats panel only on tickets
        const statsEl = document.getElementById('statsContainer');
        if (statsEl) statsEl.style.display = name === 'Tickets' ? '' : 'none';

        if (name === 'Tickets') {
            renderTickets();
            loadStats();
        }
        if (name === 'Workload') renderWorkload();
        if (name === 'Accomplishments') renderCompleted();
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

    // Apply saved theme early (dark mode still available)
    function applyTheme(theme) {
        if (theme === 'dark') document.body.classList.add('theme-dark');
        else document.body.classList.remove('theme-dark');
        const tLabel = document.getElementById('themeLabel');
        if (tLabel) tLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
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

    const savedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    const initialTheme = savedSettings.theme || localStorage.getItem('theme') || 'light';
    applyTheme(initialTheme);

    // default view
    showPanel('Tickets');

    // handle change password
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
    // icon toggles embedded inside password fields
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
                const userEmail = sessionStorage.getItem('userEmail') || (currentUser && currentUser.email) || '';
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


});

function ensureStaffId() {
    if (currentStaffId) return Promise.resolve(currentStaffId);
    // include available name info when creating staff record
    const firstName = currentUser.firstName || currentUser.first_name || (currentUser.displayName ? currentUser.displayName.split(' ')[0] : '') || '';
    const lastName = currentUser.lastName || currentUser.last_name || (currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : '') || '';
    currentStaffName = (firstName + ' ' + lastName).trim();
    return fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, firstName: firstName, lastName: lastName })
    }).then(r => r.json()).then(j => {
        if (j && j.success) {
            currentStaffId = j.staffId;
            return currentStaffId;
        }
        throw new Error('Failed to create staff');
    });
}

function loadJoborders() {
    if (!currentStaffId) return Promise.resolve();
    return fetch(`${API_BASE}/api/joborders?staffId=${encodeURIComponent(currentStaffId)}`)
        .then(r => r.json())
        .then(j => {
            allJoborders = [];
            if (j && j.success && Array.isArray(j.data)) {
                allJoborders = j.data.slice();
                j.data.forEach(o => {
                    if (o.ticketId != null) joborderMap[String(o.ticketId)] = o.id;
                });
            }
        })
        .catch(err => console.error('Failed to load joborders', err));
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

function truncate(s,n){ if(!s) return ''; s=String(s); return s.length>n?s.slice(0,n-1)+'…':s; }
function getSubmitterName(t){
    if(!t||typeof t!=='object') return '';
    // Prioritize customer_name (snake_case from DB)
    if(t.customer_name) return String(t.customer_name);
    const first=t.firstName||t.first_name||t.firstname||t.fname||'';
    const last=t.lastName||t.last_name||t.lastname||t.lname||'';
    if(first||last) return (first+' '+last).trim();
    if(t.customerName) return String(t.customerName);
    if(t.customer) return String(t.customer);
    if(t.name) return String(t.name);
    if(t.submitter) return String(t.submitter);
    if(t.submittedBy) return String(t.submittedBy);
    if(t.requesterName) return String(t.requesterName);
    const email = t.email||t.userEmail||t.requesterEmail||t.submitted_email||'';
    if(email&&typeof email==='string'){
        const p=email.split('@')[0].replace(/[._-]/g,' ').replace(/\d+/g,'').trim();
        if(p) return p.split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
    }
    return '';
}

async function renderTickets(){
    const tbody = document.querySelector('#ticketsTable tbody');
    if(!tbody) return;
    tbody.innerHTML='';
    let ticketsData=null;
    try{
        const res=await fetch(`${API_BASE}/api/tickets?includeAccepted=1`, { headers: getTicketHeaders() });
        const data=await res.json();
        if(data&&Array.isArray(data.data)){
            ticketsData=data.data.slice();
            ticketsCache = ticketsData.slice();
        }
    }catch(e){ console.warn('API unavailable for tickets',e); }
    if(!ticketsData) ticketsData = ticketsCache.slice();
    ticketsData.forEach(t=>{
        console.log('renderTickets row', t.id, 'status', t.status);
        const tr=document.createElement('tr');
        let status=(t.status||'Pending').toString();
        // Only show pending tickets - staff should see accepted tickets in workload
        const statNorm = status.toLowerCase();
        if(statNorm !== 'pending') return;
        // display-friendly labels
        if(statNorm === 'awaitingapproval') status = 'Pending';
        const statusClass=status.toLowerCase().replace(/\s+/g,'')||'pending';
        const date=t.createdAt?new Date(t.createdAt).toLocaleDateString():(t.date||'');
        const ticketId=t.ticket_id||t.ticketId||t.ticket_number||t.id||'';
        const serverId=t.id||t.ticketId||t.ticket_number||ticketId||'';
        const submitter=getSubmitterName(t)||t.customer||'';
        const service=t.serviceName||t.service_name||t.service||'';
        const category=t.category||'';
        const description=t.description||t.desc||t.details||t.note||'';
        // actions: Accept or Done based on status
        let actionHtml='';
            const statusNorm = status.toLowerCase().replace(/\s+/g,'');
            if(statusNorm === 'pending'){
                actionHtml=`<button class="small-btn btn-accept" data-id="${serverId}" data-ticketid="${ticketId}">Accept</button>`;
            } else if(statusNorm === 'inprogress'){
                actionHtml=`<button class="small-btn btn-done" data-id="${serverId}" data-ticketid="${ticketId}">Done</button>`;
        } else {
            actionHtml='<span>—</span>';
        }
        tr.innerHTML=`
            <td>#${ticketId}</td>
            <td>${submitter}</td>
            <td>${category}</td>
            <td title="${escapeHtml(String(description))}">${truncate(description,60)}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
            <td class="actions">${actionHtml}</td>
            <td class="view-col"><button class="small-btn btn-view" data-id="${serverId}" data-ticketid="${ticketId}">View</button></td>
        `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-view').forEach(btn => { btn.addEventListener('click', function(){ showTicketDetails(this.getAttribute('data-id')); }); });
    
    // Add event listeners for Accept buttons
    tbody.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', async function(){
            const id = this.getAttribute('data-id');
            try {
                // Update ticket status to inprogress and set accepted info
                const updateResponse = await fetch(`${API_BASE}/api/tickets/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'inprogress',
                        acceptedBy: currentStaffName,
                        acceptedAt: new Date().toISOString()
                    })
                });
                
                const updateData = await updateResponse.json();
                if (!updateData.success) {
                    throw new Error(updateData.message || 'Failed to accept ticket');
                }
                
                // Create joborder
                const joborderResponse = await fetch(`${API_BASE}/api/joborders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        staffId: currentStaffId,
                        ticketId: id,
                        description: 'Accepted ticket for processing'
                    })
                });
                
                const joborderData = await joborderResponse.json();
                if (!joborderData.success) {
                    console.warn('Failed to create joborder:', joborderData.message);
                }
                
                showToast('success', 'Accepted', 'Ticket accepted and added to your workload');
                await loadJoborders();
                renderTickets();
                renderWorkload();
            } catch (error) {
                console.error('Error accepting ticket:', error);
                showToast('error', 'Error', 'Failed to accept ticket');
            }
        });
    });
    
    // Add event listeners for Done buttons
    tbody.querySelectorAll('.btn-done').forEach(btn => {
        btn.addEventListener('click', async function(){
            const id = this.getAttribute('data-id');
            
            // Get ticket details for notification
            const ticket = ticketsCache.find(t => String(t.id) === String(id));
            if (!ticket) {
                showToast('error', 'Error', 'Ticket details not found');
                return;
            }
            
            try {
                // Create notification for admin approval
                const notifResponse = await fetch(`${API_BASE}/api/notifications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticketId: id,
                        staffId: currentStaffId,
                        staffName: currentStaffName,
                        category: ticket.category || ticket.serviceName || '',
                        branch: ticket.branch || '',
                        description: ticket.description || ''
                    })
                });
                
                const notifData = await notifResponse.json();
                if (!notifData.success) {
                    throw new Error(notifData.message || 'Failed to create notification');
                }
                
                // Update joborder status to 'done' (but don't change ticket status yet)
                const joId = joborderMap[String(id)];
                if(joId){
                    await fetch(`${API_BASE}/api/joborders/${joId}`,{
                        method:'PUT',headers:{'Content-Type':'application/json'},
                        body:JSON.stringify({status:'done'})
                    });
                }
                
                showToast('success', 'Submitted', 'Ticket submitted for admin approval');
                renderTickets();
            } catch (error) {
                console.error('Error creating notification:', error);
                showToast('error', 'Error', 'Failed to submit for approval');
            }
        });
    });
}

// render list of items currently assigned to staff (joborders status 'accepted')
async function renderWorkload(){
    const tbody = document.querySelector('#workloadTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    // compute stats first
    loadStats();
    // we already loaded allJoborders earlier
    const items = allJoborders.filter(o => String(o.staffId) === String(currentStaffId) && o.status && o.status.toLowerCase() === 'accepted');
    // ensure tickets available
    if (!ticketsCache.length) {
        try{
            const res = await fetch(`${API_BASE}/api/tickets?includeAccepted=1`);
            const data = await res.json();
            if(data && Array.isArray(data.data)) ticketsCache = data.data.slice();
        }catch(e){ console.warn('Failed to fetch tickets for workload', e); }
    }
    items.reverse().forEach(o=>{
        const t = ticketsCache.find(tx => String(tx.id)===String(o.ticketId) || String(tx.ticketId)===String(o.ticketId) || String(tx.ticket_id)===String(o.ticketId)) || {};
        const tr=document.createElement('tr');
        const rawStatus = (t.status||'Pending').toString().toLowerCase().replace(/\s+/g,'')||'pending';
        const statusDisplay = rawStatus === 'inprogress' ? 'In Progress' : (rawStatus === 'completed' ? 'Completed' : rawStatus);
        const statusClass = rawStatus;
        const date = t.updatedAt?new Date(t.updatedAt).toLocaleDateString():(t.createdAt?new Date(t.createdAt).toLocaleDateString(): '');
        const ticketId = t.ticket_id||t.ticketId||t.ticket_number||t.id||o.ticketId||'';
        const numericId = t.id || o.ticketId || null;
        const submitter=(t.customer_name||'')||(getSubmitterName(t))||t.customer||'';
        const service=t.serviceName||t.service_name||t.service||'';
        let category = t.category||'';
        let description=t.description||t.desc||t.details||t.note||o.description||'';
        // Parse category from description if category is empty (format: "Category | Problem")
        if (!category && description) {
            const pipeIdx = description.indexOf(' | ');
            if (pipeIdx !== -1) {
                category = description.slice(0, pipeIdx);
                description = description.slice(pipeIdx + 3);
            }
        }
        let actionHtml = `<button class="small-btn btn-remark" data-id="${numericId}" data-jo="${o.id}">Remark</button> <button class="small-btn btn-done" data-id="${numericId}" data-jo="${o.id}">Done</button>`;
        tr.innerHTML=`
            <td>#${ticketId}</td>
            <td>${submitter}</td>
            <td>${category}</td>
            <td title="${escapeHtml(String(description))}">${truncate(description,60)}</td>
            <td><span class="status ${statusClass}">${statusDisplay}</span></td>
            <td class="actions">${actionHtml}</td>
            <td class="view-col"><button class="small-btn btn-view" data-id="${numericId}" data-ticketid="${ticketId}">View</button></td>
        `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-done').forEach(btn=>{
        btn.addEventListener('click', async function(){
            const id=this.getAttribute('data-id');
            const jo = this.getAttribute('data-jo');
            
            // Get ticket details for notification
            const ticket = ticketsCache.find(t => String(t.id) === String(id));
            if (!ticket) {
                showToast('error', 'Error', 'Ticket details not found');
                return;
            }
            
            try {
                // Create notification for admin approval
                const notifResponse = await fetch(`${API_BASE}/api/notifications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticketId: id,
                        staffId: currentStaffId,
                        staffName: currentStaffName,
                        category: ticket.category || ticket.serviceName || '',
                        branch: ticket.branch || '',
                        description: ticket.description || ''
                    })
                });
                
                const notifData = await notifResponse.json();
                if (!notifData.success) {
                    throw new Error(notifData.message || 'Failed to create notification');
                }
                
                // Update joborder status to 'done'
                if(jo){
                    await fetch(`${API_BASE}/api/joborders/${jo}`,{
                        method:'PUT',headers:{'Content-Type':'application/json'},
                        body:JSON.stringify({status:'done'})
                    });
                }
                
                showToast('success', 'Submitted', 'Ticket submitted for admin approval');
                await loadJoborders();
                renderWorkload();
            } catch (error) {
                console.error('Error creating notification:', error);
                showToast('error', 'Error', 'Failed to submit for approval');
            }
        });
    });
    tbody.querySelectorAll('.btn-remark').forEach(btn=>{
        btn.addEventListener('click', function(){
            const id = this.getAttribute('data-id');
            currentRemarkTicketId = id;
            const modal = document.getElementById('remarkModal');
            const remarkText = document.getElementById('remarkText');
            
            // Find ticket in cache and get existing remarks
            const ticket = ticketsCache.find(t => String(t.id) === String(id));
            if (ticket && ticket.remarks) {
                remarkText.value = ticket.remarks;
            } else {
                remarkText.value = '';
            }
            
            if (modal) {
                modal.classList.remove('hidden');
                modal.setAttribute('aria-hidden','false');
                modal.style.display = 'block';
                remarkText.focus();
            }
        });
    });
    tbody.querySelectorAll('.btn-view').forEach(btn=>{ btn.addEventListener('click', function(){ showTicketDetails(this.getAttribute('data-id')); }); });
}

// render tickets completed by this staff (joborders status 'done')
async function renderCompleted(){
    // same logic as previous accomplishments renderer

    const tbody = document.querySelector('#accomplishmentsTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    loadStats();
    const items = allJoborders.filter(o => String(o.staffId) === String(currentStaffId) && o.status && o.status.toLowerCase() === 'done');
    if (!ticketsCache.length) {
        try{
            const res = await fetch(`${API_BASE}/api/tickets?includeAccepted=1`);
            const data = await res.json();
            if(data && Array.isArray(data.data)) ticketsCache = data.data.slice();
        }catch(e){ console.warn('Failed to fetch tickets for completed', e); }
    }
    items.reverse().forEach(o=>{
        const t = ticketsCache.find(tx => String(tx.id)===String(o.ticketId) || String(tx.ticketId)===String(o.ticketId) || String(tx.ticket_id)===String(o.ticketId)) || {};
        const tr=document.createElement('tr');
        const ticketId = t.ticketId||t.ticket_number||t.id||o.ticketId||'';
        const numericId = t.id || o.ticketId || null;
        const submitter=(t.customer_name||'')||(getSubmitterName(t))||t.customer||'';
        const service=t.serviceName||t.service_name||t.service||'';
        let category=t.category||'';
        let description=t.description||t.desc||t.details||t.note||o.description||'';
        // Parse category from description if category is empty (format: "Category | Problem")
        if (!category && description) {
            const pipeIdx = description.indexOf(' | ');
            if (pipeIdx !== -1) {
                category = description.slice(0, pipeIdx);
                description = description.slice(pipeIdx + 3);
            }
        }
        const date = t.updatedAt?new Date(t.updatedAt).toLocaleDateString():'';
        tr.innerHTML=`
            <td>#${ticketId}</td>
            <td>${submitter}</td>
            <td>${category}</td>
            <td title="${escapeHtml(String(description))}">${truncate(description,60)}</td>
            <td>${date}</td>
            <td class="view-col"><button class="small-btn btn-view" data-id="${numericId}" data-ticketid="${ticketId}">View</button></td>
        `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-view').forEach(btn=>{ btn.addEventListener('click', function(){ showTicketDetails(this.getAttribute('data-id')); }); });
}

function loadStats(){
    const statsEl = document.getElementById('statsContainer');
    if(!statsEl) return;
    const cards = statsEl.querySelectorAll('.stat-card');
    // staff view uses three cards: total tickets, workload, completed
    if (cards.length === 3) {
        // ensure we have ticket and joborder data loaded already
        const totalTickets = ticketsCache.length;
        const workloadCount = allJoborders.filter(o=> String(o.staffId)===String(currentStaffId) && o.status && o.status.toLowerCase()==='accepted').length;
        const doneCount = allJoborders.filter(o=> String(o.staffId)===String(currentStaffId) && o.status && o.status.toLowerCase()==='done').length;
        cards[0].querySelector('.stat-number').textContent = totalTickets;
        cards[1].querySelector('.stat-number').textContent = workloadCount;
        cards[2].querySelector('.stat-number').textContent = doneCount;
        return;
    }
    // otherwise fall back to admin-style stats
    fetch(`${API_BASE}/api/stats`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.data) {
                const stats = data.data;
                if (cards.length >= 4) {
                    cards[0].querySelector('.stat-number').textContent = stats.total || 0;
                    cards[1].querySelector('.stat-number').textContent = stats.pending || 0;
                    cards[2].querySelector('.stat-number').textContent = stats.completed || 0;
                    cards[3].querySelector('.stat-number').textContent = stats.inprogress || 0;
                }
            }
        })
        .catch(err => console.error('Failed to load stats', err));
}

function showTicketDetails(id) {
    // try using cached tickets first
    let tickets = ticketsCache.slice();
    const openModal = ticket => {
        const modal = document.getElementById('ticketViewModal');
        const form = document.getElementById('ticketViewForm');
        if (!ticket || !modal || !form) {
            if (!ticket) {
                showToast('error','Not found','Ticket not found');
                console.warn('showTicketDetails: ticket not found for', id);
            }
            return;
        }
        const ticketId = ticket.ticketId || ticket.ticket_number || ticket.id || '';
        form.querySelector('#viewTicketId').value = ticketId;

        // category may be embedded in description if not explicit
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
        if (!fname && !lname) {
            const customerName = ticket.customerName || ticket.customer_name || '';
            if (customerName) {
                const parts = customerName.trim().split(/\s+/);
                fname = parts.shift() || '';
                lname = parts.join(' ') || '';
            }
        }
        form.querySelector('#viewFirstName').value = fname;
        form.querySelector('#viewLastName').value = lname;
        form.querySelector('#viewEmail').value = ticket.email || ticket.customerEmail || ticket.userEmail || '';
        form.querySelector('#viewProblem').value = desc;
        form.querySelector('#viewBranch').value = ticket.branch || '';
        form.querySelector('#viewDepartment').value = ticket.department || '';
        // include accepted-by information for approvals
        if (form.querySelector('#viewAcceptedBy')) {
            form.querySelector('#viewAcceptedBy').value = ticket.acceptedByName || ticket.acceptedBy || ticket.accepted_by || '';
        }
        if (form.querySelector('#viewRemarks')) {
            form.querySelector('#viewRemarks').value = ticket.remarks || '';
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    };

    const ticket = tickets.find(x => String(x.id) === String(id) || String(x.ticketId) === String(id));
    if (ticket) return openModal(ticket);

    // fallback to fetching from API if not cached
    fetch(`${API_BASE}/api/tickets?includeAccepted=1`, { headers: getTicketHeaders() }).then(r => r.json()).then(d => {
        const list = Array.isArray(d.data) ? d.data : [];
        ticketsCache = list.slice();
        const t = list.find(x => String(x.id) === String(id) || String(x.ticketId) === String(id));
        openModal(t);
    }).catch(err => {
        console.error('Failed to load ticket for view', err);
        showToast('error','Network','Unable to fetch ticket details');
    });
}

const ticketModal = document.getElementById('ticketViewModal');
const ticketModalClose = document.getElementById('ticketViewClose');

const closeTicketModal = function() {
    if (ticketModal) {
        ticketModal.classList.add('hidden');
        ticketModal.style.display = 'none';
        ticketModal.setAttribute('aria-hidden','true');
    }
};

const openTicketModal = function() {
    if (ticketModal) {
        ticketModal.classList.remove('hidden');
        ticketModal.style.display = 'flex';
        ticketModal.setAttribute('aria-hidden','false');
    }
};

if (ticketModalClose) ticketModalClose.addEventListener('click', closeTicketModal);
if (ticketModal) {
    ticketModal.addEventListener('click', function(e){ if (e.target === ticketModal || e.target.classList.contains('modal-backdrop')) { closeTicketModal(); } });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !ticketModal.classList.contains('hidden')) { closeTicketModal(); } });
}

// Remark modal handlers
const remarkModal = document.getElementById('remarkModal');
const remarkClose = document.getElementById('remarkClose');
const remarkCancelBtn = document.getElementById('remarkCancelBtn');
const remarkForm = document.getElementById('remarkForm');

if (remarkClose) {
    remarkClose.addEventListener('click', function() {
        if (remarkModal) {
            remarkModal.classList.add('hidden');
            remarkModal.setAttribute('aria-hidden','true');
            remarkModal.style.display = 'none';
        }
    });
}

if (remarkCancelBtn) {
    remarkCancelBtn.addEventListener('click', function() {
        if (remarkModal) {
            remarkModal.classList.add('hidden');
            remarkModal.setAttribute('aria-hidden','true');
            remarkModal.style.display = 'none';
        }
    });
}

if (remarkModal) {
    remarkModal.addEventListener('click', function(e) {
        if (e.target === remarkModal || e.target.classList.contains('modal-backdrop')) {
            remarkModal.classList.add('hidden');
            remarkModal.setAttribute('aria-hidden','true');
            remarkModal.style.display = 'none';
        }
    });
}

if (remarkForm) {
    remarkForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const remarkText = document.getElementById('remarkText').value.trim();
        if (!remarkText) {
            showToast('warning', 'Warning', 'Please enter a remark');
            return;
        }
        if (!currentRemarkTicketId) {
            showToast('error', 'Error', 'No ticket selected');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/tickets/${currentRemarkTicketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remarks: remarkText })
            });
            const data = await response.json();
            if (data.success) {
                showToast('success', 'Success', 'Remark saved successfully');
                // Clear cache so renderWorkload fetches fresh data with updated remarks
                ticketsCache = [];
                if (remarkModal) {
                    remarkModal.classList.add('hidden');
                    remarkModal.setAttribute('aria-hidden','true');
                    remarkModal.style.display = 'none';
                }
                renderWorkload();
            } else {
                showToast('error', 'Error', data.message || 'Failed to save remark');
            }
        } catch (error) {
            console.error('Error saving remark:', error);
            showToast('error', 'Error', 'Failed to save remark');
        }
    });
}

async function updateTicketStatus(id,status,acceptedBy){
    try{
        const body = { id };
        if (status !== undefined && status !== null) body.status = status;
        if (acceptedBy !== undefined && acceptedBy !== null) {
            body.accepted_by = acceptedBy;
            body.acceptedBy = acceptedBy;
        }
        const res=await fetch(`${API_BASE}/api/tickets/${encodeURIComponent(id)}`,{
            method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
        });
        const data = await res.json();
        if(data && data.success) return true;
    }catch(e){console.error('Error updating ticket',e);}    
    return false;
}

// global ticket detail viewer
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
        if (!fname && !lname) {
            const customerName = ticket.customerName || ticket.customer_name || '';
            if (customerName) {
                const parts = customerName.trim().split(/\s+/);
                fname = parts.shift() || '';
                lname = parts.join(' ') || '';
            }
        }
        form.querySelector('#viewFirstName').value = fname;
        form.querySelector('#viewLastName').value = lname;
        form.querySelector('#viewEmail').value = ticket.email || ticket.customerEmail || ticket.userEmail || '';
        form.querySelector('#viewProblem').value = desc;
        form.querySelector('#viewBranch').value = ticket.branch || '';
        form.querySelector('#viewDepartment').value = ticket.department || '';
        form.querySelector('#viewAcceptedBy').value = ticket.acceptedByName || ticket.acceptedBy || ticket.accepted_by || '';
        form.querySelector('#viewRemarks').value = ticket.remarks || '';
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden','false');
    }

    // Use ticketsCache if available
    if (window.ticketsCache && Array.isArray(window.ticketsCache)) {
        const ticket = window.ticketsCache.find(x => String(x.id) === String(id) || String(x.ticketId) === String(id) || String(x.ticket_id) === String(id));
        if (ticket) {
            populate(ticket);
            return;
        }
    }

    // fallback to re‑fetching all tickets if we did not find a local match
    fetch(`${API_BASE}/api/tickets?includeAccepted=1`)
        .then(r => r.json())
        .then(d => {
            const list = Array.isArray(d.data) ? d.data : [];
            window.ticketsCache = list.slice();
            const t = list.find(x => String(x.id) === String(id) || String(x.ticketId) === String(id) || String(x.ticket_id) === String(id));
            populate(t);
        })
        .catch(err => {
            console.error('Failed to load ticket for view', err);
            showToast('error','Network','Unable to fetch ticket details');
        });
}
