"""Forms de clientes."""

from __future__ import annotations

from django import forms

from apps.core.br_docs import is_cpf_valid


class ClientForm(forms.Form):
    name = forms.CharField(max_length=255, label="Nome")
    email = forms.EmailField(label="E-mail")
    phone = forms.CharField(max_length=32, required=False, label="Telefone")
    cpf = forms.CharField(max_length=14, required=False, label="CPF")
    notes = forms.CharField(required=False, label="Observações", widget=forms.Textarea)

    def clean_cpf(self):
        cpf = (self.cleaned_data.get("cpf") or "").strip()
        if cpf and not is_cpf_valid(cpf):
            raise forms.ValidationError("CPF inválido.")
        return cpf
