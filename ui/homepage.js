// Enhanced Main Dashboard Login Form with validation, accessibility, and loading state
(function () {
    console.log('homepage.js executing');
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const emailError = document.getElementById('loginEmailError');
    const passwordError = document.getElementById('loginPasswordError');
    const formError = document.getElementById('loginFormError');
    const signInBtn = document.getElementById('signInBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    console.log('elements', {loginForm, loginEmail, loginPassword, signInBtn});

    // SVG icons for show/hide
    function showIcon() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            + '<path fill="#003f8f" d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"></path>'
            + '<circle fill="#003f8f" cx="12" cy="12" r="2.5"></circle>'
            + '</svg>';
    }

    function hideIcon() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            + '<path fill="#003f8f" d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7 2.13 0 4.14-.8 5.94-2.06L4.05 3.06 5.46 1.65 20.35 16.54 18.94 17.95C20.27 16.98 21.37 15.84 22.24 14.58 20.51 10.19 16.24 7.08 12 7.08c-1.85 0-3.6.48-5.14 1.33L12 12a3.5 3.5 0 0 1 0 7c-1.27 0-2.42-.66-3.06-1.63l1.45-1.45A1.5 1.5 0 0 0 12 17.5a1.5 1.5 0 0 0 0-3c-.28 0-.54.08-.76.2L7.4 10.86C8.95 9.99 10.7 9.5 12.55 9.5c4.24 0 8.51 3.11 10.24 7.5-.87 1.26-1.97 2.4-3.3 3.37L18.24 20l-6.24-6.24L4.2 4.2 5.61 2.79 19.8 17l-1.8 1.8z" />'
            + '<line x1="2" y1="2" x2="22" y2="22" stroke="#003f8f" stroke-width="1.6" />'
            + '</svg>';
    }

    function clearErrors() {
        emailError.textContent = '';
        passwordError.textContent = '';
        formError.textContent = '';
        emailError.setAttribute('aria-hidden', 'true');
        passwordError.setAttribute('aria-hidden', 'true');
    }

    function setButtonLoading(loading) {
        if (loading) {
            signInBtn.disabled = true;
            signInBtn.classList.add('loading');
            signInBtn.setAttribute('aria-busy', 'true');
            signInBtn.innerHTML = '<span class="signin-spinner" aria-hidden="true"></span>Signing in...';
        } else {
            signInBtn.disabled = false;
            signInBtn.classList.remove('loading');
            signInBtn.removeAttribute('aria-busy');
            signInBtn.textContent = 'Sign In';
        }
    }

    function togglePasswordState() {
        const isPassword = loginPassword.type === 'password';
        loginPassword.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.innerHTML = isPassword ? hideIcon() : showIcon();
        togglePasswordBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
        togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        loginPassword.focus();
    }

    togglePasswordBtn.addEventListener('click', function () {
        togglePasswordState();
    });

    // attach login handler if form exists
    if (loginForm) {
        loginForm.addEventListener('submit', loginFormSubmitHandler);
    } else {
        console.warn('loginForm element not found when attaching handler');
    }

    // Keyboard support: Enter or Space toggles the icon
    togglePasswordBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePasswordState();
        }
    });

    // global submit listener fallback
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'loginForm') {
            console.log('global submit intercept');
            e.preventDefault();
            // manually trigger our handler if defined
            if (typeof loginFormSubmitHandler === 'function') {
                loginFormSubmitHandler(e);
            }
        }
    });

    function loginFormSubmitHandler(e) {
        e.preventDefault();
        clearErrors();

        const email = loginEmail.value.trim();
        const password = loginPassword.value || '';

        // Simple email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let firstInvalid = null;

        if (!email) {
            emailError.textContent = 'Please enter your email address.';
            emailError.setAttribute('aria-hidden', 'false');
            firstInvalid = firstInvalid || loginEmail;
        } else if (!emailRegex.test(email)) {
            emailError.textContent = 'Please enter a valid email address.';
            emailError.setAttribute('aria-hidden', 'false');
            firstInvalid = firstInvalid || loginEmail;
        }

        if (!password) {
            passwordError.textContent = 'Please enter your password.';
            passwordError.setAttribute('aria-hidden', 'false');
            firstInvalid = firstInvalid || loginPassword;
        } else if (password.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters.';
            passwordError.setAttribute('aria-hidden', 'false');
            firstInvalid = firstInvalid || loginPassword;
        }

        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        setButtonLoading(true);

        // Send login request to backend
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        })
            .then(async response => {
                const text = await response.text();
                let payload = null;
                try { payload = text ? JSON.parse(text) : null; } catch(e) { /* not JSON */ }

                if (!response.ok) {
                    const msg = (payload && payload.message) ? payload.message : (text || `Server error: ${response.status}`);
                    throw new Error(msg);
                }

                return payload;
            })
            .then(data => {
                console.log('login response', data);
                if (data && data.success) {
                    // Check if email verification is required
                    if (data.requiresVerification) {
                        // Store user ID and role for verification
                        sessionStorage.setItem('userIdForVerification', data.user.id);
                        sessionStorage.setItem('userEmailForVerification', data.user.email);
                        sessionStorage.setItem('userRoleForVerification', data.user.role || 'staff');
                        
                        // Send verification code
                        sendVerificationCode(email);
                        return;
                    }
                    
                    // Email is already verified - proceed to dashboard
                    sessionStorage.setItem('userEmail', email);
                    localStorage.setItem('userEmail', email);
                    // keep user object (with role/id) for other pages
                    try {
                        const userObj = data.user || { email };
                        localStorage.setItem('user', JSON.stringify(userObj));
                    } catch (e) { console.warn('Could not store user object', e); }
                    // Record login audit (attempt to fetch IP/location)
                    const role = data.role || (data.user && data.user.role) || 'User';
                    fetch('https://ipapi.co/json/')
                        .then(r => r.json())
                        .then(loc => {
                            try {
                                const ip = loc.ip || '';
                                const location = [loc.city, loc.region, loc.country_name].filter(Boolean).join(', ');
                                const list = JSON.parse(localStorage.getItem('auditTrail') || '[]');
                                list.push({ id: 'AUD-' + Date.now(), message: `User ${email} logged in`, time: new Date().toLocaleString(), ts: Date.now(), type: 'login', meta: { actor: email, actorRole: role, role: role, ip: ip, location: location } });
                                if (list.length > 200) list.splice(0, list.length - 200);
                                localStorage.setItem('auditTrail', JSON.stringify(list));
                            } catch (e) {
                                console.warn('Could not save audit locally', e);
                            }
                        })
                        .catch(() => {
                            // fallback: only IP
                            fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(j=>{
                                try {
                                    const ip = j.ip || '';
                                    const list = JSON.parse(localStorage.getItem('auditTrail') || '[]');
                                    list.push({ id: 'AUD-' + Date.now(), message: `User ${email} logged in`, time: new Date().toLocaleString(), ts: Date.now(), type: 'login', meta: { actor: email, actorRole: role, role: role, ip: ip } });
                                    if (list.length > 200) list.splice(0, list.length - 200);
                                    localStorage.setItem('auditTrail', JSON.stringify(list));
                                } catch (e) { /* ignore */ }
                            }).catch(()=>{});
                        })
                        .finally(()=> {
                            // choose target based on server-provided redirect or user role
                            const target = data.redirect || ((role && role.toLowerCase() === 'staff') ? '/ui/staff.html' : '/ui/dashboard.html');
                            console.log('navigating to', target);
                            window.location.href = target;
                        });
                } else {
                    formError.textContent = (data && data.message) ? data.message : 'Invalid credentials.';
                    setButtonLoading(false);
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                formError.textContent = error.message || 'Network or server error. Please try again later.';
                setButtonLoading(false);
            });
    };
    // Expose minimal helpers to global scope for verification flow
    // (used by verification functions defined outside this IIFE)
    try {
        window.setButtonLoading = setButtonLoading;
        window.clearLoginErrors = clearErrors;
        window._loginForm = loginForm;
        window._formError = formError;
        window._signInBtn = signInBtn;
    } catch (e) {
        console.warn('Could not expose login helpers to window:', e);
    }
})();

