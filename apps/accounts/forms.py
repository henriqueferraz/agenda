"""Forms de autenticação."""

from __future__ import annotations

from django import forms
from django.contrib.auth.password_validation import validate_password


class RegisterForm(forms.Form):
    name = forms.CharField(max_length=255, required=False, label="Nome")
    email = forms.EmailField(label="E-mail")
    password = forms.CharField(widget=forms.PasswordInput, label="Senha", min_length=12)

    def clean_password(self) -> str:
        password = self.cleaned_data["password"]
        validate_password(password)
        return password


class LoginForm(forms.Form):
    email = forms.EmailField(label="E-mail")
    password = forms.CharField(widget=forms.PasswordInput, label="Senha")


class OtpVerifyForm(forms.Form):
    email = forms.EmailField(label="E-mail")
    code = forms.CharField(max_length=6, min_length=6, label="Código")


class ResendOtpForm(forms.Form):
    email = forms.EmailField(label="E-mail")


class ForgotPasswordForm(forms.Form):
    email = forms.EmailField(label="E-mail")


class ResetPasswordForm(forms.Form):
    token = forms.CharField(widget=forms.HiddenInput)
    password = forms.CharField(widget=forms.PasswordInput, label="Nova senha", min_length=12)

    def clean_password(self) -> str:
        password = self.cleaned_data["password"]
        validate_password(password)
        return password


class ChangePasswordForm(forms.Form):
    current_password = forms.CharField(widget=forms.PasswordInput, label="Senha atual")
    new_password = forms.CharField(widget=forms.PasswordInput, label="Nova senha", min_length=12)

    def clean_new_password(self) -> str:
        password = self.cleaned_data["new_password"]
        validate_password(password)
        return password
