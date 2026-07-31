"""Clientes do tenant."""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Client(models.Model):
    """Cliente do negócio — unicidade por (user, cpf) e (user, email)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="clients",
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True, default="")
    cpf = models.CharField(max_length=11, blank=True, null=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "email"],
                name="clients_client_user_email_uniq",
            ),
            models.UniqueConstraint(
                fields=["user", "cpf"],
                name="clients_client_user_cpf_uniq",
                condition=models.Q(cpf__isnull=False),
            ),
        ]
        indexes = [
            models.Index(fields=["user", "cpf"]),
            models.Index(fields=["user", "email"]),
        ]

    def __str__(self) -> str:
        return self.name
