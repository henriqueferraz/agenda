# 00 — SISTEMA Agenda (Django · HTMX) — Documento Mestre

> **Propósito:** amarrar em um único lugar o mapa completo da reescrita do Agenda.  
> **Stack alvo:** Python · Django · HTMX · PostgreSQL · n8n  
> **Autor:** Henrique Ferraz  
> **Atualizado:** 2026-07-31  
> **Legado de referência:** Next.js 16 / Prisma 0.9.0 (pasta raiz atual)

Este arquivo é o **índice canônico**. Os detalhes vivem nos documentos numerados; aqui está a visão unificada, as decisões e os links.

---

## 1. Sumário executivo

O Agenda é um SaaS de agendamento para profissionais de serviços. A reescrita preserva as regras de negócio do sistema atual e troca a base tecnológica para **Django (server-driven) + HTMX**, com qualidade industrial:

| Pilar | Meta |
|---|---|
| Testes | Unitário + integração + e2e |
| Cobertura | **≥ 80%** (gate de CI) |
| Commits | **Conventional Commits** + commitlint |
| Entrega | CI em PR + CD staging/produção |
| Comunicação ao cliente | **Somente n8n** (WhatsApp/e-mail) |
| Contato do site + auth | **SMTP/Mailtrap** |
| Timezone | `America/Sao_Paulo` |
| Multi-tenant | Isolamento por `User` + ownership |
| Auth v1 | Sessão Django + CSRF (sem JWT) |

---

## 2. Mapa da documentação (`.docs/`)

| # | Arquivo | Conteúdo |
|---:|---|---|
| 00 | [00-SISTEMA.md](./00-SISTEMA.md) | **Este arquivo** — visão unificada |
| 01 | [01-contexto.md](./01-contexto.md) | Produto, personas, escopo, princípios |
| 02 | [02-arquitetura.md](./02-arquitetura.md) | Camadas, apps, HTMX, deploy |
| 03 | [03-estrutura.md](./03-estrutura.md) | Árvore de pastas e convenções |
| 04 | [04-modelo-de-dados.md](./04-modelo-de-dados.md) | Entidades, enums, índices, integridade |
| 05 | [05-funcionalidades.md](./05-funcionalidades.md) | Inventário v1 + backlog + fluxos |
| 06 | [06-regras-de-negocio.md](./06-regras-de-negocio.md) | Disponibilidade, ownership, trial, docs BR |
| 07 | [07-rotas.md](./07-rotas.md) | URLConf público, painel, jobs |
| 08 | [08-layout.md](./08-layout.md) | Shells, sidebar, partials |
| 09 | [09-design.md](./09-design.md) | Design system, responsivo, a11y |
| 10 | [10-configuracoes.md](./10-configuracoes.md) | Env vars, settings, locale |
| 11 | [11-gestao.md](./11-gestao.md) | Operação do painel |
| 12 | [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md) | AuthN/Z, rate limit, hardening |
| 13 | [13-integracoes-n8n.md](./13-integracoes-n8n.md) | Política webhooks BASE/GLOBAL |
| 14 | [14-testes.md](./14-testes.md) | Pirâmide, 80%, marcas |
| 15 | [15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md) | Conventional Commits, CI/CD |
| 16 | [16-boas-praticas.md](./16-boas-praticas.md) | Padrões de código e operação |
| — | [WEBHOOK_PAYLOAD.md](./WEBHOOK_PAYLOAD.md) | Schema BASE_N8N |
| — | [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md) | Schema GLOBAL_N8N (22 campos) |

README na raiz.

---

## 3. Visão arquitetural condensada

```
Browser ──HTMX/HTML──► Django Views/Forms ──ORM──► PostgreSQL
                              │
                              ├── SMTP (OTP/reset)
                              ├── Storage (logo)
                              └── HTTP ──► n8n (WhatsApp / e-mail negócio)
```

Apps Django: `accounts`, `organizations`, `catalog`, `scheduling`, `clients`, `messaging`, `dashboard`, `billing`, `public_booking`, `core`.

Detalhes: [02-arquitetura.md](./02-arquitetura.md) · [03-estrutura.md](./03-estrutura.md).

---

## 4. Domínio condensado

**Núcleo:** User (tenant) → Services / Employees / Clients → Appointments  
**Apoio:** Address, StopDay, BlockedTime, Reminder, MessageConfig, History, Logs  
**Auth:** OTP, reset tokens, rate limits, security logs  
**Billing/trial:** `trial_ends_at` + plano `TRIAL|BASIC|PROFESSIONAL` em `accounts` na v1; app `billing` só com Stripe.  

Regras-chave:

1. Ownership sempre pela sessão  
2. Slot livre = empresa ∩ funcionário − feriado − bloqueio − conflito (**unique parcial** só `confirmed`)  
3. Preço em centavos; duração em minutos  
4. Histórico em toda mutação relevante de appointment  
5. `management_token` em claro (alta entropia); OTP/reset hasheados  
6. URLs PT: `/agendamento/<token>`, `/a/<code>`, gestão por token  
7. Atividades: lista **configurável**  

Detalhes: [04-modelo-de-dados.md](./04-modelo-de-dados.md) · [06-regras-de-negocio.md](./06-regras-de-negocio.md).

---

## 5. Superfície de produto condensada

| Área | Entrega v1 |
|---|---|
| Auth | register/OTP/login/reset (**sessão**) |
| Config | atividade configurável, PF/PJ, logo, endereço, horários |
| Catálogo | serviços + funcionários N:N (`unique(user, email)`) |
| Agenda | CRUD painel + público + cancel/edit/reschedule |
| Bloqueios | feriados + slots |
| Dashboard | KPIs, dia, tarefas, link booking |
| Mensagens | config lembretes + n8n direto |
| Marketing | landing + contato (SMTP) + upgrade |

