# 📧 Supabase Email Templates

Beautiful, modern email templates for RateMyProf India authentication emails.

## 🎨 What's Included

- **confirm-signup.html** - Modern HTML email with gradient design
- **confirm-signup-plain.txt** - Plain text fallback version

## 🚀 How to Add to Supabase

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/xgnewppqxqkyeabtmenf
2. Navigate to: **Authentication** → **Email Templates**

### Step 2: Update Confirm Signup Template

#### For HTML Version:
1. Click on "**Confirm signup**" template
2. Copy the entire contents of `confirm-signup.html`
3. Paste it in the **Message Body** field
4. Make sure to keep the `{{ .ConfirmationURL }}` variable intact
5. Click **Save**

#### For Plain Text (Optional):
1. If there's a plain text section, use `confirm-signup-plain.txt`
2. This ensures emails work even for clients that don't support HTML

### Step 3: Test the Email
1. Create a new test account on your platform
2. Check your inbox for the new styled email
3. Verify the confirmation link works

## 🎨 Features of the New Design

✨ **Modern Gradient Design**
- Purple/indigo gradient header and background
- Professional card-based layout with shadows

🎯 **Clear Call-to-Action**
- Big, prominent confirmation button
- Gradient button with hover effect (if email client supports it)

📱 **Mobile Responsive**
- Works great on all devices
- Proper spacing and sizing

🎉 **Engaging Content**
- Icons for visual appeal (🎓🔍⭐🤝🏆)
- Feature highlights in a styled box
- Clear alternative link section

⚠️ **Important Notices**
- Yellow warning box for alternative link
- Clear expiration notice in footer

## 🔧 Customization

You can customize:
- **Colors**: Change gradient colors in the style attributes
- **Copy**: Update the text to match your tone
- **Features**: Add/remove feature items
- **Branding**: Add your logo (upload to Supabase storage first)

### Example: Adding Your Logo

Replace the header text with:
```html
<img src="YOUR_LOGO_URL" alt="RateMyProf" style="max-width: 200px; height: auto;">
```

## 📝 Variables Available

Supabase provides these variables you can use:
- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL (configured in Supabase)
- `{{ .Email }}` - User's email address

## 🐛 Troubleshooting

**Email looks plain/unstyled:**
- Some email clients (like Outlook) strip CSS styles
- That's why we provide a plain text version as fallback
- Gmail, Apple Mail, and most modern clients will show it beautifully

**Links not working:**
- Make sure you've set the correct **Site URL** in Supabase
- Go to: Authentication → URL Configuration → Site URL
- Should be: `https://ratemyprof.me`

**Button not clickable:**
- Email clients have varying support for interactive elements
- That's why we also provide a plain text link below the button

## 📧 Other Email Templates to Update

Consider updating these templates too:
1. **Magic Link** - For passwordless login
2. **Reset Password** - Password reset emails
3. **Email Change** - When user changes email
4. **Invite User** - For admin invitations

Use the same design pattern for consistency!

## 🎉 Result

Your users will receive a **professional, modern, and engaging** confirmation email that:
- Builds trust and credibility
- Clearly explains next steps
- Works across all email clients
- Represents your brand well

---

Built with ❤️ by Team RateMyProf India
