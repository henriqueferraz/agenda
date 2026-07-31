from __future__ import annotations

from types import SimpleNamespace

import pytest

from apps.core.br_geo import BRAZIL_UFS, is_valid_uf
from apps.core.security import (
    OPAQUE_ERROR_MESSAGE,
    assert_same_owner,
    is_same_owner,
    opaque_error,
    timing_safe_equal,
)


def test_uf_list() -> None:
    assert len(BRAZIL_UFS) == 27
    assert is_valid_uf("sp")
    assert is_valid_uf("SC")
    assert not is_valid_uf("XX")
    assert not is_valid_uf(None)


def test_opaque_and_timing_safe() -> None:
    assert opaque_error(detail="segredo interno") == OPAQUE_ERROR_MESSAGE
    assert timing_safe_equal("abc", "abc")
    assert timing_safe_equal(b"abc", b"abc")
    assert not timing_safe_equal("abc", "abd")
    assert not timing_safe_equal("abc", "ab")


def test_ownership() -> None:
    resource = SimpleNamespace(user_id=42)
    assert is_same_owner(42, resource)
    assert not is_same_owner(7, resource)
    assert_same_owner(42, resource)
    with pytest.raises(PermissionError):
        assert_same_owner(7, resource)
