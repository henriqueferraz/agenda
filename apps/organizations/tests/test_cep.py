from __future__ import annotations

from unittest.mock import MagicMock, patch

from apps.organizations.services.cep import format_cep_display, search_cep


def test_format_cep_display() -> None:
    assert format_cep_display("01310100") == "01310-100"
    assert format_cep_display("01310-100") == "01310-100"
    assert format_cep_display("01310") == "01310"


def test_search_cep_rejects_invalid_length() -> None:
    result = search_cep("123")
    assert not result.success
    assert result.error is not None
    assert "8 dígitos" in result.error


@patch("apps.organizations.services.cep._http_get_json")
def test_search_cep_viacep_success(mock_get: MagicMock) -> None:
    mock_get.return_value = (
        200,
        {
            "cep": "01310-100",
            "logradouro": "Avenida Paulista",
            "complemento": "",
            "bairro": "Bela Vista",
            "localidade": "São Paulo",
            "uf": "SP",
            "ibge": "3550308",
        },
    )
    result = search_cep("01310-100")
    assert result.success
    assert result.data is not None
    assert result.data.localidade == "São Paulo"
    assert result.data.uf == "SP"
    mock_get.assert_called_once()


@patch("apps.organizations.services.cep._http_get_json")
def test_search_cep_fallback_brasilapi(mock_get: MagicMock) -> None:
    mock_get.side_effect = [
        (200, {"erro": True}),
        (
            200,
            {
                "cep": "01310100",
                "street": "Avenida Paulista",
                "neighborhood": "Bela Vista",
                "city": "São Paulo",
                "state": "SP",
            },
        ),
    ]
    result = search_cep("01310100")
    assert result.success
    assert result.data is not None
    assert result.data.logradouro == "Avenida Paulista"
    assert mock_get.call_count == 2


@patch("apps.organizations.services.cep._http_get_json")
def test_search_cep_both_fail(mock_get: MagicMock) -> None:
    mock_get.side_effect = [
        (200, {"erro": True}),
        (404, {}),
    ]
    result = search_cep("00000000")
    assert not result.success
    assert result.error is not None
    assert "nenhuma base" in result.error
