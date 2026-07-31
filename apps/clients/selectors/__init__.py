"""Queries de leitura de clientes."""

from __future__ import annotations

from uuid import UUID

from apps.clients.models import Client


def list_clients(user_id) -> list[Client]:
    return list(Client.objects.filter(user_id=user_id).order_by("name"))


def get_client(user_id, client_id: UUID) -> Client | None:
    return Client.objects.filter(user_id=user_id, pk=client_id).first()


def find_by_email(user_id, email: str) -> Client | None:
    return Client.objects.filter(user_id=user_id, email__iexact=email.strip()).first()


def find_by_cpf(user_id, cpf: str) -> Client | None:
    return Client.objects.filter(user_id=user_id, cpf=cpf).first()
