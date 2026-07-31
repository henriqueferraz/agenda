"""Catálogo: serviços, funcionários e vínculo N:N."""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Service(models.Model):
    """Serviço do tenant. Preço em centavos; duração em minutos."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="services",
    )
    name = models.CharField(max_length=255)
    price = models.PositiveIntegerField(help_text="Preço em centavos")
    duration = models.PositiveIntegerField(help_text="Duração em minutos")
    status = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    @property
    def price_reais(self) -> str:
        reais = self.price // 100
        cents = self.price % 100
        return f"R$ {reais},{cents:02d}"


class Employee(models.Model):
    """Funcionário do tenant com horários por dia da semana."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employees",
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True, default="")
    function = models.CharField(max_length=120, blank=True, default="")
    status = models.BooleanField(default=True)
    mon_times = models.JSONField(default=list, blank=True)
    tue_times = models.JSONField(default=list, blank=True)
    wed_times = models.JSONField(default=list, blank=True)
    thu_times = models.JSONField(default=list, blank=True)
    fri_times = models.JSONField(default=list, blank=True)
    sat_times = models.JSONField(default=list, blank=True)
    sun_times = models.JSONField(default=list, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    services = models.ManyToManyField(  # type: ignore[var-annotated]
        Service,
        through="EmployeeService",
        related_name="employees",
        blank=True,
    )

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "email"],
                name="catalog_employee_user_email_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class EmployeeService(models.Model):
    """Vínculo N:N funcionário ↔ serviço (mesmo tenant)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="employee_services",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="employee_services",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "service"],
                name="catalog_employeeservice_emp_svc_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.employee_id}↔{self.service_id}"
