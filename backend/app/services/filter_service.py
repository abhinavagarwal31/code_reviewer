import fnmatch

SKIP_PATTERNS = [
    "package-lock.json",
    "yarn.lock",
    "*.min.js",
    "*.lock",
    "*.snap",
    "*/dist/*",
    "*/build/*",
    "*/__generated__/*",
    "*/migrations/*",
]

MAX_LINES = 500


def _should_skip(filename: str) -> bool:
    for pattern in SKIP_PATTERNS:
        if fnmatch.fnmatch(filename, pattern):
            return True
    return False


def filter_diff(files: list) -> dict:
    filtered_files = []
    skipped_files = []
    total_lines = 0

    for f in files:
        filename = f.get("filename", "")
        patch = f.get("patch", "")

        if _should_skip(filename) or not patch:
            skipped_files.append(filename)
            continue

        file_lines = patch.splitlines()

        if total_lines >= MAX_LINES:
            skipped_files.append(filename)
            continue

        remaining = MAX_LINES - total_lines
        if len(file_lines) > remaining:
            patch = "\n".join(file_lines[:remaining])
            file_lines = file_lines[:remaining]

        filtered_files.append({"filename": filename, "patch": patch})
        total_lines += len(file_lines)

    return {
        "filtered_files": filtered_files,
        "skipped_files": skipped_files,
        "total_lines": total_lines,
    }
