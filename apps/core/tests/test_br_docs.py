from __future__ import annotations

from apps.core.br_docs import (
    format_cnpj,
    format_cpf,
    is_cnpj_valid,
    is_cpf_valid,
    mask_cnpj,
    mask_cpf,
    normalize_cnpj,
    normalize_cpf,
    unformat_cnpj,
    unformat_cpf,
)

# CPF/CNPJ válidos conhecidos (algoritmo oficial)
VALID_CPF = "39053344705"
VALID_CNPJ = "11222333000181"


def test_cpf_valid_and_mask() -> None:
    assert is_cpf_valid(VALID_CPF)
    assert is_cpf_valid("390.533.447-05")
    assert mask_cpf(VALID_CPF) == "390.533.447-05"
    result = format_cpf(VALID_CPF)
    assert result.is_valid
    assert result.formatted == "390.533.447-05"
    assert normalize_cpf(VALID_CPF) == "390.533.447-05"
    assert unformat_cpf("390.533.447-05") == VALID_CPF


def test_cpf_rejects_repeated_and_invalid() -> None:
    assert not is_cpf_valid("11111111111")
    assert not is_cpf_valid("123")
    assert not is_cpf_valid("")
    assert not is_cpf_valid(None)
    result = format_cpf("123")
    assert not result.is_valid
    assert result.formatted == "123"


def test_cnpj_valid_and_mask() -> None:
    assert is_cnpj_valid(VALID_CNPJ)
    assert is_cnpj_valid("11.222.333/0001-81")
    assert mask_cnpj(VALID_CNPJ) == "11.222.333/0001-81"
    result = format_cnpj(VALID_CNPJ)
    assert result.is_valid
    assert result.formatted == "11.222.333/0001-81"
    assert normalize_cnpj(VALID_CNPJ) == "11.222.333/0001-81"
    assert unformat_cnpj("11.222.333/0001-81") == VALID_CNPJ


def test_cnpj_rejects_repeated_and_invalid() -> None:
    assert not is_cnpj_valid("00000000000000")
    assert not is_cnpj_valid("123")
    assert not is_cnpj_valid(None)
    result = format_cnpj("invalido")
    assert not result.is_valid
    assert result.formatted == "invalido"
