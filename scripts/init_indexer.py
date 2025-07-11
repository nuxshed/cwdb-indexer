import requests
import json
import sys
from urllib.parse import urlparse
from pathlib import Path

def index_repo(repo_url: str):
    parsed = urlparse(repo_url)
    path_parts = parsed.path.strip("/").split("/")
    owner, repo = path_parts[0], path_parts[1]

    api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
    headers = {"Accept": "application/vnd.github+json"}

    print(f"Fetching file tree for {owner}/{repo}...")
    res = requests.get(api_url, headers=headers)
    res.raise_for_status()

    tree = res.json().get("tree", [])

    documents = []
    skipped = 0

    for item in tree:
        if item["type"] != "blob":
            continue

        path = item["path"]
        filename = path.split("/")[-1]

        # ignore these files
        if (
            filename.lower() in {"readme.md", "contributing.md", "temp"} or
            path.startswith(".github/") or
            path == ".github"
        ):
            skipped += 1
            continue

        doc = {
            "id": f"{owner}/{repo}/{path}",
            "filename": filename,
            "path": path,
            "repo": repo,
            "owner": owner,
            "url": f"https://github.com/{owner}/{repo}/blob/main/{path}",
            "tags": {
                "course": "",
                "shortCourse": "",
                "type": ""
            }
        }
        documents.append(doc)

    output_dir = Path(__file__).resolve().parent.parent / "data"
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / f"{owner}.{repo}.json"

    with open(out_path, "w") as f:
        json.dump(documents, f, indent=2)

    print(f"Indexed {len(documents)} files")
    print(f"Skipped {skipped} unwanted files")
    print(f"Output saved to: {out_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python index_github_repo.py <github-repo-url>")
        sys.exit(1)

    index_repo(sys.argv[1])
