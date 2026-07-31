"""Telefone brasileiro — máscara, validação e tipo.

Port de ``utils/formatPhone.ts``.
"""

from __future__ import annotations

import re
from typing import Literal

PhoneType = Literal["mobile", "landline"]

_NON_DIGIT = re.compile(r"\D")


def unformat_phone(phone: str | None) -> str:
    """Retorna apenas dígitos."""
    if not phone or not isinstance(phone, str):
        return ""
    return _NON_DIGIT.sub("", phone)


def format_phone(value: str | None) -> str:
    """Aplica máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX."""
    if not value or not isinstance(value, str):
        return ""
    cleaned = unformat_phone(value)
    if len(cleaned) > 11:
        return value[:15]
    formatted = re.sub(r"^(\d{2})(\d)", r"(\1) \2", cleaned)
    formatted = re.sub(r"(\d{4,5})(\d{4})$", r"\1-\2", formatted)
    return formatted


def is_valid_phone(phone: str | None) -> bool:
    """True se tiver 10 (fixo) ou 11 (celular) dígitos."""
    if not phone or not isinstance(phone, str):
        return False
    cleaned = unformat_phone(phone)
    return len(cleaned) in {10, 11}


def get_phone_type(phone: str | None) -> PhoneType | None:
    """Retorna ``mobile``, ``landline`` ou ``None`` se inválido."""
    if not is_valid_phone(phone):
        return None
    cleaned = unformat_phone(phone)
    return "mobile" if len(cleaned) == 11 else "landline"
