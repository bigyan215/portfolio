require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from repo root
app.use(express.static(path.join(__dirname, '/')));

const submissionsFile = path.join(__dirname, 'data', 'submissions.json');

function saveSubmissionLocally(submission) {
  try {
    if (!fs.existsSync(path.dirname(submissionsFile))) {
      fs.mkdirSync(path.dirname(submissionsFile), { recursive: true });
    }

    let arr = [];
    if (fs.existsSync(submissionsFile)) {
      arr = JSON.parse(fs.readFileSync(submissionsFile, 'utf8') || '[]');
    }

    arr.push({ ...submission, receivedAt: new Date().toISOString() });
    fs.writeFileSync(submissionsFile, JSON.stringify(arr, null, 2));
  } catch (err) {
    console.error('Failed saving submission locally:', err);
  }
}

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, message, website, branding, ecommerce, seo } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const services = [];
  if (website) services.push('Websites');
  if (branding) services.push('Branding');
  if (ecommerce) services.push('Ecommerce');
  if (seo) services.push('SEO');

  const submission = { name, email, message, services };
  // If reCAPTCHA token is present, verify it first (requires RECAPTCHA_SECRET env var)
  const recaptchaToken = req.body['g-recaptcha-response'];
  if (recaptchaToken) {
    if (!process.env.RECAPTCHA_SECRET) {
      saveSubmissionLocally(submission);
      return res.status(500).json({ success: false, error: 'reCAPTCHA secret not configured on server' });
    }

    try {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken)}&remoteip=${req.ip}`;
      const verifyRes = await fetch(verifyUrl, { method: 'POST' });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        return res.status(400).json({ success: false, error: 'reCAPTCHA verification failed' });
      }
    } catch (err) {
      console.error('reCAPTCHA verification error:', err);
      saveSubmissionLocally(submission);
      return res.status(500).json({ success: false, error: 'reCAPTCHA verification error' });
    }
  }

  // If SMTP credentials are provided, send email using Nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const from = process.env.SENDER_EMAIL || process.env.SMTP_USER;
      const to = process.env.TO_EMAIL || process.env.SENDER_EMAIL || process.env.SMTP_USER;

      const subject = `Portfolio contact from ${name}`;
      const text = `Name: ${name}\nEmail: ${email}\nServices: ${services.join(', ')}\n\nMessage:\n${message}`;

      await transporter.sendMail({ from, to, subject, text });
      return res.json({ success: true, provider: 'smtp' });
    } catch (err) {
      console.error('SMTP send error:', err);
      saveSubmissionLocally(submission);
      return res.status(500).json({ success: false, error: 'Email send failed, saved locally' });
    }
  }

  // No provider configured — save to local JSON file
  saveSubmissionLocally(submission);
  return res.json({ success: true, provider: 'local-file' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
