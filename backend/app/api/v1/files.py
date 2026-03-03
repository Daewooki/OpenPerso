"""File proxy endpoint — serves MinIO objects through the backend."""

import logging
import mimetypes

from fastapi import APIRouter
from fastapi.responses import Response

from app.services.storage import get_object

router = APIRouter(prefix="/files", tags=["files"])
logger = logging.getLogger(__name__)

CACHE_MAX_AGE = 86400  # 24 hours


@router.get("/{file_path:path}")
@router.head("/{file_path:path}")
async def serve_file(file_path: str):
    """Proxy a file from MinIO storage with browser caching."""
    data = get_object(file_path)
    if data is None:
        return Response(status_code=404, content="Not found")

    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = "application/octet-stream"

    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": f"public, max-age={CACHE_MAX_AGE}"},
    )
