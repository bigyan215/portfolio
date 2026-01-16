# Deployment Guide

## Backend Deployment (Express API)

Your backend must be deployed to **https://bigyanbudha.com.np** (or a subdomain/path that routes to the Express server).

### Option 1: Deploy on the Same Domain (Recommended)

If you control https://bigyanbudha.com.np, configure your web server (Nginx/Apache) to:
- Serve static files (index.html, css, js, images) directly
- Proxy `/api/*` requests to the Node.js Express server running on port 3000

**Nginx example:**
```nginx
server {
    listen 80;
    server_name bigyanbudha.com.np;

    # Serve static files
    location / {
        root /var/www/portfolio;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # Proxy API requests to Express
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Apache example (.htaccess or VirtualHost):**
```apache
<VirtualHost *:80>
    ServerName bigyanbudha.com.np
    DocumentRoot /var/www/portfolio

    # Serve static files
    <Directory /var/www/portfolio>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy /api to Express
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
</VirtualHost>
```

### Option 2: Deploy Backend on Subdomain

Deploy backend on `api.bigyanbudha.com.np` and update:
- `index.html`: `<meta name="api-base" content="https://api.bigyanbudha.com.np">`
- `.env` on server: `CORS_ORIGIN=https://bigyanbudha.com.np`

### Express Server Setup

1. **Upload backend files** to your server:
   - `server.js`, `package.json`, `.env`

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** with production values:
   ```env
   PORT=3000
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   SMTP_SECURE=false
   SENDER_EMAIL=your_email@gmail.com
   TO_EMAIL=your_email@gmail.com
   CORS_ORIGIN=https://bigyanbudha.com.np
   ```

4. **Run with PM2** (keeps server running):
   ```bash
   npm install -g pm2
   pm2 start server.js --name portfolio-api
   pm2 save
   pm2 startup  # follow instructions to enable auto-restart on reboot
   ```

5. **Test the API:**
   ```bash
   curl -X POST https://bigyanbudha.com.np/api/contact \
     -d "name=Test&email=test@example.com&message=hello"
   ```

## Frontend Deployment

1. **Upload static files** to web root (`/var/www/portfolio` or similar):
   - `index.html`, `css/`, `js/`, `images/`, `fonts/`, `CNAME`

2. **Verify meta tag** in `index.html`:
   ```html
   <meta name="api-base" content="https://bigyanbudha.com.np">
   ```

3. **Test from browser:**
   - Open https://bigyanbudha.com.np
   - Submit contact form
   - Check Gmail for email
   - Check server logs: `pm2 logs portfolio-api`

## Troubleshooting

- **CORS errors**: Ensure `CORS_ORIGIN` in `.env` matches your frontend domain
- **405 / "Send failed"**: Backend not running or `/api/contact` not reachable
- **SMTP errors**: Check Gmail App Password and SMTP settings
- **Check logs**: `pm2 logs portfolio-api` or `journalctl -u your-service`

