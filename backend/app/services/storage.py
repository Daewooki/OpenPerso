"""MinIO storage utility for uploading and serving files."""

import io
import logging
import uuid

from minio import Minio
from minio.error import S3Error

from app.config import settings

logger = logging.getLogger(__name__)

_client: Minio | None = None


def _get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=False,
        )
        if not _client.bucket_exists(settings.minio_bucket):
            _client.make_bucket(settings.minio_bucket)
            logger.info("Created MinIO bucket: %s", settings.minio_bucket)
    return _client


def upload_bytes(data: bytes, folder: str, extension: str, content_type: str) -> str:
    """Upload raw bytes to MinIO. Returns the object name (path)."""
    client = _get_client()
    filename = f"{folder}/{uuid.uuid4().hex}.{extension}"

    client.put_object(
        settings.minio_bucket,
        filename,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return filename


def get_public_url(object_name: str) -> str:
    """Return a backend-proxy URL for the given object."""
    host = settings.backend_host
    if host == "0.0.0.0":
        host = "localhost"
    base = settings.backend_public_url or f"http://{host}:{settings.backend_port}"
    return f"{base}/api/v1/files/{object_name}"


def get_object(object_name: str) -> bytes | None:
    """Download an object from MinIO. Returns None if not found."""
    client = _get_client()
    try:
        response = client.get_object(settings.minio_bucket, object_name)
        data = response.read()
        response.close()
        response.release_conn()
        return data
    except S3Error as e:
        if e.code == "NoSuchKey":
            return None
        raise


def upload_image(image_data: bytes, folder: str = "avatars") -> str:
    """Upload an image and return its public URL."""
    object_name = upload_bytes(image_data, folder, "png", "image/png")
    return get_public_url(object_name)


def upload_audio(audio_data: bytes, folder: str = "audio") -> str:
    """Upload an audio file and return its public URL."""
    object_name = upload_bytes(audio_data, folder, "mp3", "audio/mpeg")
    return get_public_url(object_name)
