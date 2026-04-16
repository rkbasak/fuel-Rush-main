# 🚀 Fuel Rush — BTpanel (宝塔面板) Deployment Guide

> Deploy Fuel Rush on a VPS using BTpanel — a popular Chinese hosting control panel popular in China, Bangladesh, and Southeast Asia.

---

## Overview

BTpanel is a **free, open-source** hosting control panel that makes it easy to manage websites, databases, SSL certificates, and Node.js apps on a Linux VPS. It's especially popular in Bangladesh and China due to its Chinese-language UI and one-click setup.

Since Fuel Rush uses **static export** (`output: 'export'` in `next.config.mjs`), the frontend deploys as plain HTML/CSS/JS — no Node.js server required for the main app. This makes BTpanel deployment extremely straightforward.

---

## Prerequisites

- A VPS (Ubuntu 20.04+ / Debian 10+) with root SSH access
- **2GB+ RAM** recommended for BTpanel + Node.js
- A domain name pointed to your VPS IP (e.g., `fuelrush.yourdomain.com`)
- SSH client (PuTTY on Windows, Terminal on Mac/Linux)

---

## Step 1: Install BTpanel on Your VPS

### 1.1 Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
```

### 1.2 Run the BTpanel Install Script

BTpanel officially recommends Ubuntu. Run the one-click install:

```bash
# For Ubuntu (recommended)
wget -O install.sh https://download.btpanel.net/install/ubuntu_install.sh && bash install.sh

# For Debian
wget -O install.sh https://download.btpanel.net/install/debian_install.sh && bash install.sh
```

### 1.3 Save Your BTpanel Credentials

After installation completes, you'll see:

```
Bt-Panel: https://YOUR_VPS_IP:8888/xxxxxx
username: xxxxxxxx
password: xxxxxxxx
```

**Save these immediately!** The login URL includes a secure token.

### 1.4 Access BTpanel

Open your browser and navigate to:
```
https://YOUR_VPS_IP:8888/xxxxxx
```

Accept the SSL warning (self-signed cert) and log in.

---

## Step 2: Install Required Software

BTpanel comes with a **Software Store**. Install these:

### 2.1 Via BTpanel Dashboard

1. Log in to BTpanel
2. Go to **Software Store** (软件商店)
3. Install the following:
   - **Nginx** — Web server (for serving static files + reverse proxy)
   - **Node.js Manager** (Node.js版本管理器) — For running SSR/API if needed
   - **Supervisor** — For keeping Node.js processes running
   - 宝塔防火墙 (BT Firewall) — Optional security

### 2.2 Install Node.js 22.x

Since the Fuel Rush API routes may need server-side rendering:

1. Go to **Node.js Manager** (Node.js版本管理器)
2. Click **Install** to install the node version manager
3. After install, click **Node版本** → **Install Node.js**
4. Select **Node.js 22.x** (latest LTS) → click **Install**
5. Wait for compilation to complete (~5 minutes)

---

## Step 3: Build Fuel Rush Locally

Since BTpanel doesn't run `npm` build commands natively during deployment, **build locally first**:

### 3.1 Clone and Build

```bash
git clone https://github.com/adnanizaman-star/fuel-Rush.git
cd fuel-Rush
npm install
cp .env.example .env.local
# Edit .env.local with your production API keys
npm run build
```

### 3.2 Verify the Build Output

After build, you should see an `out/` folder:

```bash
ls -la out/
# Should contain: index.html, _next/, static/, etc.
```

### 3.3 Package for Upload

```bash
cd out
zip -r fuel-rush-static.zip .
```

Upload `fuel-rush-static.zip` to your VPS via BTpanel's file manager.

---

## Step 4: Create Website in BTpanel

### 4.1 Add a New Site

1. In BTpanel → **Website** (网站)
2. Click **Add Site** (添加站点)
3. Fill in:
   - **Domain**: `fuelrush.yourdomain.com` (your domain)
   - **Remark**: `Fuel Rush Static`
   - **Website目录**: `/www/wwwroot/fuel-rush/`
   - **FTP**: Create if needed (or skip)
   - **Database**: **Not needed** (static site)
   - **PHP version**: **None** (static HTML)

4. Click **Submit**

### 4.2 Upload and Extract Files

1. Go to **File Manager** (文件)
2. Navigate to `/www/wwwroot/fuel-rush/`
3. Click **Upload** → upload `fuel-rush-static.zip`
4. Right-click the zip → **Extract**
5. Verify files are in the root: `index.html`, `_next/`, etc.

---

## Step 5: Configure Nginx for SPA Routing

Fuel Rush is a **Single Page App (SPA)**. You need to configure nginx to serve `index.html` for all routes that don't match static files.

### 5.1 Edit Nginx Config

1. In BTpanel → **Website** → find `fuelrush.yourdomain.com`
2. Click **Settings** (设置) → **Configuration** (配置文件)
3. Find the `server { }` block for port 80

### 5.2 Replace with This Configuration

```nginx
server
{
    listen 80;
    server_name fuelrush.yourdomain.com;
    index index.html;
    root /www/wwwroot/fuel-rush;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Cache static assets aggressively
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing — serve index.html for all unmatched routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Deny access to Next.js build files
    location ~ ^/(_next|cache|api)/ {
        deny all;
    }
}
```

### 5.3 Enable SSL (Recommended)

1. In BTpanel → **Website** → select your site
2. Click **SSL** (SSL) → **Let's Encrypt**
3. Check **Keep it simple** → enter your email → click **申请**
4. After cert is issued, enable **强制HTTPS** (Force HTTPS)

---

## Step 6: Optional — Deploy API Routes Separately

Since Fuel Rush uses `output: 'export'`, the API routes in `src/app/api/` are **not included** in the static build. If you need server-side features:

### Option A: Deploy API to Vercel

The API routes work perfectly on Vercel's serverless functions. Just push your code (without `output: 'export'`) to a separate Vercel project.

1. Create `vercel-api/` folder with your API routes
2. Deploy to Vercel
3. Note your API URL: `https://fuel-rush-api.vercel.app`

