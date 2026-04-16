# Self-Hosting Fuel Rush

Fuel Rush can be self-hosted on your own server — no Vercel required. The frontend is a fully static Next.js export that can be served by any web server (nginx, Caddy, Apache) or container runtime (Docker, Podman).

**Supported architectures:** `linux/amd64` (Intel/AMD x86_64) and `linux/arm64` (ARM64 — Raspberry Pi 4/5, Apple Silicon Macs, AWS Graviton, etc.)

---

## Option 1: Docker (Recommended)

Docker is the easiest way to self-host Fuel Rush on any server.

### Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose v2+ (`docker compose` command)
- A domain name (optional — works on IP:port too)

### Quick Start

```bash
# 1. Clone the repo
gh repo clone adnanizaman-star/fuel-Rush
cd fuel-Rush

# 2. Create .env file
cp .env.example .env
# Edit .env and fill in your API keys (see Environment Variables below)

# 3. Start the container
docker compose up -d --build

# 4. Visit http://localhost:8080
```

That's it. The app will be running at `http://localhost:8080`.

### With a Domain + HTTPS (Traefik)

If you have Traefik already set up for reverse proxy:

```bash
# Edit docker-compose.traefik.yml and replace YOUR_DOMAIN with your actual domain
# Then:
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d
```

Automatic HTTPS via Let's Encrypt will be configured.

### Updating

```bash
git pull origin main
docker compose build --no-cache
docker compose up -d
```

### Checking Logs

```bash
docker compose logs -f fuel-rush-web
```

### Stopping

```bash
docker compose down
```

---

## Option 1B: Full Local Stack (PostgreSQL + Redis + App)

Spin up PostgreSQL + Redis + Fuel Rush together with Docker Compose. No cloud services needed.

### Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose v2+

### Quick Start

```bash
# 1. Clone the repo
gh repo clone adnanizaman-star/fuel-Rush
cd fuel-Rush

# 2. Edit .env and uncomment Option B (local) variables:
#    - Set DATABASE_URL=postgresql://fuelrush:yourpassword@localhost:5432/fuelrush
#    - Set REDIS_URL=redis://localhost:6379
#    - Comment out Supabase and Upstash vars (Option A)
#    - Fill in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# 3. Start the full stack
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# 4. Apply database migrations
docker compose -f docker-compose.yml -f docker-compose.local.yml exec postgres \
  psql -U fuelrush -d fuelrush -f /docker-entrypoint-initdb.d/000_local_setup.sql

# 5. Visit http://localhost:8080
```

### What's included

| Service | Port | Description |
|---------|------|-------------|
| Fuel Rush | 8080 | Next.js frontend (nginx) |
| PostgreSQL | 5432 | Database (user: `fuelrush`, pass: `yourpassword`, db: `fuelrush`) |
| Redis | 6379 | Cache (no auth) |

### Connecting to local services

Once running, your `.env` should look like this:

```env
# Database — local PostgreSQL
DATABASE_URL=postgresql://fuelrush:yourpassword@localhost:5432/fuelrush

# Redis — local
REDIS_URL=redis://localhost:6379

# Comment out Supabase and Upstash (not needed):
# NEXT_PUBLIC_SUPABASE_URL=https://...
# UPSTASH_REDIS_REST_URL=https://...

# Keep these:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

### Stopping the local stack

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
# Add -v to wipe data volumes:
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
```

### Troubleshooting

```bash
# Check if all containers are running
docker compose -f docker-compose.yml -f docker-compose.local.yml ps

# View logs
docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f

# Connect to PostgreSQL directly
docker compose -f docker-compose.yml -f docker-compose.local.yml exec postgres \
  psql -U fuelrush -d fuelrush

# Connect to Redis directly
docker compose -f docker-compose.yml -f docker-compose.local.yml exec redis redis-cli
```

---

## Option 2: Bare Metal (Node.js + nginx)

No Docker? Run directly on a Linux server.

### Prerequisites

- Node.js 20+ (22 recommended)
- nginx (or Caddy, or Apache)
- A domain name + SSL certificate (recommended)

### Step 1: Build the Static Export

```bash
gh repo clone adnanizaman-star/fuel-Rush
cd fuel-Rush
npm install

# Fill in .env with your API keys
cp .env.example .env
nano .env   # Edit environment variables

# Build static export (output goes to ./out/)
npm run build
```

### Step 2: Serve with nginx

```bash
# Install nginx
sudo apt install nginx   # Debian/Ubuntu
sudo yum install nginx    # RHEL/CentOS

# Copy nginx config (from this repo)
sudo cp nginx.conf /etc/nginx/conf.d/fuel-rush.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Serve the static files
sudo cp -r out/* /usr/share/nginx/html/
```

Or serve from a custom location:

```nginx
server {
    listen 80;
    server_name fuelrush.yourdomain.com;
    root /var/www/fuel-rush/out;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 3: Systemd Service (Optional)

For auto-start on boot:

```ini
# /etc/systemd/system/fuel-rush.service
[Unit]
Description=Fuel Rush Web
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/fuel-rush
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable fuel-rush
sudo systemctl start fuel-rush
```

### Step 4: SSL with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d fuelrush.yourdomain.com

# Certbot auto-renews certificates
```

