# AI Code Review Assistant

## Project Overview
This is a hackathon project — an AI-powered code review assistant that:
- Receives GitHub pull request webhooks
- Fetches and filters the PR diff
- Sends it to OpenAI (primary) or Claude (secondary) for analysis
- Posts inline review comments back to the GitHub PR
- Displays all reviews on a React dashboard

## Tech Stack
- Backend: Python + FastAPI
- AI: OpenAI GPT-4o (primary), Claude Sonnet 4 (secondary), switchable via AI_PROVIDER env var
- Database: SQLite (dev), PostgreSQL (prod)
- ORM: SQLAlchemy (async)
- Real-time: Server-Sent Events (SSE)
- Frontend: React + Tailwind CSS + react-diff-viewer
- GitHub: Webhooks + REST API via PyGithub

## Project Structure
backend/ — FastAPI server
frontend/ — React app

## Key Rules
- Always use async/await in FastAPI
- Always validate GitHub webhook signatures
- Filter out lock files and build artifacts before sending to AI
- AI must return structured JSON only — no markdown in the response
- Keep frontend components small and focused
- Use Tailwind for all styling — no custom CSS files