### Option B: Deploy as BTpanel Node.js App

If you need a persistent API server:

#### 6.1 Install Node.js Project

1. In BTpanel → **Node.js Manager** (Node.js版本管理器)
2. Click **Project Manager** (项目管理)
3. Click **Add Node.js Project** (添加Node项目)
4. Fill in:
   - **Project name**: `fuel-rush-api`
   - **Project path**: `/www/wwwroot/fuel-rush-api`
   - **Node version**: `22.x`
   - **Run command**: `npm start`
   - **Port**: `3000`
   - **Environment variables**: See below

#### 6.2 Set Environment Variables

In the Node.js project settings, add these environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `your-google-maps-key` |
| `UPSTASH_REDIS_REST_URL` | `https://your-redis.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `your-redis-token` |
| `GEMINI_API_KEY` | `your-gemini-key` |
| `NEXT_PUBLIC_APP_URL` | `https://fuelrush.yourdomain.com` |
| `PORT` | `3000` |

#### 6.3 Upload API Project Files

```bash
# On your local machine, create an API-only build
# Copy only src/app/api/, src/lib/, src/types/, and package.json
# Run npm install && npm run build
# Zip and upload to /www/wwwroot/fuel-rush-api/
```

#### 6.4 Configure Nginx as Reverse Proxy

In BTpanel → **Website** → add a new site for `api.fuelrush.yourdomain.com`:

```nginx
server
{
    listen 80;
    server_name api.fuelrush.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable SSL via Let's Encrypt.

---

## Step 7: Verify Deployment

### 7.1 Check Static Files

Visit `https://fuelrush.yourdomain.com` — the Fuel Rush home page should load.

### 7.2 Test Navigation

Click through the app — map, stations, ration tracker. All pages should load without 404s.

### 7.3 Test Mobile View

Open on your phone — the responsive layout should work.

### 7.4 Check DevTools Console

