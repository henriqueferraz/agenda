from __future__ import annotations

from django.test import Client


def test_healthz_returns_ok() -> None:
    client = Client()
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
