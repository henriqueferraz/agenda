# 10 — Configurações

> Única fonte de variáveis de ambiente, settings Django e secrets  
> Atualizado: 2026-07-31

---

## 1. Variáveis de ambiente

### Obrigatórias

| Variável | Uso |
|---|---|
| `DJANGO_SECRET_KEY` | Django |
| `DJANGO_DEBUG` | `false` em prod |
| `DJANGO_ALLOWED_HOSTS` | hosts |
| `DATABASE_URL` | PostgreSQL runtime |
| `DIRECT_URL` | opcional — migrations se pooler (Supabase: porta **5432** sem pgbouncer) |
| `EMAIL_*` / `MAILTRAP_*` | OTP e reset (um dos caminhos) |

Em **Supabase**: `DATABASE_URL` = pooler (porta **6543** + `?pgbouncer=true`); `DIRECT_URL` = conexão direta. Sem `DIRECT_URL` correta, migrate pode travar no PgBouncer. Evite `@`, `#`, `%` na senha sem URL-encoding.

### URL pública

| Variável | Uso |
|---|---|
| `PUBLIC_APP_URL` | links absolutos (e-mail, booking, webhooks) |

### E-mail (OTP / reset / contato)

Obrigatório **um** caminho:

1. **Mailtrap** — se `MAILTRAP_API_KEY` existir  
2. **SMTP** — fallback

| Variável | Uso |
|---|---|
| `MAILTRAP_API_KEY` / `MAILTRAP_SENDER_EMAIL` / `MAILTRAP_SENDER_NAME` | Mailtrap |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP |

### n8n

| Variável | Uso |
|---|---|
| `BASE_N8N` | webhook agendamentos |
| `WEBHOOK_AUTH_TOKEN` | auth outbound + cron (`x-webhook-auth`) |
| `WEBHOOK_SECRET` | HMAC appointment (`x-webhook-signature`) |
| `GLOBAL_N8N` | mensagens globais |
| `GLOBAL_WEBHOOK_SECRET` | auth global (`x-global-auth`) |

Sem `BASE_N8N` / `GLOBAL_N8N`: envio é no-op (logar; não quebrar a transação).

### Contato / storage

| Variável | Uso |
|---|---|
| `CONTACT_EMAIL_TO` | formulário de contato (**SMTP**, não n8n) |
| `CONTACT_EMAIL_CC` | cópia opcional |
| `CONTACT_WHATSAPP` / `CONTACT_EMAIL` | página upgrade |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | logo (server-only) |
| `SUPABASE_STORAGE_LOGO_BUCKET` | opcional (padrão `logos`) |

> Nunca expor secrets ao browser. Em Django, só o mínimo via context processors se necessário.

### Reservadas (pós-v1)

`STRIPE_*`, `SENTRY_DSN` — planejadas.

---

## 2. Exemplo de `.env` (Django)

```env
DJANGO_SECRET_KEY="gerar-com-openssl-rand-base64-32"
DJANGO_DEBUG="true"
DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1"

DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."   # se pooler

PUBLIC_APP_URL="http://localhost:8000"

MAILTRAP_API_KEY="..."
MAILTRAP_SENDER_EMAIL="no-reply@seu-dominio.com"
MAILTRAP_SENDER_NAME="Agenda"
# ou SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM

CONTACT_EMAIL_TO="seu-email@dominio.com"
CONTACT_EMAIL_CC=""
CONTACT_EMAIL="contato@agenda.com"
CONTACT_WHATSAPP="5547999999999"

BASE_N8N="https://seu-n8n.com/webhook/appointments"
WEBHOOK_AUTH_TOKEN="openssl-rand-hex-32"
WEBHOOK_SECRET="openssl-rand-hex-32"
GLOBAL_N8N="https://seu-n8n.com/webhook/global-messages"
GLOBAL_WEBHOOK_SECRET="openssl-rand-hex-32"

SUPABASE_URL="https://SEU_PROJETO.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_STORAGE_LOGO_BUCKET="logos"
```

Nunca commitar `.env` com segredos. Permissões sugeridas: `600`.

---

## 3. Settings split

```
config/settings/base.py       # apps, middleware, templates, i18n
config/settings/local.py      # DEBUG, mail console
config/settings/production.py # SECURE_*, Sentry opcional
config/settings/test.py       # DB rápido, email locmem
```

## 4. Segurança Django (produção)

- `SECURE_SSL_REDIRECT=True`
- `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE`
- `SESSION_COOKIE_HTTPONLY`
- `SECURE_HSTS_*`
- `SECURE_CONTENT_TYPE_NOSNIFF`
- `X_FRAME_OPTIONS=DENY`
- CSP + Referrer-Policy (ver [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md))
- `SECURE_PROXY_SSL_HEADER` + IPs do reverse proxy
- CSRF trusted origins corretos

## 5. Locale e timezone

```python
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_TZ = True
```

## 6. Arquivos estáticos / media

- WhiteNoise ou CDN para static
- Media (logos) em object storage em produção
- Fallback local só em desenvolvimento

## 7. Dependências de processo

| Processo | Função |
|---|---|
| web | Gunicorn + Django |
| cron HTTP | lembretes 7d/24h/2h → `/api/cron/reminders/` |
| worker (Celery/RQ) | **opcional** — só se volume exigir depois |
| migrate | no deploy |

## 8. Checklist local

- [ ] `.env` criado (não commitado)
- [ ] `migrate` ok
- [ ] e-mail OTP funcionando (console backend em dev)
- [ ] n8n opcional com mocks nos testes

## 9. Troubleshooting rápido

| Sintoma | Checagem |
|---|---|
| Migrate trava (Supabase) | `DIRECT_URL` na 5432 sem pgbouncer |
| E-mail não envia | Mailtrap **ou** SMTP completo |
| n8n agendamento silencioso | `BASE_N8N` + auth/HMAC |
| Lembretes não saem | `GLOBAL_N8N` + `GLOBAL_WEBHOOK_SECRET` + cron com `WEBHOOK_AUTH_TOKEN` |
| Upload de logo falha | `SUPABASE_*` em produção |
| Contato retorna erro | `CONTACT_EMAIL_TO` + backend de e-mail |

## 10. Relacionados

- [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md)
- [13-integracoes-n8n.md](./13-integracoes-n8n.md)
- [15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md)
