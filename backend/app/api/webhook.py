from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal
from app.services.github_service import validate_webhook_signature
from app.services.review_service import run_review

router = APIRouter()


async def _run_review_with_session(owner: str, repo: str, pr_number: int):
    async with AsyncSessionLocal() as db:
        await run_review(owner, repo, pr_number, db)


@router.post("/webhook/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    payload_body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    if not validate_webhook_signature(payload_body, signature):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    event = request.headers.get("X-GitHub-Event", "")
    if event != "pull_request":
        return {"status": "ignored", "event": event}

    payload = await request.json()
    action = payload.get("action", "")

    if action not in ("opened", "synchronize"):
        return {"status": "ignored", "action": action}

    pr = payload["pull_request"]
    pr_number = pr["number"]
    owner = payload["repository"]["owner"]["login"]
    repo = payload["repository"]["name"]

    background_tasks.add_task(_run_review_with_session, owner, repo, pr_number)

    return {"status": "accepted", "pr": pr_number, "repo": f"{owner}/{repo}"}
