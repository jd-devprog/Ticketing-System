# Email Verification Flow Diagram

## Complete User Journey - Email Verification System

```
┌─────────────────────────────────────────────────────────────────────┐
│                     POST OFFICE MIS - LOGIN FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

FIRST TIME LOGIN (User has not verified email yet)
═════════════════════════════════════════════════════════════════════

User enters email & password
         ↓
    [Login Form]
    admin@example.com
    Password123!
         ↓
┌─────────────────────────────────────┐
│   Server validates credentials      │
│   Checks database for user          │
│   Compares password (bcrypt)        │
└─────────────────────────────────────┘
         ↓
    ✓ User found
    ✓ Password correct
    ✓ isVerified = false ← KEY CHECK!
         ↓
   Generate 6-digit code
   Store in memory with 5min timer
         ↓
┌──────────────────────────────────────────┐
│  IF EMAIL CONFIGURED (enabled: true)     │
│  ├─ Use nodemailer                       │
│  ├─ Send code to user@example.com        │
│  └─ User receives email with code        │
│                                          │
│  IF EMAIL NOT CONFIGURED (enabled: false)│
│  ├─ Code printed in server terminal      │
│  └─ Developer copies code for testing    │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│    [VERIFICATION SCREEN - Browser]       │
│                                          │
│    "We sent a 6-digit code to:           │
│     admin@example.com"                   │
│                                          │
│    [Enter Code: ______ ]                 │
│    [Verify Email] [Resend Code]          │
└──────────────────────────────────────────┘
         ↓
    User enters code
    Clicks "Verify Email"
         ↓
┌──────────────────────────────────────────┐
│   Server verifies code:                  │
│   1. Code exists? ✓                      │
│   2. Not expired? ✓                      │
│   3. Matches input? ✓                    │
│   4. Update database:                    │
│      isVerified = true                   │
│   5. Clear code from memory              │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│    [SUCCESS SCREEN - Browser]            │
│                                          │
│    ✓ Email Verified!                     │
│    Redirecting to dashboard...           │
│    (1.5 second countdown)                │
└──────────────────────────────────────────┘
         ↓
      [DASHBOARD]
      User successfully logged in
      Profile shows: admin@example.com



SUBSEQUENT LOGINS (User already verified)
═════════════════════════════════════════════════════════════════════

User enters same credentials
         ↓
    [Login Form]
    admin@example.com
    Password123!
         ↓
┌─────────────────────────────────────┐
│   Server validates credentials      │
│   isVerified = true ← DIFFERENT!    │
└─────────────────────────────────────┘
         ↓
    ✓ Direct login success
    ✗ NO verification screen
         ↓
      [DASHBOARD]
      User immediately logged in



ERROR SCENARIOS
═════════════════════════════════════════════════════════════════════

Scenario 1: Wrong Code
    ├─ [Verification Screen]
    ├─ User enters: 999999
    ├─ Server checks: "Incorrect verification code"
    ├─ User can try again
    └─ Or click "Resend Code"

Scenario 2: Code Expired (>5 minutes)
    ├─ User takes too long
    ├─ Server says: "Code expired. Request a new one."
    ├─ User clicks "Resend Code"
    ├─ New code generated
    ├─ New 5-minute timer starts
    └─ User enters new code

Scenario 3: Lost Code
    ├─ User doesn't see email
    ├─ Click "Resend Code"
    ├─ New code sent to inbox
    ├─ (Or check terminal if no email configured)
    └─ Try again



DATABASE IMPACT
═════════════════════════════════════════════════════════════════════

BEFORE verification:
┌────────────────────────────────────┐
│ users table                        │
├────────────────────────────────────┤
│ id  │  email                 │ ... │
│ 1   │ admin@example.com      │ ... │
│ isVerified = 0 (false)             │
└────────────────────────────────────┘

AFTER verification:
┌────────────────────────────────────┐
│ users table                        │
├────────────────────────────────────┤
│ id  │  email                 │ ... │
│ 1   │ admin@example.com      │ ... │
│ isVerified = 1 (true) ← CHANGED!   │
└────────────────────────────────────┘



CODE GENERATION PROCESS
═════════════════════════════════════════════════════════════════════

1. POST /api/send-verification-code
   ├─ Receive email address
   ├─ Generate random 6-digit code (100000-999999)
   ├─ Calculate expiry time (now + 5 minutes)
   ├─ Store in verificationCodes object:
   │  {
   │    'admin@example.com': {
   │      code: '122669',
   │      expiresAt: 1707633456789
   │    }
   │  }
   └─ Return response with code (dev mode only)

2. Code validation happens when user submits:
   ├─ Check if code exists in memory
   ├─ Check if current time < expiresAt
   ├─ Check if code matches user input
   └─ If all pass: Update database, success!



EMAIL SENDING (If Configured)
═════════════════════════════════════════════════════════════════════

Gmail Setup (Optional):
    1. Enable 2FA in Google Account
    2. Go to apppasswords.google.com
    3. Select Mail + Device
    4. Generate 16-char password
    5. Update config.js:
       ├─ enabled: true
       ├─ from: yourEmail@gmail.com
       ├─ user: yourEmail@gmail.com
       └─ pass: xxxx xxxx xxxx xxxx
    6. Restart server

Email Content (Sent to user):
    ┌───────────────────────────────┐
    │ From: your-email@gmail.com    │
    │ To: admin@example.com         │
    │ Subject: Email Verification   │
    │                               │
    │ Your verification code is:    │
    │                               │
    │ ╔═════════════════════════╗   │
    │ ║   1 2 2 6 6 9           ║   │
    │ ╚═════════════════════════╝   │
    │                               │
    │ This code expires in 5 mins   │
    │ Do not share with anyone      │
    └───────────────────────────────┘



TIMELINE EXAMPLE
═════════════════════════════════════════════════════════════════════

14:30:00  User enters credentials → Login form submits
14:30:01  Server generates code 122669 → Expires at 14:35:01
14:30:02  Email sent (if configured) or code shown in console
14:30:03  User sees verification screen in browser

14:30:10  User receives email
14:30:15  User copies code: 122669

14:30:20  User enters code in browser form
14:30:21  Verification request sent to server
14:30:22  Server validates: ✓ Code exists ✓ Not expired ✓ Matches
14:30:23  Database updated: isVerified = 1
14:30:24  Success screen shown
14:30:26  Dashboard loaded

Next day:
09:00:00  User logs in again
09:00:01  Server checks: isVerified = 1 (already verified)
09:00:02  Direct login, no verification needed!



DEVELOPMENT VS PRODUCTION
═════════════════════════════════════════════════════════════════════

DEVELOPMENT MODE:
├─ config.js: enabled = false
├─ Codes stored in memory of current process
├─ Codes printed to terminal for testing
├─ Codes lost if server restarts
├─ Perfect for: Testing, debugging, development
└─ Limitation: No real email sending

PRODUCTION MODE:
├─ config.js: enabled = true (with real credentials)
├─ Codes sent via Gmail SMTP
├─ Still in-memory (for simplicity)
├─ Consider: Database storage for persistence
├─ Requires: Gmail app password configured
└─ Better for: Real users expecting emails

FUTURE IMPROVEMENT:
├─ Move codes to database (not in-memory)
├─ Add rate limiting on code generation
├─ Log all verification attempts
├─ Add cooldown between resend requests
└─ Implement CAPTCHA for repeated failures
```

## Quick Status Check

| Component | Status | Location |
|-----------|--------|----------|
| Database schema | ✅ Added | `isVerified` column in `users` |
| Code generation | ✅ Working | Server: `/api/send-verification-code` |
| Code verification | ✅ Working | Server: `/api/verify-email` |
| Frontend screens | ✅ Ready | `ui/homepage.html` + `ui/homepage.js` |
| Email sending | 🔄 Optional | `config.js` + nodemailer |
| Test user setup | ✅ Ready | `admin@example.com` (unverified) |
| Documentation | ✅ Complete | 3 guide files included |

---

## Color Legend

- **✓** = Implemented and verified
- **✗** = Not available or blocked
- **🔄** = Optional feature
- **⚠️** = Requires action
- **🎯** = Next step

---

Have fun testing email verification! 🎉
