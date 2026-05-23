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
        heartbeat_counter = 0
        while True:
            if await request.is_disconnected():
                break

            # Check for reviews completed in the last 10 seconds
            since = datetime.utcnow() - timedelta(seconds=10)
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Review).where(
                        Review.status == "completed",
                        Review.created_at >= since,
                    )
                )
                recent = result.scalars().first()

            if recent:
                yield {"data": json.dumps({"type": "new_review", "review_id": recent.id})}

            # Send heartbeat comment every 15 seconds to keep connection alive
            heartbeat_counter += 1
            if heartbeat_counter >= 8:  # 8 * 2s = 16s
                yield {"comment": "heartbeat"}
                heartbeat_counter = 0

            await asyncio.sleep(2)

    return EventSourceResponse(event_generator())
