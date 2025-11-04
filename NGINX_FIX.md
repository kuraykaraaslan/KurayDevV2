# Nginx Configuration Fix for Production

## Problem
The Nginx config is missing the `X-Forwarded-Proto` header, causing cookies to be set without the `Secure` flag even though the connection is HTTPS.

## Solution
Replace your `/etc/nginx/sites-enabled/kuray-dev` file with this:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name kuray.dev;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name kuray.dev;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/kuray.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kuray.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # CRITICAL HEADERS FOR COOKIES TO WORK
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # THIS IS THE KEY LINE!
        proxy_set_header X-Forwarded-Host $host;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Steps to Apply

1. **Backup current config:**
   ```bash
   sudo cp /etc/nginx/sites-enabled/kuray-dev /etc/nginx/sites-enabled/kuray-dev.backup
   ```

2. **Edit the config:**
   ```bash
   sudo nano /etc/nginx/sites-enabled/kuray-dev
   ```

3. **Add these lines in the `location /` block (around line 23):**
   ```nginx
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header X-Forwarded-Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   ```

4. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

5. **If test passes, reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

6. **Verify it worked:**
   Check your application logs. You should now see:
   ```
   'x-forwarded-proto': 'https'
   ```
   Instead of:
   ```
   'x-forwarded-proto': 'http'
   ```

## What This Fixes

- ✅ Cookies will be set with `Secure` flag when using HTTPS
- ✅ `SameSite=None` will be used for cross-origin cookie support
- ✅ Authentication will work properly on production
- ✅ No more redirect loops on admin pages
