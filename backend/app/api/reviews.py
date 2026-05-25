from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import logging

from app.db.database import get_db, AsyncSessionLocal
from app.models.review import Review
from app.models.comment import ReviewComment
from app.services.review_service import run_review

logger = logging.getLogger(__name__)

router = APIRouter()


class CommentOut(BaseModel):
    id: int
    review_id: int
    file_name: str
    line_number: Optional[int]
    severity: str
    confidence: Optional[float]
    category: str
    description: str
    suggested_fix: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SeverityCounts(BaseModel):
    critical: int = 0
    warning: int = 0
    suggestion: int = 0


class ReviewOut(BaseModel):
    id: int
    pr_number: int
    repo_name: str
    pr_title: Optional[str]
    author: Optional[str]
    status: str
    recommendation: Optional[str]
    risk_score: Optional[float]
    summary: Optional[str]
    ai_provider: Optional[str]
    created_at: datetime
    severity_counts: SeverityCounts = SeverityCounts()

    model_config = {"from_attributes": True}


class ReviewDetailOut(ReviewOut):
    comments: list[CommentOut] = []
    diff_json: Optional[str] = None


async def _get_severity_counts(review_id: int, db: AsyncSession) -> SeverityCounts:
    result = await db.execute(
        select(ReviewComment.severity, func.count(ReviewComment.id))
        .where(ReviewComment.review_id == review_id)
        .group_by(ReviewComment.severity)
    )
    rows = result.all()
    counts = SeverityCounts()
    for severity, count in rows:
        if severity == "critical":
            counts.critical = count
        elif severity == "warning":
            counts.warning = count
        elif severity == "suggestion":
            counts.suggestion = count
    return counts


@router.get("/reviews", response_model=list[ReviewOut])
async def list_reviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()

    out = []
    for review in reviews:
        counts = await _get_severity_counts(review.id, db)
        review_out = ReviewOut.model_validate(review)
        review_out.severity_counts = counts
        out.append(review_out)

    return out


@router.delete("/admin/clear-db")
async def clear_db(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ReviewComment))
    await db.execute(delete(Review))
    await db.commit()
    return {"status": "cleared"}


async def _retrigger_bg(owner: str, repo: str, pr_number: int):
    try:
        async with AsyncSessionLocal() as db:
            await run_review(owner, repo, pr_number, db)
    except Exception as e:
        logger.error(f"Retrigger failed for {owner}/{repo}#{pr_number}: {type(e).__name__}: {e}")


@router.post("/reviews/{review_id}/retrigger")
async def retrigger_review(review_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Review not found")

    owner, repo = source.repo_name.split("/", 1)
    background_tasks.add_task(_retrigger_bg, owner, repo, source.pr_number)
    return {"status": "accepted", "pr_number": source.pr_number, "repo": source.repo_name}


@router.get("/reviews/{review_id}", response_model=ReviewDetailOut)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    comments_result = await db.execute(
        select(ReviewComment).where(ReviewComment.review_id == review_id)
    )
    comments = comments_result.scalars().all()
    counts = await _get_severity_counts(review_id, db)

    review_out = ReviewDetailOut.model_validate(review)
    review_out.comments = [CommentOut.model_validate(c) for c in comments]
    review_out.severity_counts = counts

    return review_out
