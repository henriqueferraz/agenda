"""Geografia BR — UFs oficiais."""

from __future__ import annotations

BRAZIL_UFS: frozenset[str] = frozenset(
    {
        "AC",
        "AL",
        "AP",
        "AM",
        "BA",
        "CE",
        "DF",
        "ES",
        "GO",
        "MA",
        "MT",
        "MS",
        "MG",
        "PA",
        "PB",
        "PR",
        "PE",
        "PI",
        "RJ",
        "RN",
        "RS",
        "RO",
        "RR",
        "SC",
        "SP",
        "SE",
        "TO",
    }
)


def is_valid_uf(uf: str | None) -> bool:
    """Valida UF contra a lista oficial (case-insensitive)."""
    if not uf or not isinstance(uf, str):
        return False
    return uf.strip().upper() in BRAZIL_UFS
