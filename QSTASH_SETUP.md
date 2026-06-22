# QStash Keep-Alive Setup for RateMyProf Backend

Since the frontend is a **static export** (GitHub Pages), Next.js API routes are not available.
Instead, configure QStash to ping the **FastAPI backend's `/health` endpoint directly**.

---

## Setup (One-Time via Upstash Console)

### Step 1 — Create a free Upstash account
Go to: https://upstash.com → Sign up → Open the **QStash** tab.

### Step 2 — Create a Scheduled Message

| Field       | Value                                                         |
|-------------|---------------------------------------------------------------|
| **URL**     | `https://ratemyprof-backend.onrender.com/health`             |
| **Method**  | `GET`                                                         |
| **Cron**    | `*/10 * * * *`  (every 10 minutes)                            |
| **Headers** | *(none required — health endpoint is public)*                 |

### Step 3 — Save and Activate
Click **Create**. QStash will now fire a GET to your backend health endpoint every 10 minutes,
keeping Render's free-tier server warm and preventing cold starts.

---

## Alternative — QStash CLI

```bash
# Install Upstash CLI
npm install -g @upstash/cli

# Login
upstash auth login

# Create schedule (every 10 minutes)
qstash schedules create \
  --cron "*/10 * * * *" \
  --destination "https://ratemyprof-backend.onrender.com/health" \
  --method GET
```

---

## Verify It's Working

Check the QStash console → **Schedules** → **Logs**.
You should see successful 200 responses every 10 minutes.

You can also check Railway/Render logs — the backend should log:
```
✅ [2026-xx-xx HH:MM:SS] Backend alive - Status: 200
```

---

## Why QStash Instead of the Python keep-alive-bot.py?

| Approach              | Reliability | Cost   | Requires Running Process? |
|-----------------------|-------------|--------|---------------------------|
| `keep-alive-bot.py`   | Low         | Free   | Yes (needs a server)      |
| QStash Scheduled Job  | High        | Free*  | No (serverless)           |

*QStash free tier: 500 messages/day — more than enough for 144 pings/day (every 10 min).

---

## Environment Variables (not required for direct pinging)

If you later add a Next.js backend (e.g. Vercel), add these to your env:

```env
QSTASH_CURRENT_SIGNING_KEY=your_qstash_signing_key
QSTASH_NEXT_SIGNING_KEY=your_qstash_next_signing_key
BACKEND_HEALTH_URL=https://ratemyprof-backend.onrender.com/health
```
