# 17 — Roadmap de tarefas (v1 Django + HTMX)

> Lista de desenvolvimento incremental alinhada a [00-SISTEMA.md](./00-SISTEMA.md) §8  
> Atualizado: 2026-07-31

**Como usar:** marcar checkboxes conforme entrega. Cada subtarefa deve seguir o ritmo: modelo/migration → service/selectors → forms/views HTMX → testes → commit conventional → atualizar `.docs` se mudar regra.

**DoD global:** [00-SISTEMA.md](./00-SISTEMA.md) §9 · paridade [05-funcionalidades.md](./05-funcionalidades.md) §1.

**Issues GitHub** (uma por fase):

| Fase | Issue |
|---:|---|
| 0 | [#1](https://github.com/henriqueferraz/agenda/issues/1) |
| 1 | [#2](https://github.com/henriqueferraz/agenda/issues/2) |
| 2 | [#3](https://github.com/henriqueferraz/agenda/issues/3) |
| 3 | [#4](https://github.com/henriqueferraz/agenda/issues/4) |
| 4 | [#5](https://github.com/henriqueferraz/agenda/issues/5) |
| 5 | [#6](https://github.com/henriqueferraz/agenda/issues/6) |
| 6 | [#7](https://github.com/henriqueferraz/agenda/issues/7) |
| 7 | [#8](https://github.com/henriqueferraz/agenda/issues/8) |
| 8 | [#9](https://github.com/henriqueferraz/agenda/issues/9) |
| 9 | [#10](https://github.com/henriqueferraz/agenda/issues/10) |
| 10 | [#11](https://github.com/henriqueferraz/agenda/issues/11) |
| 11 | [#12](https://github.com/henriqueferraz/agenda/issues/12) |

Lista: https://github.com/henriqueferraz/agenda/issues

---

## Ritmo por feature

1. Modelo + migration  
2. Service / selectors (regras sem `HttpRequest`)  
3. Forms + views HTMX (partials, 422 com erros)  
4. Testes unitários no app + integração na raiz quando couber  
5. Commit Conventional Commits  
6. Docs se a regra/rota/modelo mudar  

---

## Fase 0 — Skeleton, tooling e CI

*Refs: [02](./02-arquitetura.md), [03](./03-estrutura.md), [10](./10-configuracoes.md), [14](./14-testes.md), [15](./15-cicd-commits-e-deploys.md), [16](./16-boas-praticas.md)*

### 0.1 Projeto Django

- [x] Criar `config/` com settings split (`base` / `local` / `production` / `test`)
- [x] Criar apps vazios: `accounts`, `organizations`, `catalog`, `scheduling`, `clients`, `messaging`, `dashboard`, `billing`, `public_booking`, `core`
- [x] `manage.py`, `pyproject.toml` / `requirements/`, Docker Compose (PostgreSQL), Makefile
- [x] README de bootstrap local

### 0.2 Ambiente

- [x] `.env.example` com vars de [10-configuracoes.md](./10-configuracoes.md)
- [x] Timezone `America/Sao_Paulo`, locale `pt-BR`
- [x] Endpoint healthcheck `/healthz`

### 0.3 Qualidade

- [x] Lint/format/types (Ruff/Black/mypy ou equivalente do projeto)
- [x] pytest + `--cov-fail-under=80`
- [x] Pastas `apps/*/tests/`, `tests/integration/`, `tests/e2e/`

### 0.4 CI/CD base

- [x] Workflow PR: lint → types → migrations check → tests+cov → security → commitlint
- [ ] Branch protection em `main` (habilitar em GitHub Settings → Branches)
- [x] Conventional Commits + commitlint

### 0.5 Assets e shells

- [x] Copiar imagens `public/` → `static/img/` ([03](./03-estrutura.md) §7.1)
- [x] Templates base + `layouts/` mínimos (auth / painel / público)

---

## Fase 1 — `core` (utils portados)

*Refs: [03](./03-estrutura.md) §7.2, [06](./06-regras-de-negocio.md) §2 e §6*

- [ ] Portar timezone SP (`date-timezone`) + testes unitários
- [ ] Portar CPF / CNPJ / telefone + máscaras de exibição
- [ ] Portar CEP (ViaCEP → fallback BrasilAPI) + UF oficial
- [ ] Helpers de ownership, erros opacos, compare timing-safe
- [ ] Cobertura unitária dos validators BR

---

## Fase 2 — `accounts` (auth + trial)

*Refs: [05](./05-funcionalidades.md) Auth, [06](./06-regras-de-negocio.md) §7–8, [12](./12-autenticacao-e-seguranca.md)*

### 2.1 Modelo User

- [ ] Roles `enterprise` / `master`
- [ ] `trial_ends_at` + plano `TRIAL` | `BASIC` | `PROFESSIONAL`
- [ ] Migrations + admin básico

### 2.2 Registro + OTP

- [ ] Form de registro
- [ ] Geração de OTP hasheado + e-mail SMTP/Mailtrap
- [ ] Verify OTP (expiração, tentativas, cooldown, anti-enumeração)

### 2.3 Login / logout

- [ ] Sessão Django + CSRF
- [ ] Rotacionar sessão no login
- [ ] Lockout + rate limit por IP

### 2.4 Senha

- [ ] Forgot / reset (token hasheado, TTL curto, single-use)
- [ ] Change password (≥ 12 + validadores Django; Argon2 preferencial)

### 2.5 Gate de trial e master

- [ ] Middleware/decorator: pós-trial sem plano pago → upgrade (exceto `master`)
- [ ] Admin master: gestão de usuários / reset de senha (paridade legado)

### 2.6 Testes

- [ ] Unit: OTP, reset, trial
- [ ] Integração: fluxos auth
- [ ] E2E F1 parcial: register → OTP → login

---

## Fase 3 — `organizations` (onboarding)

*Refs: [05](./05-funcionalidades.md) Config, [06](./06-regras-de-negocio.md) §10, [11](./11-gestao.md)*

- [ ] Modelo Activity (lista configurável) + seed inicial
- [ ] Gestão master: ativar / desativar / editar atividades
- [ ] Perfil PF/PJ (CPF/CNPJ) + nome fantasia
- [ ] Upload de logo (object storage)
- [ ] Endereço + busca CEP via HTMX (partial)
- [ ] Horários de funcionamento por dia da semana
- [ ] Fluxo onboarding pós-login (ordem F1)
- [ ] Testes de ownership + validação docs BR

---

## Fase 4 — `catalog` + `clients`

*Refs: [05](./05-funcionalidades.md) Catálogo/Clientes, [06](./06-regras-de-negocio.md) §1, §4–5*

### 4.1 Serviços

- [ ] CRUD (preço em centavos, duração em minutos)
- [ ] Soft-delete bloqueado se houver agendamentos futuros

### 4.2 Funcionários

- [ ] CRUD + horários por dia
- [ ] `unique(user_id, email)`
- [ ] Vínculo N:N employee ↔ service (mesmo tenant)

### 4.3 Clientes

- [ ] CRUD; unicidade `(user, cpf)` e `(user, email)`
- [ ] Find-or-create; validação CPF

### 4.4 UI e testes

- [ ] Views HTMX (partials listas/forms, status 422 com erros)
- [ ] Testes unit + integração de ownership e unicidade

---

## Fase 5 — `scheduling` (núcleo)

*Refs: [05](./05-funcionalidades.md) Agenda/Bloqueios, [04](./04-modelo-de-dados.md), [06](./06-regras-de-negocio.md) §3–4*

### 5.1 Modelos

- [ ] Appointment, AppointmentHistory, StopDay, BlockedTime
- [ ] Unique parcial `(employee, date, time) WHERE status = confirmed`
- [ ] `management_token` alta entropia, único, em claro

### 5.2 Disponibilidade (service puro)

- [ ] Slot = empresa ∩ funcionário − StopDay − BlockedTime − conflito confirmed
- [ ] Em edit/reschedule, excluir o próprio appointment
- [ ] Conflito de cliente no mesmo intervalo (regra legado)
- [ ] Bateria de testes unitários densos

### 5.3 CRUD painel

- [ ] Calendário mensal + agenda diária (HTMX)
- [ ] Criar / editar / cancelar / reagendar
- [ ] History em toda mutação; cancelamento soft (sem hard-delete padrão)

### 5.4 Bloqueios

- [ ] StopDay (dia inteiro)
- [ ] BlockedTime (slot por funcionário)
- [ ] Integração CRUD + ownership

---

## Fase 6 — `public_booking`

*Refs: [05](./05-funcionalidades.md) F2, [06](./06-regras-de-negocio.md) §11, [07](./07-rotas.md), [12](./12-autenticacao-e-seguranca.md)*

- [ ] Rotas `/agendamento/<token>/` e `/a/<code>/`
- [ ] Fluxo: serviço → funcionário → data → horário → dados do cliente
- [ ] Persistir Appointment + Client (find-or-create)
- [ ] Tela de confirmação + link de gestão
- [ ] Autogestão `/agendamento/gerenciar/<management_token>/` (cancelar / reagendar)
- [ ] Rate limit nos endpoints públicos
- [ ] E2E F2 + integração de conflito / concorrência

---

## Fase 7 — `messaging` + n8n

*Refs: [05](./05-funcionalidades.md) Mensagens/F4, [06](./06-regras-de-negocio.md) §9, [13](./13-integracoes-n8n.md), [WEBHOOK_PAYLOAD.md](./WEBHOOK_PAYLOAD.md), [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md)*

- [ ] Client HTTP tipado `BASE_N8N` (HMAC/token) — envio **direto** do service
- [ ] Disparo em create / cancel / reschedule / edit (`type` correto)
- [ ] MessageConfig (janelas 7d / 24h / 2h)
- [ ] Cron HTTP autenticado → seleção de janelas → `GLOBAL_N8N`
- [ ] ReminderLog idempotente `(appointment, type)`
- [ ] Mensagens individuais / em massa / indisponibilidade + logs de envio
- [ ] Testes de integração F4 com mocks n8n

---

## Fase 8 — `dashboard` + design system + marketing

*Refs: [05](./05-funcionalidades.md) Dashboard/Marketing, [08](./08-layout.md), [09](./09-design.md), [11](./11-gestao.md)*

- [ ] KPIs (agendamentos, clientes, receita)
- [ ] Agenda do dia + novos agendamentos (polling / refresh HTMX)
- [ ] CRUD tarefas / lembretes internos do painel
- [ ] Exibir link de booking público
- [ ] Shell do painel (sidebar), responsivo, a11y básica
- [ ] Landing page
- [ ] Formulário de contato SMTP (`CONTACT_EMAIL_TO`) — **não** n8n
- [ ] Página upgrade pós-trial
- [ ] Polish visual reusando `static/img/`

---

## Fase 9 — Segurança transversal

*Refs: [12](./12-autenticacao-e-seguranca.md)*

- [ ] CSRF em todos os POSTs HTMX (`hx-headers`)
- [ ] Cookies `HttpOnly` / `Secure` / `SameSite`
- [ ] Rate limit auth / contato / público / autogestão
- [ ] Logs sem secrets; erros sem stack interno ao cliente
- [ ] Checklist de [12](./12-autenticacao-e-seguranca.md) revisado antes do soft launch

---

## Fase 10 — Qualidade E2E e cobertura

*Refs: [14](./14-testes.md), [00](./00-SISTEMA.md) §9*

- [ ] E2E F1: cadastro → OTP → login → onboarding → link
- [ ] E2E F2: agendamento público completo
- [ ] E2E F3: painel cancelar / reagendar / editar + history
- [ ] Integração F4: cron + mocks GLOBAL_N8N
- [ ] Cobertura global ≥ 80% no CI

---

## Fase 11 — Migração legado + go-live

*Refs: [00](./00-SISTEMA.md) §8–9, [04](./04-modelo-de-dados.md), [15](./15-cicd-commits-e-deploys.md)*

- [ ] Script/migração Prisma → Django (mapeamento do modelo)
- [ ] Validar payloads n8n em staging
- [ ] CD: staging automático; produção por tag/release + migrate + healthcheck
- [ ] Soft launch → produção
- [ ] Revisar `.docs` + data em [00-SISTEMA.md](./00-SISTEMA.md)

---

## Fora do escopo v1 (backlog)

Ver [05-funcionalidades.md](./05-funcionalidades.md) §3. Exemplos: Stripe (`billing`), QR, export CSV/PDF, PWA, Google Calendar, 2FA, outbox n8n, recorrência, multi-loja.

---

## Relacionados

- [00-SISTEMA.md](./00-SISTEMA.md) — ordem sugerida e DoD  
- [05-funcionalidades.md](./05-funcionalidades.md) — inventário e fluxos F1–F4  
- [06-regras-de-negocio.md](./06-regras-de-negocio.md) — regras a cobrir com testes  
- [14-testes.md](./14-testes.md) · [15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md)
