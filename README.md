# MergeLens

MergeLens automatically reviews GitHub Pull Requests using AI — posting inline comments, scoring risk, and tracking every review on a live dashboard.

`Python 3.12` · `FastAPI` · `React 19` · `OpenAI GPT-4o` · `Anthropic Claude Sonnet` · `SSE` · `SQLite`

---

## Why code review keeps getting skipped

Code review is the step that gets dropped first when a team is moving fast. It requires context, a second pair of eyes, and time — none of which are reliably available. The result is that obvious bugs, SQL injections, and hardcoded credentials ship to production because no one had the bandwidth to catch them.

Existing AI tools like GitHub Copilot PR review and CodeRabbit exist, but they're black boxes. You don't know which model ran, you can't compare how different models analyze the same code, and there's no central place to see patterns across PRs. You can see the comments on an individual PR, but you can't answer "how many critical security issues have we merged in the past two weeks?"

The deeper problem is visibility. Teams don't know what's slipping through. There's no dashboard showing "8 critical security issues this month, 3 SQL injections, risk scores trending up." That view doesn't exist without a dedicated tool.

---

## What MergeLens does

When a developer opens a PR, MergeLens receives a GitHub webhook, fetches the diff, and strips noise — lock files, build artifacts, minified JS, generated migration files — before sending anything to an AI model. This matters: sending a 2,000-line `package-lock.json` to GPT-4o is expensive and produces garbage output. The filtered diff is what the AI actually sees.

The AI returns structured JSON: a risk score from 0 to 10, a recommendation (approve / request changes / needs discussion), and per-line issues categorized by severity (critical / warning / suggestion) and type (bug / security / performance / style). MergeLens posts these as inline review comments directly to the GitHub PR — at the exact file and line number — formatted with severity, category, description, suggested fix, and confidence score.

The MergeLens dashboard updates in real time via Server-Sent Events. When a PR is opened, a pending row appears within two seconds, pulsing while the AI analyzes. When the review completes, the row updates in place with the full results. Every review is persisted, so you can track patterns across PRs over time.

**Key features:**

- **Provider-agnostic AI** — switch between GPT-4o and Claude Sonnet from the navbar at runtime, no restart required. The model used for each review is stored and shown per row, so you can compare outputs side by side.
- **Inline GitHub comments** — issues are posted to the exact file and line number on the PR, with severity, category, description, suggested fix, and confidence score.
- **Live dashboard** — SSE-powered real-time updates. Pending reviews appear immediately and pulse while processing. Completed reviews show risk score and severity breakdown.
- **Diff viewer** — the PR detail page renders the filtered diff with per-file comment grouping, so the code and the AI's analysis appear together.
- **Diff filtering** — lock files, build artifacts, minified JS, and generated files are stripped before the AI sees the diff. This reduces token cost and improves analysis quality.
- **Smart fallback** — GitHub returns 422 when a PR author tries to request changes on their own PR. MergeLens detects this and falls back to a COMMENT review automatically, so the demo never breaks.

---

## Architecture

The webhook endpoint returns 200 immediately. Everything else — fetching the diff, calling the AI, posting to GitHub, writing to the database — runs in a `BackgroundTask` with its own database session. This is not optional: GitHub retries webhooks that time out, and AI analysis takes 10–30 seconds.

The frontend connects to a persistent SSE stream at `/stream`. The server polls the database every two seconds and emits an event whenever a review's status changes — first when it's created as pending, again when it transitions to completed. The frontend reloads the full review list on each event. This gives you the pending → pulsing → completed animation with no WebSocket complexity.

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub                                   │
│   Developer opens PR → Webhook fires (HMAC SHA-256 verified)    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ POST /webhook/github
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (async)                      │
│                                                                 │
│  1. Validate webhook signature                                  │
│  2. Return 200 immediately (BackgroundTask)                     │
│  3. Fetch PR files from GitHub API                              │
│  4. Filter diff (strip lock files, build artifacts, minJS)      │
│  5. Send filtered diff to AI provider                           │
│  6. Parse structured JSON response                              │
│  7. Post inline review comments to GitHub PR                    │
│  8. Save review + comments to SQLite                            │
│  9. SSE stream emits event to connected dashboards              │
└──────────────┬────────────────────────────┬─────────────────────┘
               │                            │
               ▼                            ▼
