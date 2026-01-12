const express = require('express');
const path = require('path');
const fs = require('fs');

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

app.post('/api/contact', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
