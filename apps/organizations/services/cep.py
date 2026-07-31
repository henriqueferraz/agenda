"""Busca de CEP (ViaCEP → BrasilAPI) e formatação.

Port de ``utils/cep.ts``. Destino canônico: ``apps/organizations/services``.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from apps.core.br_geo import is_valid_uf

logger = logging.getLogger(__name__)

_NON_DIGIT = re.compile(r"\D")
DEFAULT_TIMEOUT_S = 7.0


@dataclass(frozen=True, slots=True)
class AddressData:
    cep: str
    logradouro: str
    complemento: str
    bairro: str
    localidade: str
    uf: str
    ibge: str | None = None
    gia: str | None = None
    ddd: str | None = None
    siafi: str | None = None


@dataclass(frozen=True, slots=True)
class CepResponse:
    success: bool
    data: AddressData | None = None
    error: str | None = None


def format_cep_display(cep: str) -> str:
    """Formata CEP como XXXXX-XXX; se incompleto, só dígitos."""
    clean = _NON_DIGIT.sub("", cep)
    if len(clean) == 8:
        return f"{clean[:5]}-{clean[5:]}"
    return clean


def _http_get_json(url: str, *, timeout: float) -> tuple[int, dict[str, Any]]:
    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "agenda-django/1.0"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
        payload = json.loads(response.read().decode("utf-8"))
        return int(response.status), payload


def _search_viacep(clean_cep: str, *, timeout: float) -> CepResponse:
    if len(clean_cep) != 8:
        return CepResponse(success=False, error="CEP deve conter 8 dígitos.")
    try:
        status, data = _http_get_json(
            f"https://viacep.com.br/ws/{clean_cep}/json/",
            timeout=timeout,
        )
        if status != 200:
            return CepResponse(success=False, error=f"Erro na API ViaCEP: {status}")
        if data.get("erro"):
            return CepResponse(success=False, error="CEP não encontrado na base ViaCEP.")
        address = AddressData(
            cep=str(data.get("cep", "")),
            logradouro=str(data.get("logradouro", "")),
            complemento=str(data.get("complemento", "")),
            bairro=str(data.get("bairro", "")),
            localidade=str(data.get("localidade", "")),
            uf=str(data.get("uf", "")),
            ibge=data.get("ibge"),
            gia=data.get("gia"),
            ddd=data.get("ddd"),
            siafi=data.get("siafi"),
        )
        if address.uf and not is_valid_uf(address.uf):
            return CepResponse(success=False, error="UF inválida retornada pelo ViaCEP.")
        return CepResponse(success=True, data=address)
    except TimeoutError:
        return CepResponse(success=False, error="Timeout ao consultar ViaCEP.")
    except urllib.error.URLError as exc:
        return CepResponse(success=False, error=f"Erro ao consultar ViaCEP: {exc.reason}")
    except Exception as exc:  # noqa: BLE001 — espelha contrato do legado
        return CepResponse(success=False, error=f"Erro ao consultar ViaCEP: {exc}")


def _search_brasilapi(clean_cep: str, *, timeout: float) -> CepResponse:
    if len(clean_cep) != 8:
        return CepResponse(success=False, error="CEP deve conter 8 dígitos.")
    try:
        status, data = _http_get_json(
            f"https://brasilapi.com.br/api/cep/v1/{clean_cep}",
            timeout=timeout,
        )
        if status == 404:
            return CepResponse(success=False, error="CEP não encontrado na base BrasilAPI.")
        if status != 200:
            return CepResponse(success=False, error=f"Erro na API BrasilAPI: {status}")
        address = AddressData(
            cep=str(data.get("cep", "")),
            logradouro=str(data.get("street", "")),
            complemento=str(data.get("complement") or ""),
            bairro=str(data.get("neighborhood", "")),
            localidade=str(data.get("city", "")),
            uf=str(data.get("state", "")),
            ibge=data.get("ibge"),
            gia=data.get("gia"),
            ddd=data.get("ddd"),
            siafi=data.get("siafi"),
        )
        if address.uf and not is_valid_uf(address.uf):
            return CepResponse(success=False, error="UF inválida retornada pela BrasilAPI.")
        return CepResponse(success=True, data=address)
    except TimeoutError:
        return CepResponse(success=False, error="Timeout ao consultar BrasilAPI.")
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return CepResponse(success=False, error="CEP não encontrado na base BrasilAPI.")
        return CepResponse(success=False, error=f"Erro na API BrasilAPI: {exc.code}")
    except urllib.error.URLError as exc:
        return CepResponse(success=False, error=f"Erro ao consultar BrasilAPI: {exc.reason}")
    except Exception as exc:  # noqa: BLE001
        return CepResponse(success=False, error=f"Erro ao consultar BrasilAPI: {exc}")


def search_cep(cep: str, *, timeout: float = DEFAULT_TIMEOUT_S) -> CepResponse:
    """ViaCEP primeiro; BrasilAPI como fallback."""
    clean = _NON_DIGIT.sub("", cep).strip()
    if not clean or len(clean) != 8:
        return CepResponse(success=False, error="CEP deve conter exatamente 8 dígitos.")

    via = _search_viacep(clean, timeout=timeout)
    if via.success:
        return via

    logger.warning("ViaCEP falhou, tentando BrasilAPI: %s", via.error)
    brasil = _search_brasilapi(clean, timeout=timeout)
    if brasil.success:
        return brasil

    return CepResponse(
        success=False,
        error=(
            "CEP não encontrado em nenhuma base de dados. "
            f"ViaCEP: {via.error}, BrasilAPI: {brasil.error}"
        ),
    )