// Ticket Modal Functionality
const ticketModal = document.getElementById('ticketModal');
const createTicketBtn = document.getElementById('createTicketBtn');
const gmailLoginForm = document.getElementById('gmailLoginForm');
const ticketForm = document.getElementById('ticketForm');
const gmailLoginScreen = document.getElementById('gmailLoginScreen');
const ticketFormScreen = document.getElementById('ticketFormScreen');
const modalCloseButtons = document.querySelectorAll('.modal-close');
let currentTicketEmail = '';

// API base helper: when the page is opened via file://, point to localhost:8000
const API_BASE = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') ? 'http://localhost:8000' : '';
function apiFetch(path, opts) {
    return fetch(API_BASE + path, opts);
}

// Function to extract name from email
function extractNameFromEmail(email) {
    // Extract part before @
    let namePart = email.split('@')[0];
    
    // Replace common separators with spaces and clean up
    let name = namePart
        .replace(/[._-]/g, ' ')
        .replace(/\d+/g, '') // Remove numbers
        .trim();
    
    // Split into words and capitalize
    let words = name.split(' ').filter(word => word.length > 0);
    let firstName = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : '';
    let lastName = words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return { firstName, lastName };
}

// Initialize Google Sign-In (optional - only if client ID is configured)
window.onload = function () {
    // Only initialize Google Sign-In if a valid client ID is provided
    const clientId = 'YOUR_GOOGLE_CLIENT_ID_HERE';
    const signInContainer = document.getElementById('googleSignInDiv');
    
    if (clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && signInContainer) {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleSignIn,
                auto_select: true,
                ux_mode: 'popup'
            });
            
            google.accounts.id.renderButton(signInContainer, {
                theme: 'outline',
                size: 'large',
                width: '320',
                locale: 'en'
            });
        } catch (e) {
            console.log('Google Sign-In not configured. Using manual email entry.');
            signInContainer.style.display = 'none';
        }
    } else if (signInContainer) {
        // Hide Google button if no client ID is set
        signInContainer.style.display = 'none';
    }
};

