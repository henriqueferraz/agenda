"""Forms de serviços e funcionários."""

from __future__ import annotations

from django import forms

from apps.organizations.constants import WEEKDAY_TIME_FIELDS


class ServiceForm(forms.Form):
    name = forms.CharField(max_length=255, label="Nome")
    price_reais = forms.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        label="Preço (R$)",
    )
    duration = forms.IntegerField(min_value=1, label="Duração (minutos)")
    status = forms.BooleanField(required=False, initial=True, label="Ativo")

    def cleaned_price_cents(self) -> int:
        value = self.cleaned_data["price_reais"]
        return int(round(value * 100))


class EmployeeForm(forms.Form):
    name = forms.CharField(max_length=255, label="Nome")
    email = forms.EmailField(label="E-mail")
    phone = forms.CharField(max_length=32, required=False, label="Telefone")
    function = forms.CharField(max_length=120, required=False, label="Função")
    status = forms.BooleanField(required=False, initial=True, label="Ativo")
    services = forms.MultipleChoiceField(
        required=False,
        label="Serviços",
        widget=forms.CheckboxSelectMultiple,
    )

    def __init__(self, *args, service_choices=None, **kwargs):
        super().__init__(*args, **kwargs)
        services_field = self.fields["services"]
        assert isinstance(services_field, forms.MultipleChoiceField)
        services_field.choices = service_choices or []


class EmployeeHoursForm(forms.Form):
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
