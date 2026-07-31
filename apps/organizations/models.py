"""Perfil da organização, atividade, endereço e horários."""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class PersonType(models.TextChoices):
    PF = "PF", "Pessoa Física"
    PJ = "PJ", "Pessoa Jurídica"


class Activity(models.Model):
    """Categoria de atividade configurável (seed + gestão master)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "activities"

    def __str__(self) -> str:
        return self.name


class OrganizationProfile(models.Model):
    """Dados de negócio do tenant (1:1 com User)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization",
    )
    person_type = models.CharField(max_length=2, choices=PersonType.choices, blank=True)
    cpf = models.CharField(max_length=14, blank=True, null=True, unique=True)
    cnpj = models.CharField(max_length=18, blank=True, default="")
    trade_name = models.CharField(max_length=255, blank=True, default="")
    logo = models.CharField(max_length=512, blank=True, default="")
    activity = models.ForeignKey(
        Activity,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organizations",
    )
    mon_times = models.JSONField(default=list, blank=True)
    tue_times = models.JSONField(default=list, blank=True)
    wed_times = models.JSONField(default=list, blank=True)
    thu_times = models.JSONField(default=list, blank=True)
    fri_times = models.JSONField(default=list, blank=True)
    sat_times = models.JSONField(default=list, blank=True)
    sun_times = models.JSONField(default=list, blank=True)
    be_called = models.SlugField(max_length=64, unique=True, null=True, blank=True)
    token_called = models.CharField(max_length=64, unique=True, null=True, blank=True)
    booking_public_code = models.CharField(max_length=32, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__email"]

    def __str__(self) -> str:
        return f"Org({self.user_id})"

    def has_activity(self) -> bool:
        return self.activity_id is not None

    def has_model(self) -> bool:
        if self.person_type == PersonType.PF:
            return bool(self.cpf) and bool(self.trade_name)
        if self.person_type == PersonType.PJ:
            return bool(self.cnpj) and bool(self.trade_name)
        return False

    def has_hours(self) -> bool:
        days = (
            self.mon_times,
            self.tue_times,
            self.wed_times,
            self.thu_times,
            self.fri_times,
            self.sat_times,
            self.sun_times,
        )
        return any(bool(day) for day in days)


class Address(models.Model):
    """Endereço 1:1 do tenant."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="address",
    )
    street = models.CharField(max_length=255, blank=True, default="")
    number = models.CharField(max_length=32, blank=True, default="")
    complement = models.CharField(max_length=120, blank=True, default="")
    neighborhood = models.CharField(max_length=120, blank=True, default="")
    city = models.CharField(max_length=120, blank=True, default="")
    state = models.CharField(max_length=2, blank=True, default="")
    zip_code = models.CharField(max_length=16, blank=True, default="")
    country = models.CharField(max_length=64, blank=True, default="Brasil")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "addresses"

    def __str__(self) -> str:
        return f"Address({self.user_id})"

    def is_complete(self) -> bool:
        return bool(
            self.zip_code
            and self.street
            and self.number
            and self.neighborhood
            and self.city
            and self.state
        )
