# 02 — Arquitetura

> Stack alvo: **Django + HTMX + PostgreSQL + n8n**  
> Atualizado: 2026-07-31

---

## 1. Visão geral

```
┌─────────────┐     HTMX / forms      ┌──────────────────┐
│  Browser    │ ◄──────────────────► │  Django (Views)  │
│  (HTML)     │   partials HTML      │  Templates       │
└─────────────┘                      └────────┬─────────┘
                                              │ ORM
                                     ┌────────▼─────────┐
                                     │   PostgreSQL     │
                                     └────────┬─────────┘
                                              │ webhooks HTTP
                     ┌────────────────────────┼────────────────────────┐
                     ▼                        ▼                        ▼
              ┌────────────┐           ┌────────────┐           ┌────────────┐
              │ n8n        │           │ SMTP/Mail  │           │ Storage    │
              │ WhatsApp/  │           │ (OTP/auth) │           │ (S3/Supabase)│
              │ e-mail biz │           └────────────┘           └────────────┘
              └────────────┘
```

## 2. Estilo arquitetural

| Camada | Responsabilidade |
|---|---|
| **Presentation** | Templates Django + HTMX (partials) |
| **Application** | Views, forms, services (casos de uso) |
| **Domain** | Regras de negócio puras (disponibilidade, conflitos, ownership) |
| **Infrastructure** | ORM, e-mail auth, HTTP para n8n, storage, cache, filas |

Padrão recomendado: **Django apps por domínio** + camada `services/` para lógica que não cabe em models/forms.

## 3. Apps Django sugeridos

| App | Domínio |
|---|---|
| `accounts` | Auth (sessão), OTP, reset senha, roles, trial, plano até Stripe |
| `organizations` | Perfil PF/PJ, atividade (lista configurável), endereço, logo, horários empresa |
| `catalog` | Serviços, funcionários, vínculo N:N |
| `scheduling` | Agendamentos, calendário, feriados, bloqueios, disponibilidade |
| `clients` | Cadastro de clientes do negócio |
| `messaging` | Config lembretes, logs, client HTTP n8n (direto) |
| `dashboard` | Home do painel, estatísticas, reminders/tarefas |
| `billing` | **Futuro** — Stripe/planos pagos (na v1 o trial/plano vive em `accounts`) |
| `core` | Timezone utils, validators BR, CEP, middlewares |
| `public_booking` | Fluxo público `/agendamento/` e `/a/` |

## 4. HTMX — contrato de UI

- Mutações retornam **partials HTML** (`HX-Request`)
- Listas/tabelas atualizam via `hx-swap` (`outerHTML` / `innerHTML`)
- Erros de formulário: re-render do form com erros (status 422)
- Toasts/feedback: `HX-Trigger` com eventos custom (`showToast`)
- Evitar SPA; preferir navegação server-driven

## 5. Autenticação (v1 — decisão fechada)

**Sessão Django** + cookies `HttpOnly` / `Secure` / `SameSite` + CSRF em todos os POSTs HTMX (`hx-headers`).

JWT / refresh tokens: **fora da v1** (somente se API mobile/separada no futuro).

## 6. Integrações

| Sistema | Papel |
|---|---|
| **n8n `BASE_N8N`** | Eventos de agendamento — service Django → webhook **direto** |
| **n8n `GLOBAL_N8N`** | Lembretes, mensagens em massa, autogestão |
| **SMTP / Mailtrap** | OTP, reset de senha **e** formulário de contato |
| **ViaCEP / BrasilAPI** | Busca de endereço por CEP |
| **Object storage** | Logo da empresa |

Regra: WhatsApp e e-mails **ao cliente/profissional** → somente n8n. Contato do site e auth → SMTP.

## 7. Observabilidade

- Logging estruturado JSON em produção
- Healthcheck `/healthz`
- Métricas básicas (opcional: Prometheus)
- Sem analytics de produto obrigatório na v1 da reescrita

## 8. Deploy alvo

- App: containers (Docker) ou PaaS (Railway, Render, Fly.io, VPS)
- DB: PostgreSQL gerenciado (Supabase / RDS / Neon)
- Reverse proxy: Nginx / Caddy
- Processos v1: Gunicorn (WSGI) + **cron HTTP** para lembretes; Celery/RQ só se volume exigir depois

## 9. Relacionados

- [03-estrutura.md](./03-estrutura.md)
- [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md)
- [13-integracoes-n8n.md](./13-integracoes-n8n.md)
- [15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md)