// Handle Google Sign-In callback
function handleGoogleSignIn(response) {
    try {
        // Decode JWT token to get email
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const data = JSON.parse(jsonPayload);
        const email = data.email;
        
        // Validate @gmail.com
        if (!email.endsWith('@gmail.com')) {
            alert('Only @gmail.com emails are accepted');
            return;
        }
        
        // Process the sign-in
        processTicketSignIn(email);
    } catch (error) {
        console.error('Google Sign-In error:', error);
        alert('Error processing Google Sign-In');
    }
}

// Process ticket sign-in (used by both Google and manual email)
function processTicketSignIn(email) {
    // Always treat ticket sign-ins as a fresh verification attempt.  We want the
    // user to type/provide an email address each time they create a ticket, so the
    // only mechanism that runs is the standard verification flow which will send a
    // one‑time code.  The server has been adjusted to issue a code even for already
    // verified addresses.
    currentTicketEmail = email;

    // clear any lingering verification identifiers
    sessionStorage.removeItem('userIdForVerification');
    sessionStorage.removeItem('userEmailForVerification');

    // if a sign‑in button is present, show a loading state while the verification
    // request is in flight; sendVerificationCode also supports window.setButtonLoading
    try { if (window._signInBtn) window._signInBtn.disabled = true; } catch(e){}

    // delegate to the common helper which posts to /api/send-verification-code and
    // displays the code entry UI.  It will re-enable buttons when complete.
    sendVerificationCode(email, 'ticket');
}

// helper for categories dropdowns
let allCategories = [];
// Fixed list for Phlpost Area 3 branches (provided)
const PHLPOST_AREA3_BRANCHES = [
    'Manila Central Post Office',
    'Makati Central Post Office',
    'Quezon City Central Post Office',
    'Pasay City Post Office',
    'Taguig Post Office',
    'Paranaque Post Office',
    'Las Piñas Post office',
    'Marikina Central Post Office',
    'San Juan Central Post Office',
    'Pateros Post Office',
    'Valenzuela Post Office',
    'Caloocan Central Post Office'
];

// Function to populate branches from database
async function populateBranches() {
    const branchSelect = document.getElementById('branchSelect');
    if (!branchSelect) return;

    try {
        const response = await apiFetch('/api/branches');
        const data = await response.json();
        if (data.success && data.data) {
            branchSelect.innerHTML = '<option value="">Select a branch...</option>';
            data.data.forEach(branch => {
                const opt = document.createElement('option');
                opt.value = branch.name;
                opt.textContent = branch.name;
                branchSelect.appendChild(opt);
            });
            const othersOptBranch = document.createElement('option');
            othersOptBranch.value = 'Others';
            othersOptBranch.textContent = 'Others';
            branchSelect.appendChild(othersOptBranch);
        } else {
            // Fallback to hardcoded list if API fails
            console.warn('Failed to load branches from API, using fallback');
            branchSelect.innerHTML = '<option value="">Select a branch...</option>';
            PHLPOST_AREA3_BRANCHES.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.textContent = b;
                branchSelect.appendChild(opt);
            });
            const othersOptBranch = document.createElement('option');
            othersOptBranch.value = 'Others';
            othersOptBranch.textContent = 'Others';
            branchSelect.appendChild(othersOptBranch);
        }
    } catch (error) {
        console.error('Error loading branches:', error);
        // Fallback to hardcoded list
        branchSelect.innerHTML = '<option value="">Select a branch...</option>';
        PHLPOST_AREA3_BRANCHES.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            branchSelect.appendChild(opt);
        });
        const othersOptBranch = document.createElement('option');
        othersOptBranch.value = 'Others';
        othersOptBranch.textContent = 'Others';
        branchSelect.appendChild(othersOptBranch);
    }
}

