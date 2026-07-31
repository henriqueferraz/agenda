"""Modelos de autenticação, trial e rate limit."""

from __future__ import annotations

import uuid
from datetime import timedelta
from typing import ClassVar

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    MASTER = "master", "Master"
    ENTERPRISE = "enterprise", "Enterprise"


class Plan(models.TextChoices):
    TRIAL = "TRIAL", "Trial"
    BASIC = "BASIC", "Basic"
    PROFESSIONAL = "PROFESSIONAL", "Professional"


class UserManager(BaseUserManager["User"]):
    def create_user(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: object,
    ) -> User:
        if not email:
            raise ValueError("E-mail é obrigatório")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: object,
    ) -> User:
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.MASTER)
        extra_fields.setdefault("plan", Plan.PROFESSIONAL)
        extra_fields.setdefault("email_verified_at", timezone.now())
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser precisa is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser precisa is_superuser=True")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.ENTERPRISE,
    )
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.TRIAL)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        ordering = ["email"]

    def __str__(self) -> str:
        return self.email

    @property
    def is_master(self) -> bool:
        return self.role == UserRole.MASTER

    @property
    def has_paid_plan(self) -> bool:
        return self.plan in {Plan.BASIC, Plan.PROFESSIONAL}

    def trial_is_expired(self, *, now=None) -> bool:
        if self.is_master or self.has_paid_plan:
            return False
        if self.trial_ends_at is None:
            return False
        current = now or timezone.now()
        return self.trial_ends_at <= current

    def ensure_trial_defaults(self) -> None:
        if self.role == UserRole.ENTERPRISE and self.trial_ends_at is None:
            self.trial_ends_at = timezone.now() + timedelta(days=30)
        if self.role == UserRole.ENTERPRISE and not self.plan:
            self.plan = Plan.TRIAL


class EmailOtp(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_otps")
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    last_sent_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class PasswordResetToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_resets")
    token_hash = models.CharField(max_length=128, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class LoginAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    successful = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]


class IpRateLimit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ip_address = models.GenericIPAddressField()
    scope = models.CharField(max_length=64, db_index=True)
    window_started_at = models.DateTimeField(default=timezone.now)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("ip_address", "scope")
        indexes = [models.Index(fields=["ip_address", "scope"])]