---

## Option 3: Static Files Only + External API

The frontend is 100% static — just host `out/` on any web server.

### One-Line Servers

**Python:**
```bash
cd out && python3 -m http.server 8080
```

**Node.js (no install):**
```bash
npx serve out -p 8080
```

**PHP:**
```bash
php -S localhost:8080 -t out/
```

> ⚠️ These are for testing only. For production, use nginx or Caddy.

### GitHub Pages / Netlify / Cloudflare Pages

1. Run `npm run build` locally (or in CI)
2. Upload the `out/` folder contents
3. Set `NEXT_PUBLIC_APP_URL` to your deployment URL

---

## Environment Variables

All environment variables for self-hosting. Copy `.env.example` to `.env` and fill in values.

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key (safe to expose) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your app's public URL (for OAuth callbacks). Defaults to `http://localhost:8080` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (only needed for custom API server) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (only needed for custom API server) |
| `GEMINI_API_KEY` | Google Gemini API key (only needed for custom API server) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key (for push notifications) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase VAPID key (for FCM) |

### Getting API Keys

| Service | Where to get it |
|---------|----------------|
| **Supabase** | [supabase.com](https://supabase.com) → Project Settings → API |
| **Google Maps** | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials |
| **Upstash Redis** | [upstash.com](https://upstash.com) → Redis → REST URL & Token |
| **Gemini** | [aistudio.google.com](https://aistudio.google.com) → Get API Key |
| **Firebase** | [console.firebase.google.com](https://console.firebase.google.com) → Project Settings |

---

## ARM64 vs AMD64

Fuel Rush Docker images support both architectures:

| Architecture | Devices | Examples |
|-------------|---------|----------|
| `linux/amd64` | Intel/AMD x86_64 servers | AWS EC2 x86, DigitalOcean, Vultr, dedicated servers |
| `linux/arm64` | ARM64 servers & SBCs | AWS Graviton, Raspberry Pi 4/5, Apple Silicon Macs, Oracle ARM |

### Pulling for a Specific Architecture

```bash
# AMD64 (most common)
docker pull ghcr.io/adnanizaman-star/fuel-rush:latest

# ARM64 (Raspberry Pi, Apple Silicon, AWS Graviton)
docker pull ghcr.io/adnanizaman-star/fuel-rush:latest-arm64

# Both at once (docker automatically picks the right one for your platform)
docker pull ghcr.io/adnanizaman-star/fuel-rush:latest
```

GitHub Actions builds both architectures on every push to `main`.

---

## Raspberry Pi Quick Setup

Tested on Raspberry Pi OS 64-bit (Debian Bookworm):

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Clone and start
git clone https://github.com/adnanizaman-star/fuel-Rush.git
cd fuel-Rush
cp .env.example .env
nano .env   # Fill in your Supabase + Google Maps keys

# 3. Build for ARM64 and run
docker build --platform linux/arm64 -t fuel-rush .
docker run -d -p 8080:80 --name fuel-rush \
  --env-file .env \
  fuel-rush

# 4. Access at http://your-pi-ip:8080
```

---

## Troubleshooting

### App shows "Loading..." forever
- Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Make sure your Supabase project allows anonymous access (check Row Level Security policies)

### Google Maps shows "For Development Purposes Only"
- Your Google Maps API key may have billing disabled or wrong API restrictions
- Go to Google Cloud Console → Maps JavaScript API → ensure key is unrestricted or has correct HTTP referrer

### Static export works but deep links 404
- Make sure nginx `try_files $uri $uri/ /index.html` is configured (already in our nginx.conf)
- Check nginx is reloading correctly: `sudo nginx -t && sudo systemctl reload nginx`

### Docker build fails on ARM64
- Make sure Docker Buildx is available: `docker buildx version`
- Create a new builder: `docker buildx create --use`
- Enable multi-arch: `docker buildx inspect --bootstrap`

### Port already in use
```bash
# Find what's using port 8080
sudo lsof -i :8080
# Kill it or change the port in docker-compose.yml
```

---

## Architecture Notes

The self-hosted version is a **static frontend only**. It communicates with:
- **Supabase** — Database + Auth (your own Supabase project)
- **Google Maps** — Map tiles and geocoding
- **Firebase** — Push notifications (optional)
- **Upstash Redis + Gemini** — Not needed unless you run a custom API server

API routes (ration enforcement, route planning, AI confidence) run on your **Supabase Edge Functions** or a custom backend. The static export handles all UI — API calls go to Supabase directly from the browser.

---

## Need Help?

- Open an issue: [GitHub Issues](https://github.com/adnanizaman-star/fuel-Rush/issues)
- Check [SPEC.md](./SPEC.md) for technical details
- Check [DEPLOY.md](./DEPLOY.md) for deployment options
