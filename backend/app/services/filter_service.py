import os

SKIP_EXACT = {"package-lock.json", "yarn.lock"}
SKIP_EXTENSIONS = {".min.js", ".lock", ".snap"}
SKIP_PATH_SEGMENTS = {"dist", "build", "__generated__", "migrations", "node_modules"}

MAX_LINES = 500


def _should_skip(filename: str) -> bool:
    base = filename.replace("\\", "/").split("/")[-1]
    if base in SKIP_EXACT:
        return True
    if base.endswith(".min.js") or base.endswith(".min.css"):
        return True
    _, ext = os.path.splitext(base)
    if ext in SKIP_EXTENSIONS:
        return True
    parts = set(filename.replace("\\", "/").split("/"))
    if parts & SKIP_PATH_SEGMENTS:
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
