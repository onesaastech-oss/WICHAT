# WhatsApp Embedded Signup - Troubleshooting Guide

## Error: "Failed to share WhatsApp Business account with partners"

This error occurs during the Facebook Embedded Signup flow and is typically related to Meta App configuration or permissions issues.

---

## Common Causes & Solutions

### 1. **Meta App Configuration Issues**

#### Check App Settings in Meta Developer Portal:
1. Go to [Meta Developer Portal](https://developers.facebook.com/apps/)
2. Select your app (App ID: `665558946509856`)
3. Verify the following:

#### Required Settings:

**App Type:**
- Must be set to **"Business"** type app

**WhatsApp Product:**
- WhatsApp must be added to your app
- Go to "Add Products" → Add "WhatsApp"

**App Review:**
- Check if your app has the necessary permissions approved
- Required permissions:
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`

---

### 2. **Configuration ID Issues**

Current Config ID: `1275572191131467`

#### Verify Configuration:
1. Go to Meta App Dashboard → WhatsApp → Configuration
2. Check if the Configuration ID is correct and active
3. Verify the configuration includes:
   - Callback URL (if required)
   - Redirect URIs
   - Allowed domains

#### Create New Configuration (if needed):
1. Go to WhatsApp → Configuration
2. Click "Create New Configuration"
3. Set up the configuration with proper callback URLs
4. Update `META_CONFIG_ID` in the code

---

### 3. **Business Portfolio/Business Manager Issues**

#### Requirements:
- The Meta App must be associated with a **Business Portfolio**
- The Business Portfolio must have proper permissions

#### Steps to Fix:
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Select your Business Portfolio
3. Go to "Business Settings" → "Apps"
4. Verify your app is listed and has proper permissions
5. Add the app if it's not listed:
   - Click "Add" → "Add App"
   - Enter App ID: `665558946509856`
   - Grant necessary permissions

---

### 4. **System User & Permissions**

#### Create System User (if not exists):
1. Go to Business Settings → Users → System Users
2. Create a new System User
3. Assign the following permissions:
   - WhatsApp Business Management
   - WhatsApp Business Messaging
   - Business Management

#### Generate Access Token:
1. Select the System User
2. Generate a new token
3. Select your app
4. Choose the required permissions
5. Save the token securely

---

### 5. **App Mode**

#### Check App Mode:
1. In Meta Developer Portal, check if app is in **"Live"** mode
2. If in "Development" mode:
   - Only test users can access the embedded signup
   - Switch to "Live" mode for production use

#### Switch to Live Mode:
1. Complete all required Business Verification
2. Submit app for review if needed
3. Toggle "App Mode" to "Live"

---

### 6. **Domain Verification**

#### Verify Your Domain:
1. Go to App Settings → Basic
2. Add your domain to "App Domains"
3. Verify the domain ownership
4. Add domain to "Website" field

For local development:
- Use `localhost` or `127.0.0.1`
- Or use a tunneling service like ngrok with HTTPS

---

### 7. **Callback URL Configuration**

#### Update Callback URLs:
1. Go to WhatsApp → Configuration
2. Add your callback URL
3. Verify the URL is accessible and returns 200 OK
4. Must use HTTPS in production

Example callback URL:
```
https://yourdomain.com/api/meta/complete
```

---

## Code-Level Debugging

### Enable Debug Mode:

Add this to your code to see detailed logs:

```javascript
// In handleMessage function
console.log('Full event data:', JSON.stringify(data, null, 2));

// In handleFBLoginResponse
console.log('Full FB response:', JSON.stringify(response, null, 2));
```

### Check Browser Console:

Look for these specific messages:
- `WA_EMBEDDED_SIGNUP event:` - Shows the event data
- `FB Login Response:` - Shows the authentication response
- Any error messages from Facebook SDK

---

## Testing Checklist

- [ ] Meta App ID is correct: `665558946509856`
- [ ] Config ID is correct: `1275572191131467`
- [ ] App is in correct mode (Development/Live)
- [ ] Business Portfolio is set up
- [ ] System User has proper permissions
- [ ] Domain is verified
- [ ] WhatsApp product is added to the app
- [ ] App has required permissions approved
- [ ] Callback URLs are configured
- [ ] Using HTTPS (or localhost for development)
- [ ] Browser console shows no CORS errors

---

## Alternative Approach: Use Test Credentials

For testing purposes, you can:

1. Add test users to your Meta App
2. Use test phone numbers
3. Complete the flow with test credentials
4. Verify the integration works before going live

---

## Contact Meta Support

If the issue persists after checking all the above:

1. Go to [Meta Business Help Center](https://www.facebook.com/business/help)
2. Submit a support ticket with:
   - App ID: `665558946509856`
   - Config ID: `1275572191131467`
   - Screenshot of the error
   - Steps you've already tried

---

## Quick Fix Attempts

### 1. Recreate the Configuration:
- Delete the current configuration
- Create a new one
- Update the `META_CONFIG_ID` in code

### 2. Use a Different Meta App:
- Create a new Meta App
- Set it up from scratch following Meta's documentation
- Update `META_APP_ID` and `META_CONFIG_ID`

### 3. Check Business Verification Status:
- Ensure your business is verified on Meta
- Complete any pending verification steps

---

## Expected Flow (When Working Correctly)

1. User clicks "Sign Up with Facebook"
2. Facebook popup opens
3. User logs in and grants permissions
4. User selects/creates WhatsApp Business Account
5. `WA_EMBEDDED_SIGNUP` FINISH event fires with `waba_id`
6. `FB.login` callback receives authorization `code`
7. Code is sent to backend
8. WABA ID is submitted to backend
9. Success message displayed

---

## Current Implementation Details

**Files Modified:**
- `src/pages/ProjectDetails.js` - Main component with embedded signup
- `src/api/auth.js` - API function for submitting WABA ID

**API Endpoints:**
- `/project/submit-waba-id` - Submits WABA ID after signup

**Configuration:**
```javascript
META_APP_ID = "665558946509856"
META_CONFIG_ID = "1275572191131467"
META_GRAPH_VER = "v24.0"
```

---

## Need More Help?

Check Meta's official documentation:
- [WhatsApp Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/business-platform)
- [App Review Process](https://developers.facebook.com/docs/app-review)
