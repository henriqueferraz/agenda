"""Testes unitários dos services de clientes."""

from __future__ import annotations

import pytest

from apps.accounts.models import User
from apps.clients.models import Client
from apps.clients.services import clients as client_services
from apps.core.security import assert_same_owner, is_same_owner

VALID_CPF = "39053344705"
OTHER_CPF = "52998224725"


@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        email="clients@example.com",
        password="SenhaSegura123!",
    )


@pytest.fixture
def other_user(db) -> User:
    return User.objects.create_user(
        email="other-clients@example.com",
        password="SenhaSegura123!",
    )


@pytest.mark.django_db
def test_create_client_validates_cpf(user: User) -> None:
    bad = client_services.create_client(
        user=user,
        name="João",
        email="joao@example.com",
        cpf="11111111111",
    )
    assert not bad.ok

    ok = client_services.create_client(
        user=user,
        name="João",
        email="joao@example.com",
        phone="11987654321",
        cpf=VALID_CPF,
    )
    assert ok.ok and ok.client is not None
    assert ok.client.cpf == VALID_CPF
    assert is_same_owner(user.pk, ok.client)


@pytest.mark.django_db
def test_unique_email_and_cpf_per_tenant(user: User, other_user: User) -> None:
    first = client_services.create_client(
        user=user,
        name="A",
        email="a@example.com",
        cpf=VALID_CPF,
    )
    assert first.ok

    dup_email = client_services.create_client(
        user=user,
        name="B",
        email="a@example.com",
        cpf=OTHER_CPF,
    )
    assert not dup_email.ok

    dup_cpf = client_services.create_client(
        user=user,
        name="C",
        email="c@example.com",
        cpf=VALID_CPF,
    )
    assert not dup_cpf.ok

    other = client_services.create_client(
        user=other_user,
        name="D",
        email="a@example.com",
        cpf=VALID_CPF,
    )
    assert other.ok


@pytest.mark.django_db
def test_find_or_create_by_email_and_cpf(user: User) -> None:
    created = client_services.find_or_create_client(
        user=user,
        name="Maria",
        email="maria@example.com",
        cpf=VALID_CPF,
    )
    assert created.ok and created.created

    by_email = client_services.find_or_create_client(
        user=user,
        name="Maria Nova",
        email="maria@example.com",
        cpf="",
    )
    assert by_email.ok and not by_email.created
    assert by_email.client is not None
    assert created.client is not None
    assert by_email.client.pk == created.client.pk

    by_cpf = client_services.find_or_create_client(
        user=user,
        name="Outro",
        email="outro@example.com",
        cpf=VALID_CPF,
    )
    assert by_cpf.ok and not by_cpf.created
    assert by_cpf.client is not None
    assert by_cpf.client.pk == created.client.pk


@pytest.mark.django_db
def test_update_and_delete_ownership(user: User, other_user: User) -> None:
    created = client_services.create_client(
        user=user,
        name="Pedro",
        email="pedro@example.com",
        cpf=VALID_CPF,
    )
    assert created.client is not None
    with pytest.raises(PermissionError):
        assert_same_owner(other_user.pk, created.client)

    foreign = client_services.update_client(
        user=other_user,
        client_id=created.client.pk,
        name="Hack",
        email="hack@example.com",
    )
    assert not foreign.ok

    deleted = client_services.delete_client(user=user, client_id=created.client.pk)
    assert deleted.ok
    assert not Client.objects.filter(pk=created.client.pk).exists()
