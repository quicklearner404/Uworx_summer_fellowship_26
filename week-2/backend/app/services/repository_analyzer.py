from datetime import datetime, timezone


class RepositoryAnalyzer:

    @staticmethod
    def calculate_health_score(repo: dict) -> int:
        score = 50

        # Popular repositories
        if repo["stargazers_count"] > 1000:
            score += 20

        # Active development
        updated = datetime.fromisoformat(
            repo["updated_at"].replace("Z", "+00:00")
        )

        days_since_update = (
            datetime.now(timezone.utc) - updated
        ).days

        if days_since_update <= 30:
            score += 20

        # Community
        if repo["forks_count"] > 100:
            score += 10

        return min(score, 100)