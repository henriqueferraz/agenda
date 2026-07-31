"""Forms de configuração da organização."""

from __future__ import annotations

from django import forms

from apps.core.br_docs import is_cnpj_valid, is_cpf_valid
from apps.organizations.constants import WEEKDAY_TIME_FIELDS
from apps.organizations.models import PersonType
from apps.organizations.selectors import active_activities


class ActivityChoiceForm(forms.Form):
    activity = forms.UUIDField(label="Atividade")

    def clean_activity(self):
        value = self.cleaned_data["activity"]
        allowed = {str(a.pk) for a in active_activities()}
        if str(value) not in allowed:
            raise forms.ValidationError("Atividade inválida ou inativa.")
        return value


class PersonModelForm(forms.Form):
    person_type = forms.ChoiceField(
        choices=PersonType.choices,
        label="Tipo",
        widget=forms.RadioSelect,
    )
    trade_name = forms.CharField(max_length=255, label="Nome fantasia")
    cpf = forms.CharField(max_length=14, required=False, label="CPF")
    cnpj = forms.CharField(max_length=18, required=False, label="CNPJ")

    def clean(self):
        cleaned = super().clean() or {}
        person_type = cleaned.get("person_type")
        if person_type == PersonType.PF:
            cpf = cleaned.get("cpf") or ""
            if not is_cpf_valid(cpf):
                self.add_error("cpf", "CPF inválido.")
        elif person_type == PersonType.PJ:
            cnpj = cleaned.get("cnpj") or ""
            if not is_cnpj_valid(cnpj):
                self.add_error("cnpj", "CNPJ inválido.")
        return cleaned


class AddressForm(forms.Form):
    zip_code = forms.CharField(max_length=16, label="CEP")
    street = forms.CharField(max_length=255, label="Rua")
    number = forms.CharField(max_length=32, label="Número")
    complement = forms.CharField(max_length=120, required=False, label="Complemento")
    neighborhood = forms.CharField(max_length=120, label="Bairro")
    city = forms.CharField(max_length=120, label="Cidade")
    state = forms.CharField(max_length=2, label="UF")
    country = forms.CharField(max_length=64, required=False, initial="Brasil", label="País")


class BusinessHoursForm(forms.Form):
    mon_times = forms.CharField(required=False, label="Segunda", widget=forms.Textarea)
    tue_times = forms.CharField(required=False, label="Terça", widget=forms.Textarea)
    wed_times = forms.CharField(required=False, label="Quarta", widget=forms.Textarea)
    thu_times = forms.CharField(required=False, label="Quinta", widget=forms.Textarea)
    fri_times = forms.CharField(required=False, label="Sexta", widget=forms.Textarea)
    sat_times = forms.CharField(required=False, label="Sábado", widget=forms.Textarea)
    sun_times = forms.CharField(required=False, label="Domingo", widget=forms.Textarea)

    def cleaned_times_by_day(self) -> dict[str, list[str]]:
        result: dict[str, list[str]] = {}
        for field in WEEKDAY_TIME_FIELDS:
            raw = self.cleaned_data.get(field) or ""
            slots = [part.strip() for part in raw.replace(",", "\n").splitlines() if part.strip()]
            result[field] = slots
        return result


class MasterActivityForm(forms.Form):
    name = forms.CharField(max_length=120, label="Nome")
    sort_order = forms.IntegerField(required=False, initial=0, label="Ordem")
    is_active = forms.BooleanField(required=False, initial=True, label="Ativa")


class LogoUploadForm(forms.Form):
    logo = forms.FileField(label="Logo")
