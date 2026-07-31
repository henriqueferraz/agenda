"""Testes de services: perfil, horas, ownership, docs BR."""

from __future__ import annotations

import pytest

from apps.accounts.models import User
from apps.core.security import assert_same_owner, is_same_owner
from apps.organizations.models import Activity, Address, OrganizationProfile, PersonType
from apps.organizations.services import activity as activity_services
from apps.organizations.services import address as address_services
from apps.organizations.services import hours as hours_services
from apps.organizations.services import logo as logo_services
from apps.organizations.services import onboarding as onboarding_services
from apps.organizations.services import profile as profile_services
from apps.organizations.services.hours import clean_times

# CPF/CNPJ válidos conhecidos
VALID_CPF = "39053344705"
VALID_CNPJ = "11222333000181"
PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
    b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        email="org@example.com",
        password="SenhaSegura123!",
        name="Org",
    )


@pytest.fixture
def other_user(db) -> User:
    return User.objects.create_user(
        email="other@example.com",
        password="SenhaSegura123!",
    )


@pytest.fixture
def activity(db) -> Activity:
    activity_services.seed_default_activities()
    return Activity.objects.get(slug="barbearia")


@pytest.mark.django_db
def test_seed_activities_idempotent() -> None:
    # Migração 0002 já aplica o seed; a função deve ser no-op na 2ª chamada.
    n1 = activity_services.seed_default_activities()
    n2 = activity_services.seed_default_activities()
    assert n1 == 0
    assert n2 == 0
    assert Activity.objects.filter(is_active=True).count() >= 8


@pytest.mark.django_db
def test_set_activity_and_onboarding_steps(user: User, activity: Activity) -> None:
    status0 = onboarding_services.get_onboarding_status(user)
    assert status0.step == onboarding_services.OnboardingStep.ACTIVITY

    result = activity_services.set_user_activity(user=user, activity_id=activity.pk)
    assert result.ok
    status1 = onboarding_services.get_onboarding_status(user)
    assert status1.step == onboarding_services.OnboardingStep.MODEL


@pytest.mark.django_db
def test_update_person_model_pf_validates_cpf(user: User, activity: Activity) -> None:
    activity_services.set_user_activity(user=user, activity_id=activity.pk)
    bad = profile_services.update_person_model(
        user=user,
        person_type=PersonType.PF,
        trade_name="Barbearia X",
        cpf="11111111111",
    )
    assert not bad.ok

    ok = profile_services.update_person_model(
        user=user,
        person_type=PersonType.PF,
        trade_name="Barbearia X",
        cpf=VALID_CPF,
    )
    assert ok.ok
    profile = OrganizationProfile.objects.get(user=user)
    assert profile.cpf == VALID_CPF
    assert profile.person_type == PersonType.PF


@pytest.mark.django_db
def test_update_person_model_pj_validates_cnpj(user: User) -> None:
    bad = profile_services.update_person_model(
        user=user,
        person_type=PersonType.PJ,
        trade_name="Empresa X",
        cnpj="00000000000000",
    )
    assert not bad.ok

    ok = profile_services.update_person_model(
        user=user,
        person_type=PersonType.PJ,
        trade_name="Empresa X",
        cnpj=VALID_CNPJ,
    )
    assert ok.ok
    assert OrganizationProfile.objects.get(user=user).cnpj == VALID_CNPJ


@pytest.mark.django_db
def test_cpf_unique_across_profiles(user: User, other_user: User) -> None:
    profile_services.update_person_model(
        user=user,
        person_type=PersonType.PF,
        trade_name="A",
        cpf=VALID_CPF,
    )
    dup = profile_services.update_person_model(
        user=other_user,
        person_type=PersonType.PF,
        trade_name="B",
        cpf=VALID_CPF,
    )
    assert not dup.ok


@pytest.mark.django_db
def test_address_update_and_ownership(user: User, other_user: User) -> None:
    result = address_services.update_address(
        user=user,
        street="Rua A",
        number="10",
        neighborhood="Centro",
        city="São Paulo",
        state="SP",
        zip_code="01310-100",
    )
    assert result.ok
    address = Address.objects.get(user=user)
    assert address.is_complete()
    assert is_same_owner(user.pk, address)
    assert not is_same_owner(other_user.pk, address)
    with pytest.raises(PermissionError):
        assert_same_owner(other_user.pk, address)


@pytest.mark.django_db
def test_clean_times_sort_unique_and_reject_invalid() -> None:
    assert clean_times(["10:00", "08:00", "10:00"]) == ["08:00", "10:00"]
    with pytest.raises(ValueError):
        clean_times(["25:99"])


@pytest.mark.django_db
def test_update_business_hours(user: User) -> None:
    result = hours_services.update_business_hours(
        user=user,
        times_by_day={"mon_times": ["09:00", "08:00"], "tue_times": []},
    )
    assert result.ok
    profile = OrganizationProfile.objects.get(user=user)
    assert profile.mon_times == ["08:00", "09:00"]
    assert profile.has_hours()


@pytest.mark.django_db
def test_logo_upload_validates_magic_and_size(user: User, settings) -> None:
    settings.SUPABASE_URL = ""
    settings.SUPABASE_SERVICE_ROLE_KEY = ""
    bad = logo_services.upload_logo(user=user, content=b"not-an-image")
    assert not bad.ok

    huge = b"\xff\xd8\xff" + b"0" * 1_000_001
    too_big = logo_services.upload_logo(user=user, content=huge)
    assert not too_big.ok

    ok = logo_services.upload_logo(user=user, content=PNG_1X1, filename="logo.png")
    assert ok.ok
    assert OrganizationProfile.objects.get(user=user).logo


@pytest.mark.django_db
def test_master_activity_crud() -> None:
    created = activity_services.create_activity(name="Nova Cat", sort_order=99)
    assert created.ok and created.activity is not None
    toggled = activity_services.update_activity(
        activity_id=created.activity.pk,
        is_active=False,
    )
    assert toggled.ok
    assert toggled.activity is not None
    assert not toggled.activity.is_active


@pytest.mark.django_db
def test_onboarding_complete_flow(user: User, activity: Activity) -> None:
    activity_services.set_user_activity(user=user, activity_id=activity.pk)
    profile_services.update_person_model(
        user=user,
        person_type=PersonType.PF,
        trade_name="Barbearia Flow",
        cpf=VALID_CPF,
    )
    address_services.update_address(
        user=user,
        street="Rua B",
        number="20",
        neighborhood="Centro",
        city="Curitiba",
        state="PR",
        zip_code="80010000",
    )
    hours_services.update_business_hours(
        user=user,
        times_by_day={"wed_times": ["14:00"]},
    )
    status = onboarding_services.get_onboarding_status(user)
    assert status.is_complete
    assert onboarding_services.next_onboarding_url(user) is None
