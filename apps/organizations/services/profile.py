"""Perfil PF/PJ + nome fantasia."""

from __future__ import annotations

from dataclasses import dataclass

from django.db import IntegrityError, transaction

from apps.accounts.models import User
from apps.core.br_docs import (
    is_cnpj_valid,
    is_cpf_valid,
    normalize_cnpj,
    normalize_cpf,
    unformat_cnpj,
    unformat_cpf,
)
from apps.organizations.models import OrganizationProfile, PersonType
from apps.organizations.services.profile_tokens import ensure_booking_tokens


@dataclass(frozen=True, slots=True)
class ProfileResult:
    ok: bool
    message: str
    profile: OrganizationProfile | None = None


def get_or_create_profile(user: User) -> OrganizationProfile:
    profile, created = OrganizationProfile.objects.get_or_create(user=user)
    if created or not profile.token_called:
        ensure_booking_tokens(profile)
    return profile


def update_person_model(
    *,
    user: User,
    person_type: str,
    trade_name: str,
    cpf: str = "",
    cnpj: str = "",
) -> ProfileResult:
    trade = trade_name.strip()
    if not trade:
        return ProfileResult(ok=False, message="Informe o nome fantasia.")
    if person_type not in {PersonType.PF, PersonType.PJ}:
        return ProfileResult(ok=False, message="Selecione Pessoa Física ou Jurídica.")

    profile = get_or_create_profile(user)

    if person_type == PersonType.PF:
        if not is_cpf_valid(cpf):
            return ProfileResult(ok=False, message="CPF inválido.")
        clean_cpf = unformat_cpf(cpf)
        try:
            with transaction.atomic():
                profile.person_type = PersonType.PF
                profile.cpf = clean_cpf
                profile.cnpj = ""
                profile.trade_name = trade
                profile.save(
                    update_fields=["person_type", "cpf", "cnpj", "trade_name", "updated_at"]
                )
        except IntegrityError:
            return ProfileResult(ok=False, message="Este CPF já está em uso.")
        return ProfileResult(
            ok=True,
            message="Modelo atualizado.",
            profile=profile,
        )

    if not is_cnpj_valid(cnpj):
        return ProfileResult(ok=False, message="CNPJ inválido.")
    clean_cnpj = unformat_cnpj(cnpj)
    profile.person_type = PersonType.PJ
    profile.cnpj = clean_cnpj
    profile.cpf = None
    profile.trade_name = trade
    profile.save(update_fields=["person_type", "cpf", "cnpj", "trade_name", "updated_at"])
    return ProfileResult(ok=True, message="Modelo atualizado.", profile=profile)


def display_cpf(profile: OrganizationProfile) -> str:
    return normalize_cpf(profile.cpf or "") if profile.cpf else ""


def display_cnpj(profile: OrganizationProfile) -> str:
    return normalize_cnpj(profile.cnpj) if profile.cnpj else ""
