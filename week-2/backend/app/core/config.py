from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    APP_NAME = os.getenv("APP_NAME", "GitHub Repository Explorer")
    GITHUB_API = os.getenv("GITHUB_API", "https://api.github.com")
    WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

settings = Settings()