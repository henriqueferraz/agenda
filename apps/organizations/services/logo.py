"""Upload de logo (filesystem local ou Supabase Storage)."""

from __future__ import annotations

import logging
import mimetypes
import uuid
from dataclasses import dataclass
from urllib import error, request

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from apps.accounts.models import User
from apps.organizations.services.profile import get_or_create_profile

logger = logging.getLogger(__name__)

MAX_LOGO_BYTES = 1_000_000
_PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
_JPEG_MAGIC = b"\xff\xd8\xff"


@dataclass(frozen=True, slots=True)
class LogoResult:
    ok: bool
    message: str
    logo_url: str = ""


def _detect_image_type(content: bytes) -> tuple[str, str] | None:
    """Retorna (extensão, content-type) se PNG/JPEG válidos pelo magic bytes."""
    if content.startswith(_PNG_MAGIC):
        return "png", "image/png"
    if content.startswith(_JPEG_MAGIC):
        return "jpg", "image/jpeg"
    return None


def _upload_supabase(*, path: str, content: bytes, content_type: str) -> str | None:
    base = (settings.SUPABASE_URL or "").rstrip("/")
    key = settings.SUPABASE_SERVICE_ROLE_KEY or ""
    bucket = settings.SUPABASE_STORAGE_LOGO_BUCKET or "logos"
    if not base or not key:
        return None
    url = f"{base}/storage/v1/object/{bucket}/{path}"
    req = request.Request(
        url,
        data=content,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "apikey": key,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
    )
    try:
        with request.urlopen(req, timeout=20) as resp:  # noqa: S310
            if int(resp.status) >= 400:
                return None
    except error.URLError:
        logger.exception("Falha ao enviar logo ao Supabase")
        return None
    return f"{base}/storage/v1/object/public/{bucket}/{path}"


def upload_logo(*, user: User, content: bytes, filename: str = "") -> LogoResult:
    if not content:
        return LogoResult(ok=False, message="Arquivo vazio.")
    if len(content) > MAX_LOGO_BYTES:
        return LogoResult(ok=False, message="Arquivo muito grande. Tamanho máximo: 1 MB.")
    detected = _detect_image_type(content)
    if detected is None:
        return LogoResult(ok=False, message="Envie uma imagem PNG ou JPG válida.")
    ext, content_type = detected
    _ = filename  # nome do cliente ignorado — só extensão detectada
    path = f"logos/{user.pk}/{uuid.uuid4().hex}.{ext}"

    public_url = _upload_supabase(path=path, content=content, content_type=content_type)
    if public_url is None:
        saved = default_storage.save(path, ContentFile(content))
        try:
            public_url = default_storage.url(saved)
        except Exception:  # noqa: BLE001
            public_url = saved

    profile = get_or_create_profile(user)
    profile.logo = public_url
    profile.save(update_fields=["logo", "updated_at"])
    return LogoResult(ok=True, message="Logo atualizado.", logo_url=public_url)


def clear_logo(*, user: User) -> LogoResult:
    profile = get_or_create_profile(user)
    profile.logo = ""
    profile.save(update_fields=["logo", "updated_at"])
    return LogoResult(ok=True, message="Logo removido.")


def guess_content_type(filename: str) -> str:
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or "application/octet-stream"
