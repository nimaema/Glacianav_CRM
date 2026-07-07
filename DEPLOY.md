# Deploying GlaciaNav CRM

Three containers, one command, auto-deploy on every commit.

```
push to main  →  GitHub Actions builds image  →  pushes to GHCR  →  Watchtower on your server pulls + restarts
```

## Services (docker-compose.yml)

| Service | Image | Role |
| --- | --- | --- |
| `web` | `ghcr.io/nimaema/glacianav_crm:latest` | Next.js app (runs DB migrations on start) |
| `db` | `postgres:17-alpine` | PostgreSQL, data in the `pgdata` volume |
| `tunnel` | `cloudflare/cloudflared` | Cloudflare Tunnel → your domain, no open ports |
| `watchtower` | `containrrr/watchtower` | Watches `web`, redeploys when a new image is published |

## One-time server setup

1. **Install Docker + Compose** on the host.
2. **Clone and configure:**
   ```bash
   git clone https://github.com/nimaema/Glacianav_CRM.git
   cd Glacianav_CRM
   cp .env.example .env
   # edit .env — POSTGRES_PASSWORD, SESSION_SECRET (openssl rand -base64 32),
   # TUNNEL_TOKEN, and the MS_* values if you use Microsoft 365 SSO
   ```
3. **Cloudflare Tunnel:** in the Zero Trust dashboard create a tunnel, add a public
   hostname for your domain pointing at `http://web:3000`, and copy the tunnel token
   into `TUNNEL_TOKEN`.
4. **Authenticate to GHCR** so the server can pull the image:
   ```bash
   echo $GHCR_PAT | docker login ghcr.io -u nimaema --password-stdin
   ```
   (Or make the GHCR package public and skip this.)
5. **Start it:**
   ```bash
   docker compose up -d
   ```
   The `web` container runs `prisma migrate deploy` on boot, then serves the app.
   The first time, seed demo data if you want it:
   ```bash
   docker compose exec web node node_modules/prisma/build/index.js db seed  # optional
   ```

## Continuous deployment

`.github/workflows/deploy.yml` builds and pushes `ghcr.io/nimaema/glacianav_crm:latest`
on every push to `main` — no secrets needed, it uses the built-in `GITHUB_TOKEN`.
Watchtower polls every 60s (`WATCHTOWER_INTERVAL`) and rolling-restarts `web` when the
image changes. So: **commit → push → it's live in a minute or two.**

## Secrets

Everything sensitive comes from `.env` (git-ignored):
`SESSION_SECRET`, `POSTGRES_PASSWORD`, `TUNNEL_TOKEN`, `MS_CLIENT_SECRET`. The Microsoft
client secret is **only** read from `MS_CLIENT_SECRET` — it is never stored in the database.

## Local production test

```bash
cp .env.example .env    # set POSTGRES_PASSWORD + SESSION_SECRET
WEB_IMAGE=glacianav-web docker compose build web   # build locally instead of pulling
docker compose up -d
```
