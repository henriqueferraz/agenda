# Agenda

SaaS de agendamento — reescrita para **Django + HTMX**.

Documentação canônica: [`.docs/00-SISTEMA.md`](./.docs/00-SISTEMA.md) · Roadmap: [`.docs/17-roadmap-tarefas.md`](./.docs/17-roadmap-tarefas.md)

## Stack

Python · Django · HTMX · PostgreSQL · n8n

## Bootstrap local

```bash
python3 -m venv .venv
source .venv/bin/activate
make install-dev
cp .env.example .env
make up          # Postgres via Docker
make migrate
make run         # http://localhost:8000 — healthz em /healthz
```

Sem Docker (SQLite implícito se `DATABASE_URL` estiver vazio no `.env`):

```bash
# remova ou comente DATABASE_URL no .env para cair no sqlite local
make migrate
make run
```

## Qualidade

```bash
make test        # pytest + coverage ≥ 80%
make lint
make typecheck
make ci
```

Conventional Commits obrigatórios (ver `.docs/15-cicd-commits-e-deploys.md`).

## Artefatos do legado mantidos

| Pasta | Uso |
|---|---|
| `public/` | Fonte das imagens (copiadas para `static/img/`) |
| `utils/` | Utilitários TypeScript a portar (Fase 1) |
| `n8n workflow/` | Workflows n8n de referência |