// helper to load department names from server table
async function populateDepartments() {
    const departmentSelect = document.getElementById('departmentSelect');
    if (!departmentSelect) return;
    try {
        const response = await apiFetch('/api/departments');
        const data = await response.json();
        console.log('populateDepartments received', data);
        if (data.success && Array.isArray(data.data)) {
            departmentSelect.innerHTML = '<option value="">Select a department...</option>';
            data.data.forEach(row => {
                // debug row shape
                console.log('department row', row);
                const opt = document.createElement('option');
                // prefer the department field, trim whitespace, fall back to id if empty
                let name = (row.department || '').toString().trim();
                opt.value = name || (row.id !== undefined ? String(row.id) : '');
                opt.textContent = name || `Dept #${row.id}`;
                departmentSelect.appendChild(opt);
            });
            const othersOpt = document.createElement('option');
            othersOpt.value = 'Others';
            othersOpt.textContent = 'Others';
            departmentSelect.appendChild(othersOpt);
            departmentSelect.disabled = false;
        }
    } catch (err) {
        console.error('Error loading departments:', err);
        departmentSelect.innerHTML = '<option value="">Select a department...</option>';
        // keep disabled only if we couldn't load anything
        departmentSelect.disabled = true;
    }
} // end populateDepartments

function populateMainCategories() {
    const mainSelect = document.getElementById('mainConcern');
    const subSelect = document.getElementById('subConcern');
    const branchSelect = document.getElementById('branchSelect');
    const departmentSelect = document.getElementById('departmentSelect');
    if (!mainSelect || !subSelect) return;
    mainSelect.innerHTML = '<option value="">Select a main category...</option>';
    const mains = [...new Set(allCategories.map(c => c.mainCategory))];
    mains.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        mainSelect.appendChild(opt);
    });
    const othersOptMain = document.createElement('option');
    othersOptMain.value = 'Others';
    othersOptMain.textContent = 'Others';
    mainSelect.appendChild(othersOptMain);
    subSelect.innerHTML = '<option value="">Select a sub category...</option>';
    subSelect.disabled = true;

    // Also populate branch/department selects (restored fields)
    if (branchSelect && departmentSelect) {
        // Populate branches from database
        populateBranches();

        departmentSelect.innerHTML = '<option value="">Select a department...</option>';
        // leave enabled so user can pick even before choosing a branch
    }
}

function loadCategories() {
    apiFetch('/api/services')
        .then(res => res.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                allCategories = data.data;
                populateMainCategories();
            }
        })
        .catch(err => console.error('Error loading categories:', err));
}

// update sub list when main changes
const mainConcernEl = document.getElementById('mainConcern');
if (mainConcernEl) {
    mainConcernEl.addEventListener('change', function () {
        const subSelect = document.getElementById('subConcern');
        subSelect.innerHTML = '<option value="">Select a sub category...</option>';
        const main = this.value;
        if (!main) {
            subSelect.disabled = true;
            return;
        }
        const subs = allCategories.filter(c => c.mainCategory === main).map(c => c.subCategory);
        subs.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            subSelect.appendChild(opt);
        });
        const othersOptSub = document.createElement('option');
        othersOptSub.value = 'Others';
        othersOptSub.textContent = 'Others';
        subSelect.appendChild(othersOptSub);
        subSelect.disabled = false;
    });
}

// Branch/Department restored selects behavior
const branchEl = document.getElementById('branchSelect');
if (branchEl) {
    branchEl.addEventListener('change', function () {
        const dep = document.getElementById('departmentSelect');
        dep.innerHTML = '<option value="">Select a department...</option>';
        // always reload the list; allow selection even when branch is blank
        populateDepartments();
    });
}

// Open modal when "Create a Ticket" is clicked
if(createTicketBtn) {
    createTicketBtn.addEventListener('click', function (e) {
        e.preventDefault();
        currentTicketEmail = '';
        // clear any leftover verification state so the user always starts fresh
        sessionStorage.removeItem('userIdForVerification');
        sessionStorage.removeItem('userEmailForVerification');

        // clear previous form data
        const loggedEl = document.getElementById('loggedInEmail'); if (loggedEl) loggedEl.textContent = '';
        ['firstName','lastName','problemDescription','gmailEmail'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
        const mEl = document.getElementById('mainConcern'); if(mEl) mEl.value='';
        const sEl = document.getElementById('subConcern'); if(sEl){ sEl.innerHTML='<option value="">Select a sub category...</option>'; sEl.disabled=true; }
        const bEl = document.getElementById('branchSelect'); if(bEl) bEl.value='';
        const dEl = document.getElementById('departmentSelect'); if(dEl){ dEl.innerHTML='<option value="">Select a department...</option>'; }
        // populate departments from database immediately (this will enable if successful)
        populateDepartments();
        // clear category field implicitly by resetting main/sub above

        ticketModal.classList.remove('hidden');
        gmailLoginScreen.classList.remove('hidden');
        ticketFormScreen.classList.add('hidden');
        loadCategories();
    });
}

// Close modal when close button is clicked
if(modalCloseButtons && modalCloseButtons.length > 0) {
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            ticketModal.classList.add('hidden');
            gmailLoginScreen.classList.remove('hidden');
            ticketFormScreen.classList.add('hidden');
        });
    });
}

