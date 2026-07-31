"""Helpers de segurança operacional (ownership, erros opacos, compare)."""

from __future__ import annotations

import secrets
from typing import Any, Protocol


class HasUserId(Protocol):
    user_id: Any


OPAQUE_ERROR_MESSAGE = "Não foi possível concluir a operação."


def opaque_error(*, detail: str | None = None) -> str:
    """Mensagem genérica ao cliente; ``detail`` só para logs internos."""
    _ = detail  # reservado para o chamador logar sem vazar ao cliente
    return OPAQUE_ERROR_MESSAGE


def timing_safe_equal(left: str | bytes, right: str | bytes) -> bool:
    """Comparação timing-safe (tokens, OTP hasheado comparado como string)."""
    left_b = left.encode("utf-8") if isinstance(left, str) else left
    right_b = right.encode("utf-8") if isinstance(right, str) else right
    if len(left_b) != len(right_b):
        # Evita short-circuit óbvio de tamanho: compara com padding dummy.
        secrets.compare_digest(left_b, left_b)
        return False
    return secrets.compare_digest(left_b, right_b)


def assert_same_owner(user_id: Any, resource: HasUserId) -> None:
    """Garante ``resource.user_id == user_id``; levanta PermissionError se não."""
    if getattr(resource, "user_id", object()) != user_id:
        raise PermissionError(opaque_error(detail="ownership mismatch"))


def is_same_owner(user_id: Any, resource: HasUserId) -> bool:
    """True se o recurso pertence ao usuário da sessão."""
    return getattr(resource, "user_id", object()) == user_id
