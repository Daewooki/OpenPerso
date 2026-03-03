from celery import Celery

from app.config import settings

celery_app = Celery("persona_platform", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Seoul",
    enable_utc=True,
)

celery_app.autodiscover_tasks(["app.workers"])