// Close modal when clicking outside of it
// Keep the ticket modal open even if user clicks outside the dialog
// This avoids accidental closure while filling the form
if(ticketModal) {
    ticketModal.addEventListener('click', function (e) {
        if (e.target === ticketModal) {
            // Intentionally do nothing: clicking the backdrop will not close the modal
            // Optionally, we could focus the first input inside the modal here
            try {
                const firstInput = ticketModal.querySelector('input, textarea, select');
                if (firstInput) firstInput.focus();
            } catch (err) { /* ignore */ }
        }
    });
}

// Handle Gmail Login (manual email entry)
if(gmailLoginForm) {
    gmailLoginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const gmailEmail = document.getElementById('gmailEmail').value.trim();
        
        // Validate @gmail.com
        if (!gmailEmail.endsWith('@gmail.com')) {
            alert('Only @gmail.com emails are accepted');
            return;
        }
        
        // Process the sign-in
        processTicketSignIn(gmailEmail);
    });
}

// Forgot Password Modal functionality
(function () {
    const forgotLink = document.getElementById('forgotPasswordLink');
    const forgotModal = document.getElementById('forgotModal');
    const forgotForm = document.getElementById('forgotForm');
    const forgotEmail = document.getElementById('forgotEmail');
    const forgotEmailError = document.getElementById('forgotEmailError');
    const forgotFormMessage = document.getElementById('forgotFormMessage');
    const forgotSubmit = document.getElementById('forgotSubmit');

    if (!forgotLink || !forgotModal) return;

    function openForgot() {
        forgotModal.classList.remove('hidden');
        forgotEmail.focus();
        forgotEmail.value = '';
        forgotEmailError.textContent = '';
        forgotFormMessage.textContent = '';
    }

    function closeForgot() {
        forgotModal.classList.add('hidden');
    }

    forgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        openForgot();
    });

    // Close when clicking outside
    forgotModal.addEventListener('click', function (e) {
        if (e.target === forgotModal) closeForgot();
    });

    // Submit handler
    forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        forgotEmailError.textContent = '';
        forgotFormMessage.textContent = '';

        const email = forgotEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            forgotEmailError.textContent = 'Please enter your email address.';
            forgotEmailError.setAttribute('aria-hidden', 'false');
            forgotEmail.focus();
            return;
        }
        if (!emailRegex.test(email)) {
            forgotEmailError.textContent = 'Please enter a valid email address.';
            forgotEmailError.setAttribute('aria-hidden', 'false');
            forgotEmail.focus();
            return;
        }

        forgotSubmit.disabled = true;
        forgotSubmit.textContent = 'Sending...';

        const params = new URLSearchParams();
        params.append('email', email);

        fetch('php/forgot_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        })
        .then(resp => resp.json())
        .then(data => {
            if (data.success) {
                forgotFormMessage.textContent = data.message || 'If the email exists, a reset link was sent.';
                // keep modal open so user sees message; optionally auto-close
                setTimeout(closeForgot, 3000);
            } else {
                forgotFormMessage.textContent = data.message || 'Unable to send reset link.';
            }
        })
        .catch(err => {
            console.error('Forgot password error', err);
            forgotFormMessage.textContent = 'Network error. Please try again later.';
        })
        .finally(() => {
            forgotSubmit.disabled = false;
            forgotSubmit.textContent = 'Send Reset Link';
        });
    });
})();