Open browser DevTools → Console. Look for:
- No `Failed to fetch` errors (API connectivity)
- No `404` errors for static assets
- No JavaScript errors

---

## Step 8: Connect Custom Domain (Recommended)

### 8.1 Add Domain in BTpanel

1. BTpanel → **Website** → your site → **Settings**
2. Go to **域名绑定** (Domain Binding)
3. Add `fuelrush.yourdomain.com`

### 8.2 Configure DNS

In your domain registrar's DNS settings:

```
A Record: fuelrush.yourdomain.com → YOUR_VPS_IP
A Record: api.fuelrush.yourdomain.com → YOUR_VPS_IP  (if using API)
```

### 8.3 Install SSL Certificate

1. BTpanel → **Website** → your site → **SSL**
2. Click **Let's Encrypt** → **One-click Renewal**
3. Enable **Force HTTPS**

---

## Troubleshooting

### "404 Not Found" on Sub-Pages

Your nginx `try_files` directive isn't set correctly. Make sure:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Then reload nginx in BTpanel: **Website** → click **Reload** (重载配置).

### "502 Bad Gateway"

Nginx can't reach the backend. Check:
- Node.js process is running on the correct port
- Firewall isn't blocking the port
- No port conflict (another service using port 3000)

### Static Files Not Loading

Check the `root` path in nginx config matches your actual file path:
```
root /www/wwwroot/fuel-rush;
ls /www/wwwroot/fuel-rush/
# Should show: index.html, _next/, static/
```

### CSS/JS Not Loading After Deploy

Clear BTpanel's static cache:
1. BTpanel → **Site** (站点)
2. Click **Clear Cache** (清理缓存)

Or delete the `out/` folder from browser and refresh.

### SSL Certificate Failed

Make sure port **80** and **443** are open in your VPS firewall:

```bash
# Check ufw status
ufw status

# Open ports if needed
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

In BTpanel: **Security** (安全) → **Firewall** (防火墙) → add ports 80, 443.

---

## BTpanel-Specific Tips

### 📌 Accessing BTpanel if Port 8888 is Blocked

If you can't access port 8888 from your network:

```bash
# On the VPS, change the BTpanel port
bt
# Select: 6) Cloud dome settings
# Change panel port to 443 (or any open port)
```

### 📌 Enable BTpanel SSH Login

```bash
bt
# Select: 13) SSH interface
# Enable/disable SSH access
```

### 📌 Reset BTpanel Password

If you forget your BTpanel password:
```bash
bt
# Select: 2) Enter panel user name and password
# Reset to a new password
```

### 📌 Useful BTpanel Commands

```bash
bt  # Opens BTpanel CLI menu
bt reload  # Reload nginx
bt restart # Restart all services
bt stop   # Stop BTpanel services
```

---

## Why Static Export is the Best Choice for BTpanel

| Approach | Pros | Cons |
|----------|------|------|
| **Static Export (`out/`)** ✅ | Fast, cheap hosting, no server needed, easy nginx config | API routes must be separate |
| **Node.js App (SSR)** | Full Next.js features | Higher VPS requirements (2GB+ RAM), more complex setup |
| **Docker** | Consistent environment | Requires Docker knowledge, more resources |

For Bangladesh VPS users, **static export is recommended** because:
1. Cheapest hosting (₵200-500/month VPS can handle it)
2. No port conflicts or process management
3. Nginx handles all routing natively
4. API routes deploy free on Vercel

---

## Useful Links

| Resource | URL |
|----------|-----|
| BTpanel Official | https://www.btpanel.com |
| BTpanel Docs (Chinese) | https://www.bt.cn/bbs |
| Nginx Location Directive | https://nginx.org/en/docs/http/ngx_http_core_module.html#location |
| Next.js Static Export | https://nextjs.org/docs/app/guides/static-exports |

---

_Deploying on BTpanel? Questions? Open an issue at [github.com/adnanizaman-star/fuel-Rush/issues](https://github.com/adnanizaman-star/fuel-Rush/issues)_
