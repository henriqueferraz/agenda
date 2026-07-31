"""Re-export de views do core."""

from __future__ import annotations

from apps.core.views.health import healthz

__all__ = ["healthz"]
