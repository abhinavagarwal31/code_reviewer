import asyncio
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Request
from sqlalchemy import select
from sse_starlette.sse import EventSourceResponse

from app.db.database import AsyncSessionLocal
from app.models.review import Review

router = APIRouter()


@router.get("/stream")
async def stream(request: Request):
    async def event_generator():
        # Track id → last-seen status so we re-emit when pending → completed
        seen: dict[int, str] = {}
        heartbeat_counter = 0

        while True:
            if await request.is_disconnected():
                break

            since = datetime.utcnow() - timedelta(seconds=60)
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Review).where(Review.created_at >= since)
                )
                recent = result.scalars().all()

            for review in recent:
                if seen.get(review.id) != review.status:
                    seen[review.id] = review.status
                    yield {"data": json.dumps({"type": "new_review", "review_id": review.id})}

            heartbeat_counter += 1
            if heartbeat_counter >= 8:
                yield {"comment": "heartbeat"}
                heartbeat_counter = 0

            await asyncio.sleep(2)

    return EventSourceResponse(event_generator())
