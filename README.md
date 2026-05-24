# MergeLens

An AI-powered code review assistant that automatically reviews GitHub Pull Requests and posts inline comments — with a live React dashboard to track every review.

## What it does

1. GitHub sends a webhook when a PR is opened or synchronized
2. The backend fetches the diff, strips noise (lock files, build artifacts, minified JS)
3. The filtered diff is sent to **OpenAI GPT-4o** or **Anthropic Claude Sonnet** for analysis
4. The AI returns structured JSON: a summary, a risk score (0–10), a recommendation, and per-line issues with severity and suggested fixes
5. The backend posts inline review comments directly back to the GitHub PR
6. The dashboard updates in real time via Server-Sent Events

## Features

- **Dual AI providers** — switch between GPT-4o and Claude Sonnet from the navbar toggle; the active model is shown on every review row
- **Structured analysis** — each review produces a risk score, a recommendation (approve / request changes / needs discussion), and categorized issues (bug / security / performance / style)
- **Inline GitHub comments** — issues are posted as review comments at the exact file and line number
- **Live dashboard** — new reviews appear instantly via SSE without a page refresh
- **Diff viewer** — the PR detail page renders a side-by-side diff with per-file comment grouping
- **Real-time pending state** — in-progress reviews pulse in the table until complete

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Python 3.12, FastAPI (async), SQLAlchemy async ORM, aiosqlite |
| AI | OpenAI GPT-4o, Anthropic Claude Sonnet (runtime-switchable) |
| GitHub | Webhooks (HMAC SHA-256), REST API for posting reviews |
| Real-time | Server-Sent Events (`sse-starlette`) |
| Frontend | React 18, Vite, Tailwind CSS, react-diff-viewer-continued |
| Database | SQLite (dev) |

## Project structure

```
backend/
  app/
    api/          # FastAPI routers (webhook, reviews, stream, config)
    models/       # SQLAlchemy models (Review, ReviewComment)
    services/     # Business logic (ai_service, github_service, review_service, filter_service)
    db/           # Database setup and init
  requirements.txt
frontend/
  src/
    pages/        # Dashboard, PRDetail, Admin
    components/   # PRTable, StatsBar, SummaryCard, RiskScore, SeverityBadge, CategoryTag
    hooks/        # useReviews, useStream
    services/     # api.js (axios), stream.js (SSE)
```

## Setup

### Backend

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Create `backend/.env`:

```
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_TOKEN=ghp_your_token
AI_PROVIDER=openai           # or claude
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite+aiosqlite:///./reviews.db
FRONTEND_URL=http://localhost:5173
```

```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### GitHub webhook

Expose your local backend with [ngrok](https://ngrok.com):

```bash
ngrok http 8000
```

Set the webhook URL in your GitHub repo to `https://<your-ngrok-url>/webhook/github` with content type `application/json` and the same secret as `GITHUB_WEBHOOK_SECRET`. Subscribe to **Pull requests** events.

## Switching AI providers

Click the toggle in the top navbar to switch between **GPT-4o** and **Claude Sonnet** at runtime — no restart needed. The model used for each review is stored and shown in the dashboard.

## Admin

Visit `/admin` to clear the local database between demos.