// Handle Ticket Submission
if(ticketForm) {
    ticketForm.addEventListener('submit', function (e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const problem = document.getElementById('problemDescription').value.trim();
    const main = document.getElementById('mainConcern').value;
    const sub = document.getElementById('subConcern').value;
    const branchValEl = document.getElementById('branchSelect');
    const deptValEl = document.getElementById('departmentSelect');
    const branchVal = branchValEl ? branchValEl.value : '';
    const deptVal = deptValEl ? deptValEl.value : '';
    
    // validation: if branch/department selects are present require them, otherwise use main/sub
    const usingBranchDept = !!(branchValEl && deptValEl);
    if (!firstName || !lastName || !problem || (!usingBranchDept && (!main || !sub)) || (usingBranchDept && (!branchVal || !deptVal))) {
        alert('Please fill in all fields');
        return;
    }
    // Ensure we have an email for the ticket; try form fields as fallback
    if (!currentTicketEmail) {
        const fallbackEmailInput = document.getElementById('gmailEmail');
        const loggedInEmailEl = document.getElementById('loggedInEmail');
        const fallback = (fallbackEmailInput && fallbackEmailInput.value.trim()) || (loggedInEmailEl && loggedInEmailEl.textContent && loggedInEmailEl.textContent.trim());
        if (fallback) currentTicketEmail = fallback;
    }

    if (!currentTicketEmail) {
        alert('Please provide a Gmail address before submitting the ticket.');
        return;
    }
    // Build payload for server
    // tack main/sub categories onto description as a title line so it is
    // visible in the database record
    const descWithTitle = `${main}${sub ? ' - ' + sub : ''}${problem ? ' | ' + problem : ''}`;

    const payload = {
        firstName: firstName,
        lastName: lastName,
        email: currentTicketEmail,
        problem: problem,
        description: descWithTitle,
        // store the concatenated category separately too
        category: `${main}${sub ? ' - ' + sub : ''}`,
        customerName: (firstName + ' ' + lastName).trim(),
        // prefer explicit branch/department selects if present
        branch: branchVal || main,
        department: deptVal || sub
    };

    console.log('Sending ticket payload:', payload);

    // Disable submit to prevent duplicates
    try { e.target.querySelector('button[type="submit"]').disabled = true; } catch (err) {}

    apiFetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async resp => {
        const text = await resp.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) {}
        if (!resp.ok) throw new Error((data && data.message) ? data.message : 'Server error');
        return data;
    })
    .then(data => {
        if (data && data.success) {
            const serverTicketId = (data.data && data.data.ticketId) ? data.data.ticketId : ('TKT-' + Date.now());

            // Optionally keep a local copy for offline view
            let tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            tickets.push({ id: serverTicketId, firstName, lastName, customerName: (firstName + ' ' + lastName).trim(), email: currentTicketEmail, problem, description: problem, category: `${main}${sub ? ' - ' + sub : ''}`, branch: main, department: sub, createdAt: new Date().toLocaleString(), status: 'pending' });
            localStorage.setItem('tickets', JSON.stringify(tickets));

            // Write a client-side audit entry by calling the audit API
            try {
                apiFetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail: currentTicketEmail, action: 'Submitted ticket', entityType: 'ticket', entityId: serverTicketId, details: { main, sub } })
                }).catch(()=>{});
            } catch (e) {}

            alert(`Ticket created successfully!\nTicket ID: ${serverTicketId}\n\nA confirmation email has been sent to ${currentTicketEmail || 'the provided email'}`);

            // Reset form and close modal
            ticketForm.reset();
            document.getElementById('gmailEmail').value = '';
            // reset new selects
            const mEl = document.getElementById('mainConcern');
            const sEl = document.getElementById('subConcern');
            if (mEl) mEl.value = '';
            if (sEl) { sEl.innerHTML = '<option value="">Select a sub category...</option>'; sEl.disabled = true; }

            ticketModal.classList.add('hidden');
            gmailLoginScreen.classList.remove('hidden');
            ticketFormScreen.classList.add('hidden');
            currentTicketEmail = '';
        } else {
            throw new Error((data && data.message) ? data.message : 'Failed to create ticket');
        }
    })
    .catch(err => {
        console.error('Ticket creation error:', err);
        alert('Failed to create ticket: ' + (err.message || err));
    })
    .finally(() => {
        try { e.target.querySelector('button[type="submit"]').disabled = false; } catch (err) {}
    });
    });
}

// Send ticket confirmation email
function sendTicketConfirmationEmail(ticket) {
    const emailData = {
        email: ticket.email,
        firstName: ticket.firstName,
        lastName: ticket.lastName,
        ticketId: ticket.id,
        problem: ticket.problem,
        branch: ticket.branch,
        department: ticket.department,
        createdAt: ticket.createdAt
    };
    
    // Send to backend
    apiFetch('/send-ticket-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Confirmation email sent successfully');
        } else {
            console.log('Email sent (backend may not be configured with SMTP)');
        }
    })
    .catch(error => {
        console.log('Note: Email service not configured, but ticket was created');
    });
}

// ============ EMAIL VERIFICATION FUNCTIONALITY ============

