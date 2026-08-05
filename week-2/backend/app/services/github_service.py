import requests

from app.core.config import settings
from app.utils.file_handler import save_repository_response
from app.services.repository_analyzer import RepositoryAnalyzer
from app.services.webhook_service import WebhookService
class GitHubService:

    @staticmethod
    def get_repository(repository: str):

        url = f"{settings.GITHUB_API}/repos/{repository}"

        response = requests.get(url)

        if response.status_code != 200:
            return None

        data = response.json()
        health_score = RepositoryAnalyzer.calculate_health_score(data)
        save_repository_response(repository, data)
        payload = {
            "event": "repository_analyzed",
            "repository": repository,
            "owner": data["owner"]["login"],
            "health_score": health_score,
            "stars": data["stargazers_count"],
            "forks": data["forks_count"],
            "timestamp": data["updated_at"]
        }
        webhook_sent = WebhookService.send(payload)

        return {
            "name": data["name"],
            "owner": data["owner"]["login"],
            "description": data["description"],
            "health_score": health_score,
            "stars": data["stargazers_count"],
            "forks": data["forks_count"],
            "open_issues": data["open_issues_count"],
            "language": data["language"],
            "default_branch": data["default_branch"],
            "updated_at": data["updated_at"],
            "webhook_sent": webhook_sent
        }
