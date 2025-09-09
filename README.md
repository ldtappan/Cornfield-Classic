# Lap Tracker (QR/NFC + PWA)

A minimal, production-ready template for tracking laps at events using a QR/NFC gate and a lightweight PWA.

## Features
- **Scan-to-lap**: Riders scan a QR/NFC at the gate; the app posts a signed lap with timestamp.
- **Rotating gate token**: Stateless TOTP-like token that changes every N seconds to prevent cheating.
- **Check-in**: Issue a rider JWT by bib number.
- **Live leaderboard**: Simple API + UI.
- **Admin tools**: Gate display page renders a live QR (updates every few seconds). Manual overrides.
- **Docker-ready**: `docker-compose` spins up Postgres, server, and web.

## Quick Start (Local Dev)
1. Clone this repo and create your env file:
   ```bash
   cp .env.example .env
   ```
2. Start Postgres (Docker) or your own DB. Using Docker:
   ```bash
   docker compose up -d db
   ```
3. Apply schema:
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/laptracker -f server/migrations/schema.sql
   ```
4. Install deps and run both apps:
   ```bash
   npm run setup
   npm run dev
   ```
   - API: http://localhost:8080
   - Web: http://localhost:5173

## Production (Docker Compose)
```bash
cp .env.example .env
docker compose up --build
```
- Web served on :5173 (adjust as needed) and API on :8080. In production, serve the built web via nginx and proxy to API.

## Core Flows
- **Check-in** (staff or self-service): go to `/checkin`, enter bib (and optional name) → receives local rider token.
- **Gate display** (staff tablet): go to `/admin/gate-display`, enter the `ADMIN_KEY` → shows a live QR that updates every few seconds.
- **Rider lap**: rider scans the gate QR; the `/lap` page posts the included nonce with the rider token to `/api/laps`.
- **Leaderboard**: `/leaderboard` shows live totals.

## API (overview)
- `POST /api/checkin { bib, name?, division? }` → `{ riderToken, rider }`
- `GET /api/gate-token` (header: `x-admin-key`) → `{ token, validFrom, validTo }`
- `POST /api/laps { eventId, gateId, token, tsClient? }` (Bearer riderToken) → `{ ok, lap }`
- `GET /api/leaderboard?eventId=...` → `{ rows: [...] }`
- `POST /api/override-lap` (header: `x-admin-key`) → add/fix a lap

## Signage
- Place a staff tablet on a stand at the gate, open `/admin/gate-display`, and keep it awake.
- The screen QR encodes `https://YOUR_WEB_HOST/lap?gate=main&nonce=...` and auto-refreshes.
- Print a fallback static QR to `/lap?gate=main` (works if staff tablet fails; riders will be prompted to wait for a fresh token from a volunteer).

## Notes
- The token mechanism is **stateless** using HMAC(TOTP_SECRET, window). Server accepts current / previous windows.
- To reduce clock drift issues, keep staff tablet and server time in sync (NTP). Clients can be off by seconds; server uses server-time.
- Rate-limit laps per rider via `MIN_LAP_SECONDS` (env).

## License
MIT
