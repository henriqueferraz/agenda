from __future__ import annotations

from apps.core.br_phone import format_phone, get_phone_type, is_valid_phone, unformat_phone


def test_format_mobile_and_landline() -> None:
    assert format_phone("11999999999") == "(11) 99999-9999"
    assert format_phone("1133334444") == "(11) 3333-4444"
    assert format_phone("") == ""
    assert format_phone(None) == ""


def test_unformat_and_validate() -> None:
    assert unformat_phone("(11) 99999-9999") == "11999999999"
    assert is_valid_phone("11999999999")
    assert is_valid_phone("1133334444")
    assert not is_valid_phone("123")
    assert not is_valid_phone(None)


def test_phone_type() -> None:
    assert get_phone_type("11999999999") == "mobile"
    assert get_phone_type("1133334444") == "landline"
    assert get_phone_type("123") is None
