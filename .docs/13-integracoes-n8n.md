# 13 — Integrações n8n

> Política e fluxo de comunicação WhatsApp / e-mail de negócio  
> Contratos de payload: [WEBHOOK_PAYLOAD.md](./WEBHOOK_PAYLOAD.md) · [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md)  
> Env vars: [10-configuracoes.md](./10-configuracoes.md)  
> Atualizado: 2026-07-31

---

## 1. Regra de ouro

O Django **não** envia WhatsApp nem e-mail **ao cliente/profissional** diretamente.  
Fluxo de negócio: **Django service → HTTP POST webhook n8n → canal final**.

Exceções SMTP/Mailtrap no app:

- OTP / reset de senha (auth)
- Formulário de **contato** do site (`CONTACT_EMAIL_TO`) — ops interno

## 2. Canais

| Env | Uso | Auth |
|---|---|---|
| `BASE_N8N` | create/cancel/edit/reschedule — **envio direto** do service | `WEBHOOK_AUTH_TOKEN` + `WEBHOOK_SECRET` (HMAC) |
| `GLOBAL_N8N` | lembretes, broadcast, autogestão, avisos | `GLOBAL_WEBHOOK_SECRET` |

## 3. Eventos BASE_N8N

Campo `type`: `create` | `cancel` | `reschedule` | `edit`

Schema completo (campos, exemplos, headers): [WEBHOOK_PAYLOAD.md](./WEBHOOK_PAYLOAD.md).

**v1:** sem proxy HTTP interno — o service monta o payload e POST em `BASE_N8N`.

## 4. Eventos GLOBAL_N8N

Principais na v1:

- Lembretes `reminder_7d` / `reminder_24h` / `reminder_2h`
- `custom_individual` / `custom_bulk` / `unavailability`
- Autogestão: `management_link`, `client_cancelled`, `client_rescheduled`

Catálogo completo (22 campos + todos os `type`): [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md).

## 5. Segurança outbound

1. Timeout curto (ex.: 5–10s) + retry controlado  
2. Não quebrar a transação de negócio se o webhook falhar — logar e degradar com graça (ou outbox)  
3. Assinar body (HMAC) no BASE; token fixo no GLOBAL  
4. Comparação **timing-safe** de secrets; nunca logar signature/token  
5. Variáveis **server-only**  
6. Cron: token + preferível allowlist de IP do host agendador  

**Pós-v1 (SEC-05):** outbox persistente + backoff + dead-letter — ver [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md) §10.5.

## 6. Cron de lembretes

`POST /api/cron/reminders/`

1. Valida `WEBHOOK_AUTH_TOKEN`  
2. Busca appointments nas janelas  
3. Filtra MessageConfig  
4. Idempotência via ReminderLog unique(appointment, type)  
5. Envia `GLOBAL_N8N`  

**v1:** disparo por cron HTTP do host. Celery Beat só se o volume exigir depois.

## 7. Testes

- Mock de HTTP (responses / httpx mock)
- Casos: env ausente (no-op), secret ausente, 5xx do n8n, sucesso
- Não bater n8n real em CI
- F4 (lembretes): cobertura obrigatória em **integração** (mesmo sem e2e)

## 8. Relacionados

- [06-regras-de-negocio.md](./06-regras-de-negocio.md)
- [10-configuracoes.md](./10-configuracoes.md)
- [WEBHOOK_PAYLOAD.md](./WEBHOOK_PAYLOAD.md)
- [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md)
