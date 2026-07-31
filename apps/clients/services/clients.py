"""CRUD e find-or-create de clientes."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from django.db import IntegrityError, transaction

from apps.accounts.models import User
from apps.clients.models import Client
from apps.clients.selectors import find_by_cpf, find_by_email, get_client
from apps.core.br_docs import is_cpf_valid, unformat_cpf
from apps.core.br_phone import is_valid_phone, unformat_phone
from apps.core.security import assert_same_owner


@dataclass(frozen=True, slots=True)
class ClientResult:
    ok: bool
    message: str
    client: Client | None = None
    created: bool = False


def _normalize_cpf(cpf: str) -> str | None:
    raw = (cpf or "").strip()
    if not raw:
        return None
    if not is_cpf_valid(raw):
        raise ValueError("CPF inválido.")
    return unformat_cpf(raw)


def create_client(
    *,
    user: User,
    name: str,
    email: str,
    phone: str = "",
    cpf: str = "",
    notes: str = "",
) -> ClientResult:
    clean_name = (name or "").strip()
    clean_email = (email or "").strip().lower()
    if not clean_name:
        return ClientResult(ok=False, message="Informe o nome do cliente.")
    if not clean_email:
        return ClientResult(ok=False, message="Informe o e-mail do cliente.")

    phone_clean = unformat_phone(phone) if phone else ""
    if phone and not is_valid_phone(phone):
        return ClientResult(ok=False, message="Telefone inválido.")

    try:
        clean_cpf = _normalize_cpf(cpf)
    except ValueError as exc:
        return ClientResult(ok=False, message=str(exc))

    try:
        with transaction.atomic():
            client = Client.objects.create(
                user=user,
                name=clean_name,
                email=clean_email,
                phone=phone_clean,
                cpf=clean_cpf,
                notes=(notes or "").strip(),
            )
    except IntegrityError:
        return ClientResult(
            ok=False,
            message="Já existe um cliente com este e-mail ou CPF neste estabelecimento.",
        )
    return ClientResult(ok=True, message="Cliente criado.", client=client, created=True)


def update_client(
    *,
    user: User,
    client_id: UUID,
    name: str,
    email: str,
    phone: str = "",
    cpf: str = "",
    notes: str = "",
) -> ClientResult:
    client = get_client(user.pk, client_id)
    if client is None:
        return ClientResult(ok=False, message="Cliente não encontrado.")
    assert_same_owner(user.pk, client)

    clean_name = (name or "").strip()
    clean_email = (email or "").strip().lower()
    if not clean_name:
        return ClientResult(ok=False, message="Informe o nome do cliente.")
    if not clean_email:
        return ClientResult(ok=False, message="Informe o e-mail do cliente.")

    phone_clean = unformat_phone(phone) if phone else ""
    if phone and not is_valid_phone(phone):
        return ClientResult(ok=False, message="Telefone inválido.")

    try:
        clean_cpf = _normalize_cpf(cpf)
    except ValueError as exc:
        return ClientResult(ok=False, message=str(exc))

    try:
        with transaction.atomic():
            client.name = clean_name
            client.email = clean_email
            client.phone = phone_clean
            client.cpf = clean_cpf
            client.notes = (notes or "").strip()
            client.save(update_fields=["name", "email", "phone", "cpf", "notes", "updated_at"])
    except IntegrityError:
        return ClientResult(
            ok=False,
            message="Já existe um cliente com este e-mail ou CPF neste estabelecimento.",
        )
    return ClientResult(ok=True, message="Cliente atualizado.", client=client)


def delete_client(*, user: User, client_id: UUID) -> ClientResult:
    client = get_client(user.pk, client_id)
    if client is None:
        return ClientResult(ok=False, message="Cliente não encontrado.")
    assert_same_owner(user.pk, client)
    client.delete()
    return ClientResult(ok=True, message="Cliente excluído.")


def find_or_create_client(
    *,
    user: User,
    name: str,
    email: str,
    phone: str = "",
    cpf: str = "",
    notes: str = "",
) -> ClientResult:
    """Localiza por e-mail ou CPF do tenant; cria se não existir."""
    clean_email = (email or "").strip().lower()
    try:
        clean_cpf = _normalize_cpf(cpf)
    except ValueError as exc:
        return ClientResult(ok=False, message=str(exc))

    existing = None
    if clean_email:
        existing = find_by_email(user.pk, clean_email)
    if existing is None and clean_cpf:
        existing = find_by_cpf(user.pk, clean_cpf)
    if existing is not None:
        assert_same_owner(user.pk, existing)
        return ClientResult(
            ok=True,
            message="Cliente encontrado.",
            client=existing,
            created=False,
        )

    return create_client(
        user=user,
        name=name,
        email=email,
        phone=phone,
        cpf=cpf,
        notes=notes,
    )
