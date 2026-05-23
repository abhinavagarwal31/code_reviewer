from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.review import Review
from app.models.comment import ReviewComment
from app.services.github_service import fetch_pr_details, fetch_pr_files, post_review_to_github
from app.services.filter_service import filter_diff
from app.services.ai_service import analyze_code


async def run_review(owner: str, repo: str, pr_number: int, db: AsyncSession) -> Review:
    review = Review(
        pr_number=pr_number,
        repo_name=f"{owner}/{repo}",
        status="pending",
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    try:
        pr_details = await fetch_pr_details(owner, repo, pr_number)
        review.pr_title = pr_details["title"]
        review.author = pr_details["author"]
        commit_sha = pr_details["commit_sha"]

        raw_files = await fetch_pr_files(owner, repo, pr_number)
        filtered = filter_diff(raw_files)

        diff_parts = []
        for f in filtered["filtered_files"]:
            diff_parts.append(f"--- {f['filename']} ---\n{f['patch']}")
        diff_content = "\n\n".join(diff_parts)

        analysis = await analyze_code(diff_content)

        review.summary = analysis.get("summary")
        review.recommendation = analysis.get("recommendation")
        review.risk_score = float(analysis.get("risk_score", 0))

        for issue in analysis.get("issues", []):
            comment = ReviewComment(
                review_id=review.id,
                file_name=issue.get("file_name", ""),
                line_number=issue.get("line_number"),
                severity=issue.get("severity", "suggestion"),
                confidence=issue.get("confidence"),
                category=issue.get("category", "style"),
                description=issue.get("description", ""),
                suggested_fix=issue.get("suggested_fix"),
            )
            db.add(comment)

        review.status = "completed"
        await db.commit()
        await db.refresh(review)

        await post_review_to_github(
            owner=owner,
            repo=repo,
            pr_number=pr_number,
            commit_sha=commit_sha,
            summary=review.summary or "",
            recommendation=review.recommendation or "needs_discussion",
            issues=analysis.get("issues", []),
        )

    except Exception as e:
        review.status = "failed"
        await db.commit()
        raise e

    return review
