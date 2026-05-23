import os
import hmac
import hashlib
import httpx
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_API = "https://api.github.com"

SEVERITY_EMOJI = {
    "critical": "🔴",
    "warning": "🟡",
    "suggestion": "🔵",
}

CATEGORY_EMOJI = {
    "bug": "🐛",
    "security": "🔒",
    "performance": "⚡",
    "style": "✨",
}

_HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def validate_webhook_signature(payload_body: bytes, signature_header: str) -> bool:
    secret = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    if not secret or not signature_header:
        return False
    expected = "sha256=" + hmac.new(
        secret.encode(), payload_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


async def fetch_pr_files(owner: str, repo: str, pr_number: int) -> list:
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}/files"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=_HEADERS)
        response.raise_for_status()
        return response.json()


async def fetch_pr_details(owner: str, repo: str, pr_number: int) -> dict:
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=_HEADERS)
        response.raise_for_status()
        data = response.json()
        return {
            "title": data.get("title"),
            "body": data.get("body"),
            "author": data["user"]["login"],
            "commit_sha": data["head"]["sha"],
        }


def _format_comment_body(issue: dict) -> str:
    severity = issue.get("severity", "suggestion")
    category = issue.get("category", "style")
    sev_emoji = SEVERITY_EMOJI.get(severity, "🔵")
    cat_emoji = CATEGORY_EMOJI.get(category, "✨")
    confidence = issue.get("confidence", 0)
    lines = [
        f"{sev_emoji} **{severity.upper()}** {cat_emoji} {category.capitalize()}",
        "",
        issue.get("description", ""),
    ]
    fix = issue.get("suggested_fix")
    if fix:
        lines += ["", f"**Suggested fix:** {fix}"]
    lines += ["", f"**Confidence:** {int(confidence * 100)}%"]
    return "\n".join(lines)


async def post_review_to_github(
    owner: str,
    repo: str,
    pr_number: int,
    commit_sha: str,
    summary: str,
    recommendation: str,
    issues: list,
) -> bool:
    event_map = {
        "approve": "APPROVE",
        "request_changes": "REQUEST_CHANGES",
        "needs_discussion": "COMMENT",
    }
    event = event_map.get(recommendation, "COMMENT")

    comments = []
    for issue in issues:
        line = issue.get("line_number")
        if not line:
            continue
        comments.append({
            "path": issue.get("file_name", ""),
            "line": line,
            "body": _format_comment_body(issue),
        })

    risk = issues[0].get("risk_score") if issues else None
    body_lines = [f"## AI Code Review\n\n{summary}"]
    if risk is not None:
        body_lines.append(f"\n**Risk Score:** {risk}/10")
    body_lines.append(f"\n**Recommendation:** {recommendation.replace('_', ' ').title()}")
    body = "\n".join(body_lines)

    payload = {
        "commit_id": commit_sha,
        "body": body,
        "event": event,
        "comments": comments,
    }

    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}/reviews"
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=_HEADERS, json=payload)
        if response.status_code not in (200, 201):
            print(f"GitHub review post failed: {response.status_code} {response.text}")
            return False
        return True
