import requests

from app.core.config import settings


class WebhookService:

    @staticmethod
    def send(payload: dict):

        if not settings.WEBHOOK_URL:
            return False

        try:
            response = requests.post(
                settings.WEBHOOK_URL,
                json=payload,
                timeout=5
            )

            return response.status_code == 200

        except Exception:
            return False