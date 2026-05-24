import os
import json
import re
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

# Mutable at runtime via /config/provider endpoint
_current_provider = os.getenv("AI_PROVIDER", "openai")


def get_provider() -> str:
    return _current_provider


def set_provider(provider: str):
    global _current_provider
    if provider not in ("openai", "claude"):
        raise ValueError(f"Unknown provider: {provider}")
    _current_provider = provider


SYSTEM_PROMPT = """You are an expert code reviewer specializing in security, performance, and software quality.

Analyze the provided code diff and return ONLY a valid JSON object with this exact structure:

{
  "summary": "Brief overall assessment of the PR",
  "recommendation": "approve | request_changes | needs_discussion",
  "risk_score": 0-10,
  "issues": [
    {
      "file_name": "path/to/file.py",
      "line_number": 42,
      "severity": "critical | warning | suggestion",
      "confidence": 0.0-1.0,
      "category": "bug | security | performance | style",
      "description": "Clear explanation of the issue",
      "suggested_fix": "Specific code or approach to fix it"
    }
  ]
}

Severity guide:
- critical: Bugs that will crash, security vulnerabilities, data loss risk
- warning: Bad practices, potential runtime errors, logic flaws
- suggestion: Style improvements, minor optimizations, readability improvements, missing type hints, missing docstrings, naming conventions, magic numbers, code that works but could be cleaner

Coverage requirement: You MUST report issues at ALL three severity levels if they exist. Do not skip suggestions just because critical issues are present. A thorough review always includes style and readability feedback alongside security and bug findings. If the diff has more than 20 lines, expect to find at least 2-3 suggestions.

Return only JSON. No markdown. No explanation outside the JSON."""


def _clean_json(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


async def _analyze_with_openai(diff_content: str) -> dict:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this diff:\n\n{diff_content}"},
        ],
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content
    return json.loads(_clean_json(raw))


async def _analyze_with_claude(diff_content: str) -> dict:
    client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Review this diff:\n\n{diff_content}"},
        ],
    )
    raw = response.content[0].text
    return json.loads(_clean_json(raw))


async def analyze_code(diff_content: str) -> tuple[dict, str]:
    provider = get_provider()
    if provider == "claude":
        result = await _analyze_with_claude(diff_content)
    else:
        result = await _analyze_with_openai(diff_content)
    return result, provider
