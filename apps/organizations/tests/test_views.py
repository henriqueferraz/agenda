"""Testes de views HTMX / onboarding / ownership."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import Plan, User, UserRole
from apps.organizations.models import Activity, PersonType
from apps.organizations.services import activity as activity_services
from apps.organizations.services import address as address_services
from apps.organizations.services import hours as hours_services
from apps.organizations.services import profile as profile_services
from apps.organizations.services.cep import AddressData, CepResponse

VALID_CPF = "39053344705"
PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
    b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def enterprise_user(db) -> User:
    user = User.objects.create_user(
        email="ent@example.com",
        password="SenhaSegura123!",
        name="Ent",
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    return user


@pytest.fixture
def master_user(db) -> User:
    user = User.objects.create_user(
        email="master@example.com",
        password="SenhaSegura123!",
        role=UserRole.MASTER,
        plan=Plan.PROFESSIONAL,
        is_staff=True,
    )
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified_at"])
    return user


def _complete_onboarding(user: User) -> Activity:
    activity_services.seed_default_activities()
    activity = Activity.objects.get(slug="barbearia")
    activity_services.set_user_activity(user=user, activity_id=activity.pk)
    profile_services.update_person_model(
        user=user,
        person_type=PersonType.PF,
        trade_name="Shop",
        cpf=VALID_CPF,
    )
    address_services.update_address(
        user=user,
        street="Rua 1",
        number="1",
        neighborhood="Centro",
        city="São Paulo",
        state="SP",
        zip_code="01310100",
    )
    hours_services.update_business_hours(
        user=user,
        times_by_day={"mon_times": ["09:00"]},
    )
    return activity


@pytest.mark.django_db
def test_onboarding_gate_redirects_incomplete(client, enterprise_user: User) -> None:
    activity_services.seed_default_activities()
    client.force_login(enterprise_user)
    resp = client.get(reverse("dashboard:home"))
    assert resp.status_code == 302
    assert resp.url == reverse("organizations:activity")


@pytest.mark.django_db
def test_activity_post_advances(client, enterprise_user: User) -> None:
    activity_services.seed_default_activities()
    activity = Activity.objects.get(slug="barbearia")
    client.force_login(enterprise_user)
    resp = client.post(
        reverse("organizations:activity"),
        {"activity": str(activity.pk)},
    )
    assert resp.status_code == 302
    assert resp.url == reverse("organizations:model")


@pytest.mark.django_db
def test_cep_htmx_partial(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    fake = CepResponse(
        success=True,
        data=AddressData(
            cep="01310-100",
            logradouro="Av Paulista",
            complemento="",
            bairro="Bela Vista",
            localidade="São Paulo",
            uf="SP",
        ),
    )
    with patch(
        "apps.organizations.views.search_cep",
        return_value=fake,
    ):
        resp = client.get(
            reverse("organizations:cep_lookup"),
            {"zip_code": "01310100"},
            HTTP_HX_REQUEST="true",
        )
    assert resp.status_code == 200
    assert b"Av Paulista" in resp.content
    assert b"Bela Vista" in resp.content


@pytest.mark.django_db
def test_logo_upload_endpoint(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    from django.core.files.uploadedfile import SimpleUploadedFile

    upload = SimpleUploadedFile("logo.png", PNG_1X1, content_type="image/png")
    resp = client.post(
        reverse("organizations:logo_upload"),
        {"logo": upload},
        HTTP_HX_REQUEST="true",
    )
    assert resp.status_code == 200
    enterprise_user.organization.refresh_from_db()
    assert enterprise_user.organization.logo


@pytest.mark.django_db
def test_master_activities_page(client, master_user: User) -> None:
    activity_services.seed_default_activities()
    client.force_login(master_user)
    resp = client.get(reverse("organizations:master_activities"))
    assert resp.status_code == 200
    assert b"Barbearia" in resp.content

    create = client.post(
        reverse("organizations:master_activities"),
        {"name": "Tatuagem", "sort_order": 90},
    )
    assert create.status_code == 302
    assert Activity.objects.filter(name="Tatuagem").exists()


@pytest.mark.django_db
def test_enterprise_cannot_access_master_activities(client, enterprise_user: User) -> None:
    _complete_onboarding(enterprise_user)
    client.force_login(enterprise_user)
    resp = client.get(reverse("organizations:master_activities"))
    assert resp.status_code in {302, 403}
