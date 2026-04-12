# Email Verification Setup Guide

This Post Office MIS system now includes **email verification** for enhanced security. When a user logs in for the first time, they'll receive a 6-digit verification code via email to confirm their identity.

## How It Works

1. **First Login**: User enters email and password
2. **Verification Required**: If email is not yet verified, system sends a 6-digit code
3. **Code Entry**: User enters the code they received in their email
4. **Marked Verified**: Once verified, the email is marked as verified in the database
5. **Future Logins**: User can log in normally without verification again

**Verification Code Validity**: 5 minutes

---

## Configuration Steps

### Step 1: Enable Email Service (Gmail)

You need to set up Gmail's App Password to send emails from your application.

#### A. Go to Google Account Settings

1. Visit: https://myaccount.google.com/apppasswords
2. You may need to sign in
3. You might be asked to verify your identity (enter password or use 2FA)

#### B. Generate App Password

1. Select **Mail** from the dropdown
2. Select **Windows Computer** from the device dropdown
3. Click **Generate**
4. Google will show a 16-character password like: `xxxx xxxx xxxx xxxx`
5. **Copy the entire password** (without spaces)

#### C. Add Credentials to Your Config

Open `config.js` and update the email configuration:

```javascript
const emailConfig = {
    enabled: true,  // ← Change this to true
    service: 'gmail',
    from: 'your-email@gmail.com',      // ← Your Gmail address
    user: 'your-email@gmail.com',      // ← Your Gmail address
    pass: 'xxxx xxxx xxxx xxxx'         // ← Paste the 16-char password here
};
```

**Example:**
```javascript
const emailConfig = {
    enabled: true,
    service: 'gmail',
    from: 'postoffice.system@gmail.com',
    user: 'postoffice.system@gmail.com',
    pass: 'abcd efgh ijkl mnop'
};
```

---

## Development / Testing (Without Email)

If you don't want to set up Gmail yet, you can test verification codes in the browser console:

1. **Don't enable email** in `config.js` (keep `enabled: false`)
2. When you try to log in with an unverified email:
   - The server will generate a code and store it in memory
   - The code will be **printed in the server console** and **browser console**
3. You can then enter that code in the verification screen

**Example Console Output:**
```
[VERIFY] Generated code for user@example.com: 123456
[VERIFY] Development code: 123456
```

---

## Testing Email Verification

### Test 1: Unverified User Login

1. Make sure the admin user (`admin@example.com`) is not verified:
   ```bash
   mysql -u root -p postoffice
   UPDATE users SET isVerified = 0 WHERE email = 'admin@example.com';
   ```

2. Try to log in with: `admin@example.com` / `Password123!`

3. **Expected Result**:
   - Login succeeds
   - Verification screen appears asking for a 6-digit code
   - If email enabled: Code sent to inbox
   - If email disabled: Code shown in console

4. Enter the verification code

5. **Expected Result**:
   - "✓ Email Verified!" message
   - Redirected to dashboard

### Test 2: Verified User Login

1. Once verified, try logging in again with the same credentials

2. **Expected Result**:
   - No verification screen appears
   - Directly logged in to dashboard

### Test 3: Resend Code

1. During verification, if you click "Resend Code"

2. **Expected Result**:
   - New code generated
   - Message: "Code resent! Check your email."

---

## Database Changes

The system automatically added:

**New Column in `users` table:**
- `isVerified` (BOOLEAN, default: false)

Once a user verifies their email, this column is set to `true`.

---

## Verification Code API Endpoints

### 1. Send Verification Code
```
POST /api/send-verification-code
Body: email=user@example.com

Response: {
  success: true,
  message: "Verification code sent to email",
  code: "123456" // Only in development mode
}
```

### 2. Verify Email Code
```
POST /api/verify-email
Body: email=user@example.com&code=123456&userId=1

Response: {
  success: true,
  message: "Email verified successfully"
}
```

---

## Troubleshooting

### "Failed to send verification code"

**Cause**: Email service not configured or credentials wrong

**Fix**:
1. Check `config.js` - is `enabled` set to `true`?
2. Verify Gmail app password is correct (no spaces when pasting)
3. Check browser console for detailed error
4. Disable `enabled: false` to use development mode (codes in console)

### "Code expired" Error

**Cause**: More than 5 minutes have passed

**Fix**:
- Click "Resend Code" to get a new one

### "Incorrect verification code"

**Cause**: Wrong 6-digit code entered

**Fix**:
- Check email again for correct code
- Or click "Resend Code"

### Gmail App Password Issues

**Problem**: "Invalid credentials" error from Gmail

**Solution**:
1. Make sure you used "App Passwords" (not regular password)
2. Visit https://myaccount.google.com/apppasswords
3. Confirm 2-Step Verification is enabled
4. Generate a **new** app password
5. Copy without spaces: `xxxx xxxx xxxx xxxx`
6. Test with simpler email first (no special chars)

---

## Security Notes

1. **Verification codes** expire after 5 minutes
2. **Codes are 6 digits** - not stored in logs or user-visible normally
3. **Database column** tracks verification status per user
4. **Email addresses** can be verified only once (unless admin resets)
5. **In production**: Use a proper database storage for codes, not in-memory

---

## Resetting Verification Status

If you need to force re-verification for a user:

```bash
mysql -u root -p postoffice
UPDATE users SET isVerified = 0 WHERE email = 'user@example.com';
```

They'll need to verify again on next login.

---

## Next Steps

- ✅ Database column added automatically
- ✅ Frontend screens created
- ✅ Backend endpoints implemented
- **TODO**: Configure Gmail credentials in `config.js` (optional)
- **TODO**: Test login flow in browser

---

## Quick Start

1. **Config.js is already set up** with placeholder values
2. **To enable email**: 
   - Get Gmail app password
   - Update `config.js`
   - Restart server: `node server.js`
3. **To test without email**:
   - Keep `enabled: false`
   - Codes appear in console during testing

Enjoy your email verification system! 🎉
