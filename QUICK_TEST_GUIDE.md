# Email Verification - Quick Test Guide

## Test Using Development Mode (No Gmail Setup Required)

### Prerequisites
- Server running: `node server.js`
- Database initialized: `npm run setup`

### Step 1: Reset Admin User Verification Status

```bash
# Open MySQL
mysql -u root postoffice

# Mark admin user as not verified
UPDATE users SET isVerified = 0 WHERE email = 'admin@example.com';

# Verify it worked
SELECT email, isVerified FROM users WHERE email = 'admin@example.com';
```

You should see: `isVerified = 0`

### Step 2: Open Browser and Test Login

1. Go to `http://localhost:8000`
2. Enter credentials:
   - **Email**: `admin@example.com`
   - **Password**: `Password123!`
3. Click **Sign In**

### Step 3: Watch for Verification Screen

**First time**, you'll see:
- "We sent a 6-digit code to: admin@example.com"
- Input field for verification code
- "Resend Code" button

**Important**: Since email is not configured yet, check the **server console** (terminal running `node server.js`) for the verification code.

You'll see a line like:
```
[VERIFY] Generated code for admin@example.com: 123456
[VERIFY] Development code: 123456
```

### Step 4: Enter the Code

1. Copy the 6-digit code from server console
2. Paste into the verification code field in browser
3. Click **Verify Email**

### Step 5: Success!

You should see:
- ✓ Email Verified!
- Dashboard loads automatically

### Step 6: Second Login (No Verification)

1. Log out (or close browser)
2. Go back to login page
3. Enter same credentials
4. Click Sign In

**Expected**: You should go **directly to dashboard** without verification screen!

---

## Browser Console Tricks

Open DevTools (`F12` or `Right-click → Inspect → Console`) to see:

```
[VERIFY] Code sent successfully
[VERIFY] Development code: 123456
```

---

## Database Tracking

Check verification status anytime:

```bash
mysql -u root postoffice
SELECT id, email, isVerified FROM users;
```

Example output:
```
+----+-------------------+-------------+
| id | email             | isVerified  |
+----+-------------------+-------------+
|  1 | admin@example.com |      1      |  ← Verified
+----+-------------------+-------------+
```

---

## Reset for Re-Testing

Want to test multiple times?

```bash
mysql -u root postoffice
UPDATE users SET isVerified = 0 WHERE email = 'admin@example.com';
```

Then login again and repeat the verification flow.

---

## Common Issues

### Can't See Verification Screen?

**Possible Causes**:
1. User already verified → Check database: `SELECT isVerified FROM users WHERE email = '...'`
2. Login failed → Check error message in login box
3. Server not running → Check terminal running `node server.js`

**Fix**:
- Reset `isVerified = 0` in database
- Reload browser
- Try login again

### Code Doesn't Work?

```
❌ "Incorrect verification code"
```

**Causes**:
1. Mistyped the 6 digits
2. Code expired (>5 minutes have passed)
3. Different user tried to verify others' codes

**Fix**:
- Copy code directly from console (don't type)
- Click "Resend Code" if expired
- Make sure it's a 6-digit number

### Code Expired?

```
❌ "Verification code expired. Request a new one."
```

**Why**: 5 minutes have passed since code was sent

**Fix**:
1. Browse still shows verification screen
2. Click "Resend Code"
3. New code appears in console
4. Enter new code

---

## Ready to Add Gmail?

Once you're comfortable with the flow, **enable email sending**:

1. Get Gmail app password (see EMAIL_VERIFICATION_SETUP.md)
2. Update `config.js` with real credentials
3. Change `enabled: true`
4. Restart: `node server.js`
5. Test again - codes will now go to real inbox!

---

Happy testing! 🎉
