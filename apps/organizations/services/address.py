"""Endereço do tenant."""

from __future__ import annotations

from dataclasses import dataclass

from apps.accounts.models import User
from apps.core.br_geo import is_valid_uf
from apps.organizations.models import Address
from apps.organizations.services.cep import format_cep_display


@dataclass(frozen=True, slots=True)
class AddressResult:
    ok: bool
    message: str
    address: Address | None = None


def get_or_create_address(user: User) -> Address:
    address, _ = Address.objects.get_or_create(user=user)
    return address


def update_address(
    *,
    user: User,
    street: str,
    number: str,
    complement: str = "",
    neighborhood: str,
    city: str,
    state: str,
    zip_code: str,
    country: str = "Brasil",
) -> AddressResult:
    uf = (state or "").strip().upper()
    if not is_valid_uf(uf):
        return AddressResult(ok=False, message="UF inválida.")
    cep_digits = "".join(ch for ch in zip_code if ch.isdigit())
    if len(cep_digits) != 8:
        return AddressResult(ok=False, message="CEP deve conter 8 dígitos.")
    required = {
        "street": street.strip(),
        "number": number.strip(),
        "neighborhood": neighborhood.strip(),
        "city": city.strip(),
    }
    for key, value in required.items():
        if not value:
            labels = {
                "street": "rua",
                "number": "número",
                "neighborhood": "bairro",
                "city": "cidade",
            }
            return AddressResult(ok=False, message=f"Informe {labels[key]}.")

    address = get_or_create_address(user)
    address.street = required["street"]
    address.number = required["number"]
    address.complement = complement.strip()
    address.neighborhood = required["neighborhood"]
    address.city = required["city"]
    address.state = uf
    address.zip_code = format_cep_display(cep_digits)
    address.country = country.strip() or "Brasil"
    address.save()
    return AddressResult(ok=True, message="Endereço salvo.", address=address)