┌──────────────────────┐      ┌─────────────────────────┐
│   AI Provider Layer  │      │   React Dashboard (SSE) │
│                      │      │                         │
│  OpenAI GPT-4o    ←──┤      │  Pending row appears    │
│  Claude Sonnet    ←──┤      │  Pulses while analyzing │
│                      │      │  Updates on completion  │
│  Runtime-switchable  │      │  Diff viewer + comments │
│  via navbar toggle   │      │  Risk score + severity  │
└──────────────────────┘      └─────────────────────────┘
```

**Why async FastAPI**: The webhook must return 200 immediately. GitHub retries on timeout. The entire review pipeline runs in a `BackgroundTask` with its own database session.

**Why SSE over WebSockets**: SSE is unidirectional server-push, simpler to implement and debug, works over plain HTTP, and is sufficient here — the dashboard only needs to receive, not send.

**Why SQLite**: Single-file, zero-config, sufficient for a team-scale tool. Swapping to PostgreSQL is one connection string change in `.env`.

---

## AI provider design

MergeLens supports two AI providers — OpenAI GPT-4o and Anthropic Claude Sonnet 4. The active provider is selected via a toggle in the navbar and takes effect immediately for all subsequent reviews. Every review records which model analyzed it, shown as a color-coded badge per row in the dashboard (green for GPT-4o, orange for Claude).

Most AI code review tools are locked to a single provider. If that provider has an outage, raises prices, or produces lower-quality results for your codebase, you're stuck. MergeLens treats the AI layer as interchangeable infrastructure.

Both providers receive the same structured system prompt and are expected to return the same JSON schema. The `analyze_code` function in `ai_service.py` is the only provider-specific code — two async functions, one per provider. Adding a new provider requires implementing one function and registering it in `set_provider`. The rest of the system is unchanged.

The architecture supports any provider with a chat completion API. Planned additions include Gemini 1.5 Pro (for large diff handling) and a local Ollama option (for teams with data privacy requirements).

---

## Why existing tools don't solve this

GitHub Copilot PR review is tightly integrated but single-provider, has no dashboard, and gives you no visibility into risk patterns across PRs. CodeRabbit is excellent but SaaS-only, provider-opaque, and expensive at scale. Neither lets you switch models at runtime or compare how GPT-4o and Claude Sonnet analyze the same code.

MergeLens is self-hostable, provider-transparent, and gives you a persistent dashboard. The tradeoff is that it requires a one-time webhook setup per repository — a production version would automate this with a GitHub App.

---

## Project structure

```
backend/
  app/
    api/
      webhook.py      # POST /webhook/github — validates HMAC, runs review in background
      reviews.py      # GET /reviews, GET /reviews/:id — Pydantic response models
      stream.py       # GET /stream — SSE event generator
      config.py       # GET/POST /config/provider — runtime provider switching
    models/
      review.py       # Review SQLAlchemy model (stores ai_provider, diff_json, risk_score)
      comment.py      # ReviewComment model (file, line, severity, category, fix)
    services/
      ai_service.py       # analyze_code() — OpenAI and Claude implementations
      github_service.py   # fetch_pr_details(), fetch_pr_files(), post_review_to_github()
      review_service.py   # run_review() — orchestrates the full pipeline
      filter_service.py   # filter_diff() — strips noise before sending to AI
    db/
      database.py     # Async engine, session factory, Base, get_db dependency
      init_db.py      # Creates tables on startup
  requirements.txt
frontend/
  src/
    pages/
      Dashboard.jsx   # PR list with StatsBar and PRTable
      PRDetail.jsx    # Diff viewer + per-file comment cards
      Admin.jsx       # Clear DB (at /admin, not on main dashboard)
    components/
      PRTable.jsx         # Table with severity counts, risk score, AI badge, pending pulse
      StatsBar.jsx        # Aggregate stats: total PRs, critical count, warnings, suggestions
      SummaryCard.jsx     # PR title, recommendation badge, risk score
      RiskScore.jsx       # Score/10 with color-coded progress bar
      SeverityBadge.jsx   # FA icon + label for critical/warning/suggestion
      CategoryTag.jsx     # FA icon + label for bug/security/performance/style
    hooks/
      useReviews.js   # Fetches review list, exposes reload()
      useStream.js    # Subscribes to SSE, calls onNew on each event
    services/
      api.js          # axios wrappers: fetchReviews, fetchReview, clearDb, getProvider, setProvider
      stream.js       # SSE client with auto-reconnect after 3s
```

---

## Setup

**Prerequisites:** Python 3.12, Node 20+, ngrok

### Backend

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Create `backend/.env`:

```
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_TOKEN=ghp_your_personal_access_token
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite+aiosqlite:///./reviews.db
FRONTEND_URL=http://localhost:5173
```

```bash
cd backend
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### GitHub webhook

Expose the backend publicly with ngrok:

```bash
ngrok http 8000
```

In your GitHub repository: **Settings → Webhooks → Add webhook**

- **Payload URL:** `https://<your-ngrok-url>/webhook/github`
- **Content type:** `application/json`
- **Secret:** the value of `GITHUB_WEBHOOK_SECRET` in your `.env`
- **Events:** Pull requests only

The ping event should show a green checkmark. Open a PR and watch the dashboard.

### Switching providers

Click the toggle in the navbar between **GPT-4o** and **Claude Sonnet**. The switch takes effect immediately for the next review. To compare both models on the same PR, switch providers and redeliver the webhook from GitHub's Recent Deliveries tab.

---

## Design decisions worth noting

**Diff filtering before AI** — Lock files and build artifacts add thousands of lines to a diff without containing reviewable logic. Filtering them out before calling the AI reduces token cost significantly and focuses the model on code that actually matters.

**Structured JSON output from AI** — The system prompt demands a strict JSON schema with no markdown. This makes parsing deterministic. Both providers are told to return only JSON — no preamble, no explanation outside the object. A `_clean_json` utility strips any accidental markdown fences before parsing.

**422 fallback for self-review** — GitHub returns 422 with "Can not request changes on your own pull request" when the token owner is also the PR author. MergeLens catches this specific status code and retries with `COMMENT` instead of `REQUEST_CHANGES`, so demo PRs from your own account always succeed.

**SSE deduplication with status tracking** — The stream tracks `{review_id: last_seen_status}` rather than a simple seen-ID set. This means a review emits two events: once when created as pending, and again when it transitions to completed. A simple ID set would suppress the completion event.

**BackgroundTask with its own session** — The webhook handler creates a `Review` row, commits, and hands off to a background task. The background task opens a fresh `AsyncSession` — it cannot reuse the request session, which is closed before the task runs. Every async operation in the pipeline uses `await`.

---

## What's next

- **GitHub App** — automate webhook setup per repository. Currently requires manual configuration for each repo.
- **Per-repository provider preferences** — let different repos default to different models.
- **Additional providers** — Gemini 1.5 Pro for large diffs, local Ollama for air-gapped environments.
- **Side-by-side provider comparison** — run both models on the same PR and render their outputs together, highlighting where they disagree.
- **Team analytics** — critical issue trends over time, per-author risk averages, most-flagged file paths.