// Send verification code
// Send verification code (context: 'login' or 'ticket')
function sendVerificationCode(email, context = 'login') {
    try { window.setButtonLoading && window.setButtonLoading(true); } catch(e){}
    
    const params = new URLSearchParams();
    params.append('email', email);
    
        apiFetch('/api/send-verification-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    })
    .then(async response => {
        const text = await response.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch(e) { /* not JSON */ }
        
        if (!response.ok) {
            const msg = (data && data.message) ? data.message : (text || `Server error: ${response.status}`);
            throw new Error(msg);
        }
        
        return data;
    })
    .then(data => {
        try { window.setButtonLoading && window.setButtonLoading(false); } catch(e){}
        try { if (window._signInBtn) window._signInBtn.disabled = false; } catch(e){}

        if (data && data.success) {
            console.log('[VERIFY] Code sent successfully');
            
            // Save userId returned by server for verification flow
            if (data.userId) sessionStorage.setItem('userIdForVerification', data.userId);

            // For development - show code in console if available
            if (data.code) {
                console.log('[VERIFY] Development code:', data.code);
            }
            
            // Show verification screen (pass context so it knows what to do after)
            showVerificationScreen(email, context);
        } else {
            try { window._formError && (window._formError.textContent = (data && data.message) ? data.message : 'Failed to send verification code.'); } catch(e){}
        }
    })
    .catch(error => {
        console.error('Verification error:', error);
        try { window._formError && (window._formError.textContent = error.message || 'Failed to send verification code.'); } catch(e){}
        try { window.setButtonLoading && window.setButtonLoading(false); } catch(e){}        try { if (window._signInBtn) window._signInBtn.disabled = false; } catch(e){}    });
}

// Show verification screen
function showVerificationScreen(email, context = 'login') {
    // Create a temporary verification container if it doesn't exist
    let verificationContainer = document.getElementById('verificationContainer');
    if (!verificationContainer) {
        verificationContainer = document.createElement('div');
        verificationContainer.id = 'verificationContainer';
        verificationContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0, 63, 143, 0.15);
            z-index: 1000;
            width: 90%;
            max-width: 400px;
        `;
        document.body.appendChild(verificationContainer);
    }
    
    verificationContainer.innerHTML = `
        <button id="closeVerification" class="modal-close" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        <div class="verification-header">
            <h2>Verify Your Email</h2>
            <p>We sent a 6-digit code to: <span>${email}</span></p>
        </div>
        <form id="verificationFormTemp">
            <label>Verification Code</label>
            <input type="text" id="verificationCodeTemp" placeholder="000000" maxlength="6" inputmode="numeric" required autocomplete="off" style="
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 18px;
                text-align: center;
                letter-spacing: 5px;
            ">
            <div id="verificationErrorTemp" class="field-error" style="color: #c4161c; margin: 10px 0;"></div>
            <p class="modal-note" style="color: #666; font-size: 14px;">Code expires in 5 minutes</p>
            <button type="submit" class="btn-primary" style="
                width: 100%;
                padding: 12px;
                background: #003f8f;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                margin: 15px 0;
            ">Verify Email</button>
            <button type="button" id="resendCodeBtnTemp" class="btn-secondary" style="
                width: 100%;
                padding: 12px;
                background: #f0f0f0;
                color: #333;
                border: 1px solid #ddd;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            ">Resend Code</button>
        </form>
    `;
    
    verificationContainer.style.display = 'block';
    
    const verificationFormTemp = document.getElementById('verificationFormTemp');
    const verificationCodeTemp = document.getElementById('verificationCodeTemp');
    const verificationErrorTemp = document.getElementById('verificationErrorTemp');
    const resendCodeBtnTemp = document.getElementById('resendCodeBtnTemp');
    const closeVerificationBtn = document.getElementById('closeVerification');
    
    verificationCodeTemp.focus();
    
    // Handle verification code submission
    verificationFormTemp.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const code = verificationCodeTemp.value.trim();
        const userId = sessionStorage.getItem('userIdForVerification');
        
        if (!code || code.length !== 6) {
            verificationErrorTemp.textContent = 'Please enter a valid 6-digit code.';
            return;
        }
        
        // Show loading spinner
        verificationFormTemp.style.display = 'none';
        verificationErrorTemp.textContent = '';
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'verification-loading';
        loadingDiv.innerHTML = `
            <div class="verification-spinner"></div>
            <p>Verifying your email...</p>
        `;
        verificationFormTemp.parentNode.insertBefore(loadingDiv, verificationFormTemp);
        
        // Verify code with backend
            const params = new URLSearchParams();
            params.append('email', email);
            params.append('code', code);
        
            try {
                const response = await apiFetch('/api/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });
            
            const text = await response.text();
            let data = null;
            try { data = text ? JSON.parse(text) : null; } catch(e) { /* not JSON */ }
            
            if (!response.ok) {
                const msg = (data && data.message) ? data.message : (text || `Verification failed`);
                verificationErrorTemp.textContent = msg;
                verificationFormTemp.style.display = 'block';
                loadingDiv.remove();
                return;
            }
            
            if (data && data.success) {
                // Email verified successfully
                console.log('[VERIFY] Email verified, context:', context);
                
                // Clean up
                sessionStorage.removeItem('userIdForVerification');
                sessionStorage.removeItem('userEmailForVerification');
                
                if (context === 'login') {
                    // LOGIN CONTEXT: log user in and redirect to dashboard
                    sessionStorage.setItem('userEmail', email);
                    localStorage.setItem('userEmail', email);
                    
                    // Store user object for other pages (retrieve from sessionStorage if available)
                    const role = sessionStorage.getItem('userRoleForVerification') || 'staff';
                    sessionStorage.removeItem('userRoleForVerification');
                    
                    try {
                        const userObj = { email, role };
                        localStorage.setItem('user', JSON.stringify(userObj));
                    } catch (e) { console.warn('Could not store user object', e); }
                    
                    // Show success message
                    loadingDiv.innerHTML = '<h2 style="color: #003f8f; text-align: center; margin: 0;">✓ Email Verified!</h2><p style="text-align: center; margin-top: 20px;">Redirecting to dashboard...</p>';
                    
                    // Redirect after a short delay - use role-based routing
                    setTimeout(() => {
                        const target = role.toLowerCase() === 'staff' ? '/ui/staff.html' : '/ui/dashboard.html';
                        window.location.href = target;
                    }, 1500);
                } else if (context === 'ticket') {
                    // TICKET CONTEXT: show ticket form (don't log in)
                    loadingDiv.innerHTML = '<h2 style="color: #003f8f; text-align: center; margin: 0;">✓ Email Verified!</h2>';
                    
                    // Wait a moment then show ticket form
                    setTimeout(() => {
                        currentTicketEmail = email;
                        document.getElementById('loggedInEmail').textContent = email;
                        
                        // Extract and populate name fields
                        const { firstName, lastName } = extractNameFromEmail(email);
                        document.getElementById('firstName').value = firstName;
                        document.getElementById('lastName').value = lastName;
                        
                        // Close verification container and show ticket form
                        verificationContainer.style.display = 'none';
                        // ensure categories are loaded before user types
                        loadCategories();
                        gmailLoginScreen.classList.add('hidden');
                        ticketFormScreen.classList.remove('hidden');
                    }, 800);
                }
            } else {
                verificationErrorTemp.textContent = (data && data.message) ? data.message : 'Verification failed.';
                verificationFormTemp.style.display = 'block';
                loadingDiv.remove();
            }
        } catch (error) {
            console.error('Verification error:', error);
            verificationErrorTemp.textContent = error.message || 'Network or server error.';
            verificationFormTemp.style.display = 'block';
            loadingDiv.remove();
        }
    });
    
    // Handle resend code
    resendCodeBtnTemp.addEventListener('click', function (e) {
        e.preventDefault();
        resendCodeBtnTemp.disabled = true;
        resendCodeBtnTemp.textContent = 'Resending...';
        
        // Send verification code again
        const params = new URLSearchParams();
        params.append('email', email);
        
        apiFetch('/api/send-verification-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        })
        .then(async response => {
            const text = await response.text();
            let data = null;
            try { data = text ? JSON.parse(text) : null; } catch(e){}
            return data;
        })
        .then(data => {
            if (data && data.success) {
                verificationErrorTemp.textContent = 'Code resent! Check your email.';
                verificationErrorTemp.style.color = '#003f8f';
                verificationCodeTemp.value = '';
                
                // For development
                if (data.code) {
                    console.log('[VERIFY] New code:', data.code);
                }
                
                setTimeout(() => {
                    resendCodeBtnTemp.disabled = false;
                    resendCodeBtnTemp.textContent = 'Resend Code';
                    verificationErrorTemp.textContent = '';
                }, 3000);
            } else {
                verificationErrorTemp.textContent = (data && data.message) ? data.message : 'Failed to resend code.';
                resendCodeBtnTemp.disabled = false;
                resendCodeBtnTemp.textContent = 'Resend Code';
            }
        })
        .catch(error => {
            console.error('Resend error:', error);
            verificationErrorTemp.textContent = 'Failed to resend code.';
            resendCodeBtnTemp.disabled = false;
            resendCodeBtnTemp.textContent = 'Resend Code';
        });
    });
    
    // Handle close button
    closeVerificationBtn.addEventListener('click', function (e) {
        e.preventDefault();
        verificationContainer.style.display = 'none';
        if (context === 'ticket') {
            // Going back to ticket modal - show Gmail login screen again
            gmailLoginScreen.classList.remove('hidden');
            ticketFormScreen.classList.add('hidden');
        } else {
            // Going back to login form
            try { if (window._loginForm) window._loginForm.style.display = 'block'; } catch(e){}
            try { if (document.querySelector('.login-box')) document.querySelector('.login-box').style.display = 'block'; } catch(e){}
        }
        sessionStorage.removeItem('userIdForVerification');
        sessionStorage.removeItem('userEmailForVerification');
    });
}