Rotas: [07-rotas.md](./07-rotas.md) · Gestão: [11-gestao.md](./11-gestao.md) · UI: [08-layout.md](./08-layout.md) · [09-design.md](./09-design.md).

---

## 5.1 Decisões fechadas (auditoria)

| # | Tema | Decisão |
|---|---|---|
| 1 | Atividades | Lista **configurável** (seed + gestão) |
| 2 | Unique appointment | **Parcial** `WHERE status = confirmed` |
| 3 | Planos | `TRIAL` / `BASIC` / `PROFESSIONAL`; ao pagar, sai de `TRIAL` |
| 4 | Contato | **SMTP** (`CONTACT_EMAIL_TO`) |
| 5 | Auth | **Sessão Django** apenas na v1 |
| 6 | Trial ownership | **`accounts`** até Stripe; `billing` depois |
| 7 | `management_token` | **Em claro** + alta entropia (OTP/reset hasheados) |
| 8 | n8n appointment | Service → `BASE_N8N` **direto** (sem proxy) |
| 9 | Cron | HTTP agora; Celery se volume exigir |
| 10 | Testes | Unit nos apps; integração/e2e na raiz |
| 11 | E2E | **F1–F3**; F4 obrigatório em **integração** |
| 12 | Cobertura | **≥ 80% global** (único gate) |
| 13 | Email employee | `unique(user_id, email)` |
| 14 | Rotas painel | **Português** |
---

## 6. Qualidade, commits e entrega (amarrado)

### 6.1 Testes ([14-testes.md](./14-testes.md))

- Unitário (regras puras)  
- Integração (DB + views + mocks)  
- E2E (Playwright/Cypress) fluxos **F1–F3**  
- F4 (lembretes) em **integração** com mocks  
- **`pytest --cov-fail-under=80`** (global) no CI  

### 6.2 Conventional Commits ([15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md))

```
feat(scheduling): add employee blocked time validation
fix(accounts): enforce OTP cooldown
test(public): cover conflict on public booking
```

Commitlint obrigatório; `main` protegida; PR com CI verde.

### 6.3 CI/CD

PR: lint → types → migrations check → tests+coverage → security → commitlint  
CD: staging automático; produção por tag/release + migrate + healthcheck  

### 6.4 Segurança ([12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md))

Sessão Django + CSRF HTMX · ownership · rate limit · secrets · erros opacos · HMAC n8n · contato SMTP.
---

## 7. Configuração mínima ([10-configuracoes.md](./10-configuracoes.md))

```
DJANGO_SECRET_KEY
DATABASE_URL
PUBLIC_APP_URL
EMAIL_*/MAILTRAP_*
BASE_N8N + WEBHOOK_AUTH_TOKEN + WEBHOOK_SECRET
GLOBAL_N8N + GLOBAL_WEBHOOK_SECRET
CONTACT_EMAIL_TO
```

---

## 8. Ordem sugerida de implementação

1. Skeleton Django + settings + CI (lint/test vazio ≥ gate)  
2. `accounts` (auth/OTP/trial) + e2e login  
3. `organizations` (atividade/modelo/endereço/horários)  
4. `catalog` + `clients`  
5. `scheduling` core (disponibilidade + CRUD painel)  
6. `public_booking`  
7. `messaging` + cron + n8n  
8. `dashboard` polish + design system  
9. Migração de dados do legado  
10. Soft launch staging → produção  

A cada passo: testes + cobertura + docs atualizadas + commit conventional.

---

## 9. Definition of Done global da reescrita

A reescrita v1 só se considera concluída quando:

- [ ] Paridade funcional da seção 1 de [05-funcionalidades.md](./05-funcionalidades.md)
- [ ] Regras de [06-regras-de-negocio.md](./06-regras-de-negocio.md) cobertas por testes
- [ ] Cobertura ≥ 80% **global** no CI
- [ ] E2E **F1–F3** passando; **F4** com integração passando
- [ ] Webhooks n8n (envio direto) validados em staging
- [ ] CD com migrate + healthcheck
- [ ] Conventional Commits + branch protection
- [ ] Este índice e docs filhas revisados

---

## 10. Como usar este pacote `.docs`

1. Comece por **01 → 02 → 04 → 06** (contexto, arquitetura, dados, regras)  
2. Implemente olhando **07 / 11 / 12 / 13**  
3. Antes de cada PR, valide **14 / 15 / 16**  
4. Qualquer mudança de regra: edite o arquivo específico **e** atualize a data neste mestre  

---

## 11. Contratos e referências

| Artefato | Uso |
|---|---|
| `prisma/schema.prisma` (legado) | Fonte do modelo a portar |
| `public/` (legado) | **Imagens** — reutilizar (não gerar novos assets) |
| `utils/*.ts` (legado) | Utilitários **já testados** (CPF, CNPJ, phone, CEP, timezone SP) → portar p/ Python |
| [WEBHOOK_PAYLOAD.md](./WEBHOOK_PAYLOAD.md) | Payload BASE_N8N |
| [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md) | Payload GLOBAL_N8N |
| [10-configuracoes.md](./10-configuracoes.md) | Env vars (única fonte) |
| [03-estrutura.md](./03-estrutura.md) §7 | Mapa de reuso `public/` + `utils/` |
| `.cursor/rules/*` | Critérios de qualidade a portar |

---

**Fim do documento mestre.**  
Dúvidas de detalhe → abrir o arquivo numerado correspondente na tabela da seção 2.
