import os
import sys
import json
import requests
from getpass import getpass

MEILI_API_KEY = os.getenv("MEILI_API_KEY")
if not MEILI_API_KEY:
    MEILI_API_KEY = getpass("Enter Meilisearch API key: ")

MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")
INDEX_NAME = "resources"

headers = {
    "Authorization": f"Bearer {MEILI_API_KEY}",
    "Content-Type": "application/json"
}

def update_index_settings():
    settings = {
        "searchableAttributes": [
            "filename",
            "path",
            "owner",
            "tags.course",
            "tags.shortCourse",
            "tags.type"
        ],
        "filterableAttributes": [
            "repo",
            "owner",
            "tags.course",
            "tags.shortCourse",
            "tags.type"
        ]
    }

    print("Updating index settings...")

    res = requests.patch(
        f"{MEILI_URL}/indexes/{INDEX_NAME}/settings",
        headers=headers,
        json=settings
    )

    if res.status_code != 202:
        print(f"Failed to update settings: {res.text}")
    else:
        print(f"Index settings update enqueued (task UID: {res.json().get('taskUid')})")

def check_health():
    try:
        res = requests.get(f"{MEILI_URL}/health")
        if res.status_code == 200:
            print("Meilisearch is running.")
            return True
    except Exception as e:
        print(f"Meilisearch not reachable: {e}")
    return False

def upload_documents(json_path):
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            docs = json.load(f)
    except Exception as e:
        print(f"Failed to read {json_path}: {e}")
        return

    if not isinstance(docs, list) or len(docs) == 0:
        print(f"Skipping {json_path} (not a non-empty list of documents)")
        return

    print(f"→ Uploading {len(docs)} documents from {os.path.basename(json_path)}")

    res = requests.post(
        f"{MEILI_URL}/indexes/{INDEX_NAME}/documents",
        headers=headers,
        json=docs
    )

    if res.status_code != 202:
        print(f"Upload failed for {json_path}: {res.text}")
    else:
        task_uid = res.json().get("taskUid")
        print(f"Enqueued upload (task UID: {task_uid})")

def main():
    if not check_health():
        return

    update_index_settings()

    data_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "../data")

    if not os.path.isdir(data_dir):
        print(f"Data directory does not exist: {data_dir}")
        return

    print(f"Scanning: {data_dir}")
    for filename in os.listdir(data_dir):
        if filename.endswith(".json"):
            full_path = os.path.join(data_dir, filename)
            upload_documents(full_path)

if __name__ == "__main__":
    main()
