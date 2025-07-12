import requests
import json
import sys
from urllib.parse import urlparse
from pathlib import Path
import uuid

def index_repo(repo_url: str):
    parsed = urlparse(repo_url)
    path_parts = parsed.path.strip("/").split("/")
    owner = path_parts[0]
    repo = path_parts[1]
    branch = path_parts[2] if len(path_parts) > 2 else "main"

    api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    headers = {"Accept": "application/vnd.github+json"}

    print(f"Fetching file tree for {owner}/{repo} on branch '{branch}'...")
    res = requests.get(api_url, headers=headers)
    res.raise_for_status()

    tree = res.json().get("tree", [])

    output_dir = Path(__file__).resolve().parent.parent / "data"
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / f"{owner}.{repo}.json"

    existing_docs = {}
    if out_path.exists():
        with open(out_path, "r") as f:
            try:
                existing_docs_list = json.load(f)
                existing_docs = {doc["id"]: doc for doc in existing_docs_list}
            except json.JSONDecodeError:
                print("\033[91mWarning: could not parse existing JSON file\033[0m")

    added = 0
    skipped = 0
    ignored = 0

    for item in tree:
        if item["type"] != "blob":
            continue

        path = item["path"]
        filename = path.split("/")[-1]

        # ignore files
        if (
            filename.lower() in {"readme.md", "contributing.md", "temp"} or
            path.startswith(".github/") or
            path == ".github"
        ):
            ignored += 1
            continue

        doc_id = f"{owner}/{repo}/{path}"
        if doc_id in existing_docs:
            skipped += 1
            continue

        new_doc = {
            "uid": str(uuid.uuid4()),
            "id": doc_id,
            "filename": filename,
            "path": path,
            "repo": repo,
            "owner": owner,
            "branch": branch,
            "url": f"https://github.com/{owner}/{repo}/blob/{branch}/{path}",
            "tags": {
                "course": "",
                "shortCourse": "",
                "type": ""
            }
        }
        existing_docs[doc_id] = new_doc
        added += 1

    updated_list = list(existing_docs.values())
    with open(out_path, "w") as f:
        json.dump(updated_list, f, indent=2)

    print(f"Added {added} new files")
    print(f"Skipped {skipped} already-indexed files")
    print(f"Ignored {ignored} unwanted files")
    print(f"Output saved to: {out_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python index_github_repo.py <github-repo-url>")
        sys.exit(1)

    index_repo(sys.argv[1])
