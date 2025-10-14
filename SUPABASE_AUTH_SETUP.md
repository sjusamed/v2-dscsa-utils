# Supabase Authentication Setup - Invite Only

This guide will help you set up invite-only authentication for the DSCSA Web Scanner.

## 1. Disable Public Signups in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings** (in the left sidebar)
3. Scroll down to **Auth Providers**
4. Find **Email** provider settings
5. **Disable "Enable Email Signup"** ⚠️ IMPORTANT
   - This prevents random users from creating accounts
   - Only invited users can log in

## 2. Configure Site URL (IMPORTANT)

1. In **Authentication** → **Settings**
2. Scroll to **Site URL**
3. Set it to your production URL:
   - For Vercel: `https://your-app-name.vercel.app`
   - For development: `http://localhost:5174`
   - **Note:** You can add multiple URLs in "Redirect URLs" section below
4. **Add Redirect URLs** (same section):
   - Add your production URL: `https://your-app-name.vercel.app/**`
   - Add localhost for dev: `http://localhost:5174/**`
   - The `**` allows all routes

This ensures password reset emails redirect to the correct URL.

## 3. Configure Email Settings (Optional but Recommended)

1. In **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Configure your email provider (or use Supabase's default)
4. This allows password reset emails to work

## 4. Invite Your First User

### Method 1: Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **"Invite User"** button
3. Enter the user's email address
4. They will receive an email with a link to set their password
5. After setting password, they can log in to the app

### Method 2: SQL Editor (Advanced)

If you need to create a user directly:

```sql
-- Create a user (they must reset password on first login)
INSERT INTO auth.users (
  email,
  email_confirmed_at,
  encrypted_password,
  created_at,
  updated_at
) VALUES (
  'user@company.com',
  now(),
  crypt('temporary-password-123', gen_salt('bf')),
  now(),
  now()
);
```

**Note:** User will need to use "Forgot Password" to set a secure password.

## 5. Update RLS Policies (Security)

Now that we have authentication, let's secure the database tables:

```sql
-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all operations on partners" ON partners;
DROP POLICY IF EXISTS "Allow all operations on products" ON products;

-- Create authenticated-only policies for partners
CREATE POLICY "Authenticated users can view partners" ON partners
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert partners" ON partners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update partners" ON partners
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete partners" ON partners
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create authenticated-only policies for products
CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');
```

Run this in **SQL Editor** to update security policies.

## 6. Test the Authentication

1. Deploy your app (or run locally)
2. You should see a login screen
3. Try logging in with an invited user
4. Verify you can access the app after login

## 7. Managing Users

### Invite New Users
1. **Authentication** → **Users** → **Invite User**
2. Enter email
3. User receives invitation email
4. They set password and can log in

### Remove User Access
1. **Authentication** → **Users**
2. Find the user
3. Click the **"..."** menu → **Delete User**

### Reset User Password
1. User clicks **"Forgot Password"** on login screen
2. OR you can trigger it from **Authentication** → **Users** → **"..."** → **Send Password Reset Email**

## 8. Email Templates (Optional Customization)

Customize the invitation and password reset emails:

1. **Authentication** → **Email Templates**
2. Edit templates:
   - **Invite User** - Sent when you invite someone
   - **Reset Password** - Sent when they forget password
   - **Confirm Signup** - Not used (signups disabled)

## Security Best Practices

✅ **Email Signup Disabled** - No public signups
✅ **Invite-Only Access** - You control who has access
✅ **RLS Policies** - Database secured with Row Level Security
✅ **HTTPS** - Vercel provides automatic SSL
✅ **Session Management** - Supabase handles secure sessions

## Troubleshooting

### "User can't log in after invitation"
- Check that they confirmed their email via the invite link
- Verify email signup is enabled in Auth settings
- Check spam folder for invitation email

### "Invalid login credentials"
- User needs to set password via invitation link first
- Try password reset if forgotten

### "Can't access data after login"
- Verify RLS policies are updated (Step 4)
- Check browser console for errors
- Ensure Supabase URL and anon key are correct in .env

### "Invitation email not received"
- Check SMTP settings in Authentication → Settings
- Verify email address is correct
- Check spam/junk folder
- Try using Supabase's default email (if custom SMTP not configured)

## Summary

Your app now has:
- ✅ Login-only access (no public access)
- ✅ Invite-only user management
- ✅ Secure database with RLS
- ✅ Password reset functionality
- ✅ Session management

Only users you invite through the Supabase dashboard can access the app!
