from fastapi import APIRouter, HTTPException

from app.schemas.repository import RepositoryRequest
from app.schemas.repository_response import RepositoryResponse
from app.services.github_service import GitHubService

router = APIRouter()


@router.post("/analyze", response_model=RepositoryResponse)
def analyze_repository(request: RepositoryRequest):

    repo = GitHubService.get_repository(request.repository)

    if repo is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )

    return repo