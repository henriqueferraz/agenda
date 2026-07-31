"""Datas e horas no timezone America/Sao_Paulo.

Port de ``utils/date-timezone.ts``. Em Python o mês é **1–12** (não 0–11 do JS).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from zoneinfo import ZoneInfo

TIMEZONE_SP = ZoneInfo("America/Sao_Paulo")


@dataclass(frozen=True, slots=True)
class DateComponentsSP:
    """Componentes civis em America/Sao_Paulo."""

    year: int
    month: int  # 1-12
    day: int
    hours: int
    minutes: int
    seconds: int


def get_date_components_in_sao_paulo(value: datetime) -> DateComponentsSP:
    """Extrai ano/mês/dia/hora no fuso America/Sao_Paulo."""
    local = value.astimezone(TIMEZONE_SP) if value.tzinfo else value.replace(tzinfo=TIMEZONE_SP)
    return DateComponentsSP(
        year=local.year,
        month=local.month,
        day=local.day,
        hours=local.hour,
        minutes=local.minute,
        seconds=local.second,
    )


def create_date_in_sao_paulo(
    year: int,
    month: int,
    day: int,
    hours: int = 0,
    minutes: int = 0,
    seconds: int = 0,
    milliseconds: int = 0,
) -> datetime:
    """Cria datetime timezone-aware representando o instante em Sao Paulo."""
    return datetime(
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
        milliseconds * 1000,
        tzinfo=TIMEZONE_SP,
    )


def get_now_in_sao_paulo() -> datetime:
    """Instante atual em America/Sao_Paulo."""
    return datetime.now(TIMEZONE_SP)


def start_of_day_in_sao_paulo(value: datetime | date) -> datetime:
    """Início do dia civil (00:00:00.000) em Sao Paulo."""
    if isinstance(value, datetime):
        components = get_date_components_in_sao_paulo(value)
        return create_date_in_sao_paulo(components.year, components.month, components.day)
    return create_date_in_sao_paulo(value.year, value.month, value.day)


def end_of_day_in_sao_paulo(value: datetime | date) -> datetime:
    """Fim do dia civil (23:59:59.999000) em Sao Paulo."""
    if isinstance(value, datetime):
        components = get_date_components_in_sao_paulo(value)
        return create_date_in_sao_paulo(
            components.year,
            components.month,
            components.day,
            23,
            59,
            59,
            999,
        )
    return create_date_in_sao_paulo(value.year, value.month, value.day, 23, 59, 59, 999)


def compare_dates_in_sao_paulo(date1: datetime | date, date2: datetime | date) -> int:
    """Compara apenas o dia civil; <0, 0 ou >0."""
    d1 = start_of_day_in_sao_paulo(date1)
    d2 = start_of_day_in_sao_paulo(date2)
    if d1 < d2:
        return -1
    if d1 > d2:
        return 1
    return 0


def is_today_in_sao_paulo(value: datetime | date, *, now: datetime | None = None) -> bool:
    """True se o dia civil for o de ``now`` (padrão: agora em SP)."""
    current = now if now is not None else get_now_in_sao_paulo()
    return compare_dates_in_sao_paulo(value, current) == 0


def is_past_in_sao_paulo(value: datetime, *, now: datetime | None = None) -> bool:
    """True se o instante for estritamente anterior a ``now``."""
    current = now if now is not None else get_now_in_sao_paulo()
    if value.tzinfo is None:
        value = value.replace(tzinfo=TIMEZONE_SP)
    if current.tzinfo is None:
        current = current.replace(tzinfo=TIMEZONE_SP)
    return value < current


def format_date_in_sao_paulo(value: datetime | date) -> str:
    """Formata data como ``dd/mm/aaaa`` em Sao Paulo."""
    if isinstance(value, datetime):
        components = get_date_components_in_sao_paulo(value)
        return f"{components.day:02d}/{components.month:02d}/{components.year}"
    return f"{value.day:02d}/{value.month:02d}/{value.year}"


def format_datetime_in_sao_paulo(value: datetime) -> str:
    """Formata data/hora como ``dd/mm/aaaa HH:MM:SS`` em Sao Paulo."""
    components = get_date_components_in_sao_paulo(value)
    return (
        f"{components.day:02d}/{components.month:02d}/{components.year} "
        f"{components.hours:02d}:{components.minutes:02d}:{components.seconds:02d}"
    )


def combine_date_and_time_in_sao_paulo(day: date, clock: time) -> datetime:
    """Combina date + time como instante aware em Sao Paulo."""
    return create_date_in_sao_paulo(
        day.year,
        day.month,
        day.day,
        clock.hour,
        clock.minute,
        clock.second,
        clock.microsecond // 1000,
    )
