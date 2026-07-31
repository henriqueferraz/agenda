"""Views HTMX de clientes."""

from __future__ import annotations

from uuid import UUID

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods, require_POST

from apps.accounts.models import User
from apps.clients import selectors
from apps.clients.forms import ClientForm
from apps.clients.services import clients as client_services
from apps.core.br_docs import normalize_cpf


def _user(request: HttpRequest) -> User:
    user = request.user
    assert isinstance(user, User)
    return user


def _is_htmx(request: HttpRequest) -> bool:
    return request.headers.get("HX-Request", "").lower() == "true"


@login_required
@require_http_methods(["GET", "POST"])
def clients_list_view(request: HttpRequest) -> HttpResponse:
    user = _user(request)
    if request.method == "POST":
        form = ClientForm(request.POST)
        if form.is_valid():
            result = client_services.create_client(
                user=user,
                name=form.cleaned_data["name"],
                email=form.cleaned_data["email"],
                phone=form.cleaned_data.get("phone") or "",
                cpf=form.cleaned_data.get("cpf") or "",
                notes=form.cleaned_data.get("notes") or "",
            )
            if result.ok:
                messages.success(request, result.message)
                return redirect("clients:list")
            messages.error(request, result.message)
            status = 422 if _is_htmx(request) else 200
            return render(
                request,
                "clients/list.html",
                {
                    "form": form,
                    "clients": selectors.list_clients(user.pk),
                    "editing": None,
                },
                status=status,
            )
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "clients/list.html",
            {
                "form": form,
                "clients": selectors.list_clients(user.pk),
                "editing": None,
            },
            status=status,
        )

    form = ClientForm()
    return render(
        request,
        "clients/list.html",
        {
            "form": form,
            "clients": selectors.list_clients(user.pk),
            "editing": None,
        },
    )


@login_required
@require_http_methods(["GET", "POST"])
def client_edit_view(request: HttpRequest, client_id: UUID) -> HttpResponse:
    user = _user(request)
    client = selectors.get_client(user.pk, client_id)
    if client is None:
        messages.error(request, "Cliente não encontrado.")
        return redirect("clients:list")

    initial = {
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "cpf": normalize_cpf(client.cpf) if client.cpf else "",
        "notes": client.notes,
    }
    form = ClientForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        result = client_services.update_client(
            user=user,
            client_id=client.pk,
            name=form.cleaned_data["name"],
            email=form.cleaned_data["email"],
            phone=form.cleaned_data.get("phone") or "",
            cpf=form.cleaned_data.get("cpf") or "",
            notes=form.cleaned_data.get("notes") or "",
        )
        if result.ok:
            messages.success(request, result.message)
            return redirect("clients:list")
        messages.error(request, result.message)
        status = 422 if _is_htmx(request) else 200
        return render(
            request,
            "clients/list.html",
            {
                "form": form,
                "clients": selectors.list_clients(user.pk),
                "editing": client,
            },
            status=status,
        )

    return render(
        request,
        "clients/list.html",
        {
            "form": form,
            "clients": selectors.list_clients(user.pk),
            "editing": client,
        },
    )


@login_required
@require_POST
def client_delete_view(request: HttpRequest, client_id: UUID) -> HttpResponse:
    user = _user(request)
    result = client_services.delete_client(user=user, client_id=client_id)
    if result.ok:
        messages.success(request, result.message)
    else:
        messages.error(request, result.message)
    if _is_htmx(request):
        return render(
            request,
            "partials/_clients_list.html",
            {"clients": selectors.list_clients(user.pk)},
            status=200 if result.ok else 422,
        )
    return redirect("clients:list")
