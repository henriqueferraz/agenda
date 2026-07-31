from __future__ import annotations

from datetime import UTC, date, datetime

from apps.core.datetime_sp import (
    TIMEZONE_SP,
    compare_dates_in_sao_paulo,
    create_date_in_sao_paulo,
    end_of_day_in_sao_paulo,
    format_date_in_sao_paulo,
    format_datetime_in_sao_paulo,
    get_date_components_in_sao_paulo,
    is_past_in_sao_paulo,
    is_today_in_sao_paulo,
    start_of_day_in_sao_paulo,
)


def test_get_date_components_from_utc() -> None:
    # 2024-01-15 14:30 UTC → 11:30 em SP (UTC-3)
    utc = datetime(2024, 1, 15, 14, 30, 0, tzinfo=UTC)
    components = get_date_components_in_sao_paulo(utc)
    assert components.year == 2024
    assert components.month == 1
    assert components.day == 15
    assert components.hours == 11
    assert components.minutes == 30


def test_create_and_start_end_of_day() -> None:
    instant = create_date_in_sao_paulo(2024, 1, 15, 14, 30, 0)
    start = start_of_day_in_sao_paulo(instant)
    end = end_of_day_in_sao_paulo(instant)
    assert start.hour == 0 and start.minute == 0 and start.second == 0
    assert end.hour == 23 and end.minute == 59 and end.second == 59
    assert start.tzinfo == TIMEZONE_SP


def test_compare_same_day_different_hours() -> None:
    morning = create_date_in_sao_paulo(2024, 1, 15, 10, 0, 0)
    evening = create_date_in_sao_paulo(2024, 1, 15, 20, 0, 0)
    assert compare_dates_in_sao_paulo(morning, evening) == 0


def test_compare_different_days() -> None:
    day1 = create_date_in_sao_paulo(2024, 1, 15)
    day2 = create_date_in_sao_paulo(2024, 1, 16)
    assert compare_dates_in_sao_paulo(day1, day2) < 0
    assert compare_dates_in_sao_paulo(day2, day1) > 0


def test_is_today_and_past() -> None:
    now = create_date_in_sao_paulo(2024, 6, 10, 12, 0, 0)
    assert is_today_in_sao_paulo(create_date_in_sao_paulo(2024, 6, 10, 8, 0, 0), now=now)
    assert not is_today_in_sao_paulo(create_date_in_sao_paulo(2024, 6, 11), now=now)
    assert is_past_in_sao_paulo(create_date_in_sao_paulo(2024, 6, 10, 11, 0, 0), now=now)
    assert not is_past_in_sao_paulo(create_date_in_sao_paulo(2024, 6, 10, 13, 0, 0), now=now)


def test_format_pt_br() -> None:
    instant = create_date_in_sao_paulo(2024, 1, 15, 14, 30, 45)
    assert format_date_in_sao_paulo(instant) == "15/01/2024"
    assert format_date_in_sao_paulo(date(2024, 1, 15)) == "15/01/2024"
    assert format_datetime_in_sao_paulo(instant) == "15/01/2024 14:30:45"
