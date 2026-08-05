from pydantic import BaseModel


class RepositoryRequest(BaseModel):
    repository: str