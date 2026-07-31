"""Constantes e helpers compartilhados do app organizations."""

from __future__ import annotations

import re

WEEKDAY_TIME_FIELDS: tuple[str, ...] = (
    "mon_times",
    "tue_times",
    "wed_times",
    "thu_times",
    "fri_times",
    "sat_times",
    "sun_times",
)

TIME_HHMM_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

DEFAULT_ACTIVITIES: tuple[tuple[str, str, int], ...] = (
    ("barbearia", "Barbearia", 10),
    ("cabelereiro", "Cabelereiro", 20),
    ("manicure", "Manicure", 30),
    ("maquiagem", "Maquiagem", 40),
    ("petshop", "Petshop", 50),
    ("dentistas", "Dentistas", 60),
    ("medicos", "Médicos", 70),
    (
        "outros-profissionais-liberais",
        "Outros profissionais liberais (agendamento de horários)",
        80,
    ),
)
