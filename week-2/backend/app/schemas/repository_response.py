from pydantic import BaseModel


class RepositoryResponse(BaseModel):
    name: str
    owner: str
    description: str | None = None
    stars: int
    forks: int
    open_issues: int
    language: str | None = None
    default_branch: str
    updated_at: str
    health_score: int
    webhook_sent: bool