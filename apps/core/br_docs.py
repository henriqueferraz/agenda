"""CPF e CNPJ — validação algorítmica e máscaras.

Port de ``utils/formatCPF.ts`` e ``utils/formatCNPJ.ts``.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_NON_DIGIT = re.compile(r"\D")
_CPF_REPEATED = re.compile(r"^(\d)\1{10}$")
_CNPJ_REPEATED = re.compile(r"^(\d)\1{13}$")
_CPF_MASKED = re.compile(r"^\d{3}\.\d{3}\.\d{3}-\d{2}$")
_CNPJ_MASKED = re.compile(r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$")


@dataclass(frozen=True, slots=True)
class DocFormatResult:
    formatted: str
    is_valid: bool


def _only_digits(value: str) -> str:
    return _NON_DIGIT.sub("", value)


def _cpf_verifier(digits: list[int], weight_start: int) -> int:
    total = sum(digit * (weight_start - index) for index, digit in enumerate(digits))
    remainder = total % 11
    return 0 if remainder < 2 else 11 - remainder


def _is_valid_cpf_digits(cpf: str) -> bool:
    if len(cpf) != 11 or _CPF_REPEATED.match(cpf):
        return False
    digits = [int(ch) for ch in cpf]
    if _cpf_verifier(digits[:9], 10) != digits[9]:
        return False
    return _cpf_verifier(digits[:10], 11) == digits[10]


def unformat_cpf(cpf: str) -> str:
    """Retorna apenas dígitos do CPF."""
    return _only_digits(cpf)


def mask_cpf(cpf: str) -> str:
    """Aplica máscara XXX.XXX.XXX-XX."""
    clean = unformat_cpf(cpf)
    if len(clean) != 11:
        return clean
    return f"{clean[:3]}.{clean[3:6]}.{clean[6:9]}-{clean[9:]}"


def is_cpf_valid(cpf: str | None) -> bool:
    """Valida CPF pelo algoritmo oficial."""
    if not cpf or not isinstance(cpf, str):
        return False
    clean = unformat_cpf(cpf)
    return len(clean) == 11 and _is_valid_cpf_digits(clean)


def format_cpf(cpf: str | None) -> DocFormatResult:
    """Formata e valida CPF (contrato do legado)."""
    if not cpf or not isinstance(cpf, str):
        return DocFormatResult(formatted="", is_valid=False)
    clean = unformat_cpf(cpf)
    if len(clean) != 11:
        return DocFormatResult(formatted=cpf, is_valid=False)
    valid = _is_valid_cpf_digits(clean)
    if valid or _CPF_MASKED.match(cpf):
        return DocFormatResult(formatted=mask_cpf(clean), is_valid=valid)
    return DocFormatResult(formatted=cpf, is_valid=valid)


def normalize_cpf(cpf: str) -> str:
    """Máscara se válido; senão devolve a entrada."""
    result = format_cpf(cpf)
    return result.formatted if result.is_valid else cpf


def _cnpj_verifier(digits: list[int], weight_start: int) -> int:
    weight = weight_start
    total = 0
    for digit in digits:
        total += digit * weight
        weight = 9 if weight == 2 else weight - 1
    remainder = total % 11
    return 0 if remainder < 2 else 11 - remainder


def _is_valid_cnpj_digits(cnpj: str) -> bool:
    if len(cnpj) != 14 or _CNPJ_REPEATED.match(cnpj):
        return False
    digits = [int(ch) for ch in cnpj]
    if _cnpj_verifier(digits[:12], 5) != digits[12]:
        return False
    return _cnpj_verifier(digits[:13], 6) == digits[13]


def unformat_cnpj(cnpj: str) -> str:
    """Retorna apenas dígitos do CNPJ."""
    return _only_digits(cnpj)


def mask_cnpj(cnpj: str) -> str:
    """Aplica máscara XX.XXX.XXX/XXXX-XX."""
    clean = unformat_cnpj(cnpj)
    if len(clean) != 14:
        return clean
    return f"{clean[:2]}.{clean[2:5]}.{clean[5:8]}/{clean[8:12]}-{clean[12:]}"


def is_cnpj_valid(cnpj: str | None) -> bool:
    """Valida CNPJ pelo algoritmo oficial."""
    if not cnpj or not isinstance(cnpj, str):
        return False
    clean = unformat_cnpj(cnpj)
    return len(clean) == 14 and _is_valid_cnpj_digits(clean)


def format_cnpj(cnpj: str | None) -> DocFormatResult:
    """Formata e valida CNPJ (contrato do legado)."""
    if not cnpj or not isinstance(cnpj, str):
        return DocFormatResult(formatted="", is_valid=False)
    clean = unformat_cnpj(cnpj)
    if len(clean) != 14:
        return DocFormatResult(formatted=cnpj, is_valid=False)
    valid = _is_valid_cnpj_digits(clean)
    if valid or _CNPJ_MASKED.match(cnpj):
        return DocFormatResult(formatted=mask_cnpj(clean), is_valid=valid)
    return DocFormatResult(formatted=cnpj, is_valid=valid)


def normalize_cnpj(cnpj: str) -> str:
    """Máscara se válido; senão devolve a entrada."""
    result = format_cnpj(cnpj)
    return result.formatted if result.is_valid else cnpj
