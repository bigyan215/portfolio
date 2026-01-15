# Gmail Setup for Contact Form Emails

Follow these steps to enable email sending via Gmail:

## Step 1: Create a Google App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your device type)
5. Google will generate a **16-character password** (without spaces)
6. Copy this password

## Step 2: Configure `.env`

Create a `.env` file in the project root (copy from `.env.example` or create new):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_SECURE=false
SENDER_EMAIL=your_email@gmail.com
TO_EMAIL=your_email@gmail.com
```

Replace:
- `your_email@gmail.com` with your Gmail address
- `your_16_char_app_password` with the 16-character password from Step 1

## Step 3: Start the Server

```bash
npm install
npm start
```

The server will read the `.env` file and use Gmail SMTP to send contact form emails.

## Troubleshooting

- **"Invalid credentials"**: Ensure the app password is correct (16 characters, no spaces)
- **"Less secure app access"**: If you see this, you need to use an **App Password**, not your regular Gmail password
- **Port 587 vs 465**: Port 587 (TLS, `SMTP_SECURE=false`) is recommended. Port 465 (SSL, `SMTP_SECURE=true`) also works

## Testing

Once configured, submit the contact form and check:
1. Your Gmail inbox for the contact email
2. Server logs (console) for confirmation messages
3. `data/submissions.json` for fallback local saves

