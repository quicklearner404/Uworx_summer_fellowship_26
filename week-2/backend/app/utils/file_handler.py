import json
from pathlib import Path


BASE_DIR = Path("data/responses")
BASE_DIR.mkdir(parents=True, exist_ok=True)


def save_repository_response(repository: str, data: dict):

    filename = repository.replace("/", "_") + ".json"

    filepath = BASE_DIR / filename

    with open(filepath, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)