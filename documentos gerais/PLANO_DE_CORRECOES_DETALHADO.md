# Agenda System — Detalhamento Técnico de Correções e Melhorias

> **Versão:** 0.9.0 | **Atualizado:** 16/02/2026 | **Autor:** Henrique Ferraz
> **Resumo:** [PLANO_DE_CORRECOES.md](./PLANO_DE_CORRECOES.md)

Este documento contém o detalhamento técnico completo de todas as **24 funcionalidades pendentes** do plano. Itens concluídos são removidos deste documento conforme implementados.

### Modelo de Negócio: Plano Ilimitado + Add-ons

| Componente | Qtd | Features |
|---|:---:|---|
| **Plano Ilimitado** (R$75/mês) | 8 | F-03, F-07, F-08, F-09, AC-05, AC-07, AC-08, AC-09 |
| **Add-ons avulsos** (~R$19,90/mês cada) | 17 | AC-02, AC-02+, AC-03, AC-06, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, F-04, F-05, F-06, API |

---

## Índice

1. [Funcionalidades Core — v1.0](#1-funcionalidades-core--v10)
2. [Pagamentos Multi-Gateway — v1.1](#2-pagamentos-multi-gateway--v11)
3. [Mobilidade e Ferramentas — v1.1](#3-mobilidade-e-ferramentas--v11)
4. [Integrações e Produtividade — v1.2](#4-integrações-e-produtividade--v12)
5. [Engajamento e Retenção — v1.3](#5-engajamento-e-retenção--v13)
6. [Expansão — v2.0](#6-expansão--v20)
7. [Avançado — v3.0](#7-avançado--v30)
8. [Análise Detalhada de Concorrentes](#8-análise-detalhada-de-concorrentes)
9. [Checklist de Verificação Final](#9-checklist-de-verificação-final)

---

## 1. Funcionalidades Core — v1.0

> **Ordem de implementação:** Infraestrutura global → F-08 (managementToken) → F-03 (lembretes com link) → F-07 → F-09
> **Implementado:** F-01 (Validação de conflito de horários — sobreposição de funcionário e cliente)
> **Implementado:** F-02 (Gestão de agendamentos pelo profissional — editar/cancelar/reagendar + core + AppointmentHistory + UI)
> **Rota global:** F-03, F-07 e F-08 usam a nova rota global de mensagens (`GLOBAL_N8N`) — ver [GLOBAL_MESSAGING.md](./GLOBAL_MESSAGING.md)
> **Segurança:** Payload assinado com HMAC-SHA256 via `GLOBAL_WEBHOOK_SECRET` (header `x-global-signature`) — módulo `lib/global-webhook-hmac.ts`

### Relação entre F-02, F-07 e F-08

Essas três funcionalidades compartilham um **core de lógica** mas possuem atores, interfaces e fluxos distintos:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE COMPARTILHADO (criado por F-02)          │
│  Cancelar agendamento · Reagendar horário · Liberar vaga        │
│  Validar prazo mínimo · Atualizar status · Registrar histórico  │
└──────────┬──────────────────┬──────────────────┬────────────────┘
           │                  │                  │
     ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
     │   F-02    │     │   F-07    │     │   F-08    │
     │ PROFIS-   │     │ PROFIS-   │     │ CLIENTE   │
     │ SIONAL    │     │ SIONAL    │     │           │
     │ edita     │     │ notifica  │     │ autogestão│
     └───────────┘     └───────────┘     └───────────┘
```

| Aspecto | F-02 — Profissional | F-07 — Profissional notifica | F-08 — Cliente autogestão |
|---|---|---|---|
| **Quem age** | Profissional (admin) | Profissional (admin) | Cliente (público) |
| **Interface** | Painel administrativo | Painel administrativo | Página pública via link/token |
| **Autenticação** | JWT (sessão) | JWT (sessão) | Token único do agendamento |
| **Ação principal** | Edita, cancela ou reagenda diretamente | Envia mensagem WhatsApp individual ou em massa | Informa que não pode ir, cancela ou reagenda |
| **Quem é notificado** | Cliente (via n8n) | Clientes (via n8n WhatsApp) | Profissional (via n8n) |
| **Caso de uso** | Profissional ajusta a agenda no dia a dia | Profissional ficou doente e precisa avisar todos os clientes | Cliente não pode comparecer e avisa antecipadamente |

**Dependências técnicas:**
- F-02 criou o core de cancelamento/reagendamento (server actions, validações, notificações) — **IMPLEMENTADO**
- F-07 reutiliza o core e adiciona a camada de comunicação em massa via n8n
- F-08 reutiliza o core e adiciona a camada pública (link/token) com notificação ao profissional

---

### F-07: Mensagens WhatsApp do Profissional para Clientes (via Rota Global)

- **Plano:** Ilimitado (R$75/mês)
- **Depende de:** — (core F-02 já implementado)
- **Presente em:** Parcial em 2/6 concorrentes (Simples Agenda parcial, SimplyBook.me)
- **Justificativa incluso:** Comunicação ativa com clientes é essencial para o dia a dia do profissional. Avisos de ausência, promoções e interação direta.
- **Rota N8N:** `GLOBAL_N8N` (rota global de mensagens — ver [GLOBAL_MESSAGING.md](./GLOBAL_MESSAGING.md))
- **Segurança:** HMAC-SHA256 via `GLOBAL_WEBHOOK_SECRET` (header `x-global-signature`)
- **Descrição:** O profissional pode enviar mensagens via WhatsApp para seus clientes cadastrados, utilizando a **nova rota global de mensagens** do n8n. Funciona como **comunicação ativa do profissional** — ele toma a iniciativa de avisar os clientes.

#### Modos de envio

| Modo | Descrição |
|---|---|
| **Individual** | Enviar mensagem para um cliente específico |
| **Em massa** | Enviar mensagem para todos os clientes com agendamento em um período |
| **Cancelamento em lote** | Profissional informa indisponibilidade (ex: doença) e notifica todos os clientes afetados |

#### Fluxo principal (exemplo: profissional ficou doente)

1. Profissional acessa painel → seleciona período de indisponibilidade (ex: "16/02 a 18/02")
2. Sistema lista todos os agendamentos afetados no período
3. Profissional visualiza lista de clientes e agendamentos afetados
4. Profissional escolhe ação para os agendamentos: cancelar todos ou oferecer reagendamento
5. Profissional pode personalizar a mensagem (template editável)
6. Profissional confirma envio de notificação
7. Next.js envia payload ao webhook n8n com dados dos clientes e agendamentos
8. n8n dispara mensagem WhatsApp para cada cliente com botões interativos:
   - **Cancelar** — cancela o agendamento
   - **Reagendar** — oferece próximos horários disponíveis
9. Resposta do cliente retorna via webhook n8n → Next.js chama `cancelAppointmentCore` ou `rescheduleAppointmentCore` do F-02

#### Fluxo individual (mensagem avulsa)

1. Profissional acessa detalhes de um agendamento
2. Clica em "Enviar mensagem via WhatsApp"
3. Seleciona template ou escreve mensagem customizada
4. Next.js envia payload ao webhook n8n
5. n8n dispara mensagem WhatsApp para o cliente

#### Abordagem técnica

- **Server Actions:**
  - `send-whatsapp-message.ts` — envia mensagem individual via webhook n8n
  - `send-bulk-whatsapp.ts` — envia mensagem em massa para clientes de um período
  - `notify-unavailability.ts` — fluxo completo de indisponibilidade (listar afetados + enviar + cancelar/reagendar)
- **Modelo Prisma:** Tabela `MessageLog` para rastrear mensagens enviadas (quem, quando, tipo, status)
- **Templates de mensagem:** Templates pré-configurados editáveis (cancelamento, reagendamento, aviso genérico)
- **UI no painel:**
  - Botão "Informar indisponibilidade" no calendário
  - Modal com seleção de período, lista de afetados, preview da mensagem
  - Botão "Enviar WhatsApp" na visualização de agendamento individual
  - Página de histórico de mensagens enviadas
- **Webhook n8n:**
  - Payload tipado: `{ type: 'individual' | 'bulk' | 'unavailability', recipients: [...], message: string, appointmentIds: [...] }`
  - Resposta do n8n com status por destinatário

#### Mensagens globais vinculadas (rota global)

| type | Uso |
|---|---|
| `custom_individual` | Mensagem livre para um cliente |
| `custom_bulk` | Mensagem livre para múltiplos clientes |
| `unavailability` | Aviso de indisponibilidade + cancelamento em lote |
| `business_update` | Alteração de horário de funcionamento |
| `holiday_notice` | Aviso de feriado/folga |
| `new_service` | Divulgação de novo serviço disponível |
| `new_employee` | Apresentação de novo profissional |

---

### F-08: Autogestão do Cliente — Cancelar / Reagendar (via Rota Global)

- **Plano:** Ilimitado (R$75/mês)
- **Depende de:** — (core F-02 já implementado)
- **Presente em:** 5/6 concorrentes (funcionalidade comum, mas geralmente requer login)
- **Justificativa incluso:** Table stakes — 5/6 concorrentes oferecem. Nosso diferencial: sem login, via link público + WhatsApp interativo (superior aos concorrentes que exigem login).
- **Rota N8N:** `GLOBAL_N8N` (rota global de mensagens — ver [GLOBAL_MESSAGING.md](./GLOBAL_MESSAGING.md))
- **Segurança:** HMAC-SHA256 via `GLOBAL_WEBHOOK_SECRET` (header `x-global-signature`)
- **Descrição:** O cliente (pessoa que agendou) pode, **por iniciativa própria**, informar que não poderá comparecer e escolher entre cancelar ou reagendar. Não requer login — acesso via link público com token único. O profissional é notificado automaticamente via **rota global de mensagens**.

#### Canais de acesso

| Canal | Descrição |
|---|---|
| **Página pública** | Link único enviado na confirmação do agendamento (WhatsApp/Email) — ex: `/agendamento/gerenciar/{appointmentToken}` |
| **WhatsApp interativo** | Cliente responde diretamente à mensagem de confirmação/lembrete com opção de cancelar/reagendar |

#### Fluxo principal (exemplo: cliente não pode ir)

1. Cliente recebe confirmação do agendamento com link de gerenciamento (na confirmação original por WhatsApp/Email)
2. Cliente acessa o link único: `/agendamento/gerenciar/{appointmentToken}`
3. Página exibe detalhes do agendamento (data, hora, serviço, profissional, endereço)
4. Cliente escolhe uma ação:
   - **Cancelar** — exibe modal de confirmação com campo de motivo (opcional) → confirma
   - **Reagendar** — exibe calendário com próximos horários disponíveis → seleciona novo horário → confirma
5. Sistema valida o prazo mínimo configurável
6. Sistema chama `cancelAppointmentCore` ou `rescheduleAppointmentCore` do F-02
7. Sistema registra no `AppointmentHistory` (ação feita pelo cliente)
8. Next.js envia payload ao webhook n8n
9. n8n notifica o profissional via WhatsApp/Email sobre a alteração feita pelo cliente
10. Cliente recebe confirmação na tela (cancelamento ou novo horário confirmado)
11. Se reagendamento: cliente recebe nova confirmação via WhatsApp/Email com o novo horário

#### Regras de negócio

- Cancelamento/reagendamento só é permitido até **X horas antes** do horário (configurável pelo profissional em `/dashboard/configurations`)
- Token do link é gerado na criação do agendamento e vinculado ao `appointmentId`
- Token expira após o horário do agendamento passar
- Token é invalidado após cancelamento (não pode usar duas vezes)
- Profissional recebe notificação **imediata** de qualquer alteração
- Horário cancelado volta a ficar disponível para outros clientes
- Reagendamento respeita a validação de conflitos (F-01)
- Cliente só pode reagendar para horários futuros dentro da mesma empresa

#### Abordagem técnica

- **Modelo Prisma:** Adicionar campo `managementToken` (String, unique) no modelo `Appointment`
- **Rota pública:** `app/(public)/agendamento/gerenciar/[token]/page.tsx` — Server Component que busca o agendamento pelo token
- **Server Actions (públicas, sem JWT):**
  - `cancel-appointment-public.ts` — valida token + prazo → chama `cancelAppointmentCore` → notifica profissional via n8n
  - `reschedule-appointment-public.ts` — valida token + prazo → busca horários disponíveis → chama `rescheduleAppointmentCore` → notifica profissional via n8n
- **Segurança:**
  - Token gerado com `crypto.randomBytes(32).toString('hex')`
  - Rate limit na rota pública (evitar brute force de tokens)
  - Validar que o token pertence a um agendamento futuro e não cancelado
- **UI:**
  - Página responsiva (mobile-first) com detalhes do agendamento
  - Botões "Cancelar" e "Reagendar" com touch target mínimo de 44x44px
  - Modal de confirmação antes de qualquer ação
  - Seletor de horários disponíveis (reutilizar componente `TimeGrid`)
  - Feedback visual claro (sucesso/erro)

#### Mensagens globais vinculadas (rota global)

| type | Uso |
|---|---|
| `client_cancelled` | Notifica profissional quando cliente cancela |
| `client_rescheduled` | Notifica profissional quando cliente reagenda |
| `management_link` | Envia link de gerenciamento ao cliente |

#### Integração com confirmação existente

O link de gerenciamento deve ser incluído na mensagem de confirmação que **já existe** (WhatsApp + Email):
- Atualizar template de confirmação no n8n para incluir: "Precisa cancelar ou reagendar? Acesse: {managementLink}"
- Atualizar template de lembrete (F-03) para incluir o mesmo link

---

### F-03: Lembretes Automáticos Pré-Agendamento (via Rota Global)

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 5/6 concorrentes
- **Justificativa incluso:** Table stakes — todo concorrente sério oferece. Simples Agenda afirma reduzir faltas em 50%.
- **Impacto:** Redução de até 50% em faltas (dado do Simples Agenda)
- **Implementação:** N8N cron → **Next.js API** `/api/cron/reminders` → `sendGlobalMessage()` → N8N envia WhatsApp/Email
- **Rota N8N:** `GLOBAL_N8N` (rota global de mensagens — ver [GLOBAL_MESSAGING.md](./GLOBAL_MESSAGING.md))
- **Segurança:** HMAC-SHA256 via `GLOBAL_WEBHOOK_SECRET` (header `x-global-signature`)
- **Depende de:** F-08 (`managementToken` para incluir link de cancelar/reagendar nos lembretes)
- **Status atual:**
  - ✅ Confirmação instantânea via WhatsApp (N8N) — já funciona
  - ✅ Confirmação instantânea via Email (SMTP) — já funciona
  - ❌ Lembretes 7d, 24h e 2h antes — NÃO implementado

#### Intervalos de lembrete

| type | Quando | Mensagem inclui |
|---|---|---|
| `reminder_7d` | 7 dias antes | Dados do agendamento + link cancelar/reagendar |
| `reminder_24h` | 24 horas antes | Dados do agendamento + endereço + link cancelar/reagendar |
| `reminder_2h` | 2 horas antes | Dados do agendamento + endereço + link cancelar/reagendar |

#### Arquitetura (N8N cron → Next.js → Rota Global)

```
┌──────────────┐   HTTP POST    ┌──────────────────────────────┐
│  N8N (cron)  │ ────────────► │  /api/cron/reminders          │
│  cada 5 min  │  x-webhook-   │  (Next.js API Route)          │
└──────────────┘  auth header   │                                │
                                │  1. Valida x-webhook-auth      │
                                │  2. Busca agendamentos (Prisma)│
                                │     - 7d, 24h, 2h antes        │
                                │  3. Filtra não enviados         │
                                │     (ReminderLog)               │
                                │  4. Monta mensagem com          │
                                │     managementLink (F-08)       │
                                │  5. sendGlobalMessage() p/ cada │
                                │  6. Registra no ReminderLog     │
                                └──────────────┬───────────────────┘
                                               │
                                  POST (rota global)
                                               │
                                               ▼
                                ┌──────────────────────────────┐
                                │  N8N (Global Webhook)        │
                                │  Envia WhatsApp/Email        │
                                └──────────────────────────────┘
```

**Vantagens sobre a abordagem 100% N8N:**
- Prisma tipado (vs SQL cru no N8N)
- `managementLink` acessível naturalmente via `managementToken`
- Controle de duplicatas via `ReminderLog` (confiável vs janela de tempo)
- Código versionado, testado e revisável
- Mudanças no schema são capturadas pelo TypeScript

#### Modelo Prisma — `ReminderLog`

```prisma
model ReminderLog {
  id            String   @id @default(cuid())
  appointmentId String
  type          String   // 'reminder_7d' | 'reminder_24h' | 'reminder_2h'
  channel       String   // 'whatsapp' | 'email' | 'both'
  status        String   // 'sent' | 'failed'
  sentAt        DateTime @default(now())

  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@unique([appointmentId, type])
  @@index([appointmentId])
}
```

#### Abordagem técnica

- **API Route:** `app/api/cron/reminders/route.ts`
  - Autenticada via `x-webhook-auth` (mesmo token da rota existente)
  - Busca agendamentos confirmados via Prisma com filtro `reminderLogs: { none: { type } }`
  - Monta mensagem incluindo `managementLink` (se `managementToken` existir)
  - Envia via `sendGlobalMessage()` (rota global)
  - Registra no `ReminderLog` para evitar duplicatas
- **N8N:** Schedule Trigger a cada 5 minutos → HTTP POST para `/api/cron/reminders`
- **Segurança:** Header `x-webhook-auth` obrigatório; rate limit na API route

#### Fluxo completo

```
N8N Schedule Trigger (5 min)
  → POST /api/cron/reminders (x-webhook-auth)
  → Prisma: buscar agendamentos confirmados daqui a 7d (sem ReminderLog tipo reminder_7d)
  → Para cada: sendGlobalMessage({ type: 'reminder_7d' }) + criar ReminderLog
  → Prisma: buscar agendamentos confirmados daqui a 24h (sem ReminderLog tipo reminder_24h)
  → Para cada: sendGlobalMessage({ type: 'reminder_24h' }) + criar ReminderLog
  → Prisma: buscar agendamentos confirmados daqui a 2h (sem ReminderLog tipo reminder_2h)
  → Para cada: sendGlobalMessage({ type: 'reminder_2h' }) + criar ReminderLog
  → Retorna { sent: N }
```

---

### F-09: Trial de 30 Dias (Acesso Total Gratuito)

- **Plano:** Ilimitado (R$75/mês) — infraestrutura obrigatória para o modelo de negócio
- **Presente em:** 4/6 concorrentes (Reservio 40 agend/mês, SimplyBook.me 50 bookings, Agenda Serviço trial limitado, Clínica Experts trial)
- **Justificativa incluso:** Essencial para conversão. Usuário experimenta o sistema completo antes de decidir pagar. Reduz barreira de entrada.
- **Descrição:** Novos usuários ganham 30 dias de acesso total (plano ilimitado + todos os add-ons) sem precisar cadastrar cartão. Após o trial, o acesso é bloqueado até contratar o plano.

#### Fluxo principal

1. Usuário cria conta (registro já existente)
2. Sistema define `trialEndsAt` = data atual + 30 dias
3. Durante o trial: acesso total a todas as funcionalidades e add-ons
4. **7 dias antes do vencimento:** Notificação via email/WhatsApp (n8n) informando que o trial expira em breve
5. **1 dia antes do vencimento:** Lembrete final com link para contratar o plano
6. **No dia do vencimento:** Acesso bloqueado — exibe tela de conversão com opções de plano e add-ons
7. Usuário contrata plano → acesso restaurado imediatamente

#### Regras de negócio

- Trial de **30 dias corridos** a partir da data de criação da conta
- Acesso a **todas** as funcionalidades durante o trial (plano ilimitado + todos os add-ons)
- **Não requer** cadastro de cartão de crédito para iniciar o trial
- Após expirar: dados permanecem no banco (não são deletados), mas o acesso ao painel é bloqueado
- Tela de bloqueio mostra: resumo do que foi usado no trial (agendamentos criados, clientes cadastrados) + CTA para contratar
- Um email/telefone = um trial (impedir criação de múltiplas contas para estender trial)
- Admin pode estender trial manualmente (caso comercial)

#### Abordagem técnica

- **Modelo Prisma:** Adicionar campos no modelo `User`:
  - `trialEndsAt` (DateTime?) — data de expiração do trial (null = sem trial / conta paga)
  - `subscriptionStatus` (enum: `trial`, `active`, `expired`, `cancelled`) — status atual
- **Middleware de verificação:**
  - Verificar `subscriptionStatus` em todas as rotas do painel `/dashboard/*`
  - Se `trial` e `trialEndsAt < now`: redirecionar para página de conversão
  - Se `expired`: redirecionar para página de conversão
  - Se `active`: acesso normal
- **Página de conversão:** `/dashboard/upgrade`
  - Exibe resumo do uso durante o trial (agendamentos, clientes, serviços cadastrados)
  - Mostra plano ilimitado (R$75/mês) + add-ons disponíveis
  - Botão de contratar (integra com AC-02 quando disponível, ou link externo inicialmente)
- **Notificações (via n8n):**
  - Cron job diário verificando trials que vencem em 7 dias e 1 dia
  - Webhook n8n com payload: `{ type: 'trial_expiring', daysLeft: 7|1, user: {...} }`
  - Email/WhatsApp com CTA para contratar
- **Registro:**
  - Atualizar server action de registro (`/api/auth/register`) para definir `trialEndsAt = now + 30 dias` e `subscriptionStatus = 'trial'`
- **Dashboard:**
  - Banner discreto no topo do painel mostrando dias restantes do trial: "Seu trial expira em X dias"
  - Contador regressivo nos últimos 7 dias
- **Segurança:**
  - Validar unicidade de email (já existe)
  - Rate limit no registro (já existe)
  - Não permitir alterar `trialEndsAt` via client-side

#### Tela de bloqueio (após expiração)

```
┌─────────────────────────────────────────────┐
│  Seu período de teste expirou               │
│                                             │
│  Durante os 30 dias você:                   │
│  ✅ Criou 47 agendamentos                   │
│  ✅ Cadastrou 23 clientes                   │
│  ✅ Configurou 5 serviços                   │
│                                             │
│  Seus dados estão seguros e aguardando.     │
│  Contrate o plano para continuar.           │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Plano Ilimitado — R$75/mês        │    │
│  │  [Contratar agora]                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  + Veja os add-ons disponíveis              │
└─────────────────────────────────────────────┘
```

---

## 2. Pagamentos Multi-Gateway — v1.1

### AC-02: Pagamento Online Integrado

- **Plano:** Add-on R$29,90/mês (Stripe + Mercado Pago) + Add-on R$19,90/mês (4 gateways adicionais)
- **Presente em:** 5/6 concorrentes
- **Justificativa add-on:** Todos os concorrentes cobram pagamento online em planos pagos. Alto custo de integração e manutenção.
- **Schema atual:** Já tem modelo `Subscription` com `stripeCustomerId` e `stripePriceId`
- **Objetivo:** Aceitar pagamento no momento do agendamento (PIX, cartão, boleto) com 6 gateways

#### Gateways Planejados

| # | Gateway | Métodos | Diferencial | Fase |
|:---:|---|---|---|:---:|
| 1 | **Stripe** | Cartão, PIX (Payment Element), Apple Pay, Google Pay | Padrão internacional, maior ecossistema de APIs, Checkout pronto | 2 |
| 2 | **Mercado Pago** | PIX, cartão, boleto, saldo MP | Maior adoção no Brasil, PIX instantâneo, SDK robusto | 2 |
| 3 | **Asaas** | PIX, boleto, cartão, link de pagamento | Focado em recorrência e cobranças, popular entre MEIs/PMEs | 3 |
| 4 | **PagSeguro** | PIX, cartão, boleto, débito online | Grande base no Brasil, checkout transparente | 3 |
| 5 | **InfinitePay** | PIX, cartão (maquininha + online), link de pagamento | Taxas competitivas, recebimento na hora | 4 |
| 6 | **Banco Cora** | PIX, boleto, transferência, gestão de cobranças | Conta PJ gratuita, emissão de boleto sem custo, API moderna | 4 |

#### Fases de Implementação

**Fase 1 — Arquitetura Multi-Gateway:**
- Interface abstrata `PaymentProvider` em `lib/payments/provider.ts`:
  - `createPayment(amount, metadata)` → retorna URL ou dados de pagamento
  - `handleWebhook(payload, headers)` → processa callback
  - `refund(transactionId)` → processa reembolso
  - `getStatus(transactionId)` → consulta status
- Cada gateway implementa a interface em arquivo próprio: `stripe.ts`, `mercado-pago.ts`, `asaas.ts`, `pagseguro.ts`, `infinitepay.ts`, `cora.ts`
- Factory function: `getPaymentProvider(gateway: string): PaymentProvider`
- Modelo `Payment` no Prisma: id, appointmentId, userId, amount, gateway, status (pending/paid/failed/refunded), transactionId, paidAt
- Modelo `PaymentConfig` por empresa: userId, gateway, apiKey (criptografada), secretKey (criptografada), isActive, webhookSecret
- Página `/dashboard/configurations/payments` para configurar gateway preferido e credenciais

**Fase 2 — Stripe + Mercado Pago:**
- Stripe Checkout Session para cartão + PIX internacional
- Mercado Pago Checkout Pro para PIX instantâneo + cartão nacional
- Webhook routes: `/api/webhook/payment/stripe`, `/api/webhook/payment/mercadopago`
- Atualização de `Payment.status` via webhook → atualização de `Appointment` status
- No agendamento público: botão "Pagar" após confirmar agendamento (obrigatório ou opcional por serviço)

**Fase 3 — Asaas + PagSeguro:**
- Asaas API v3 para boleto + PIX + cobrança recorrente
- PagSeguro Checkout Transparente para cartão + PIX + boleto
- Webhook routes correspondentes

**Fase 4 — InfinitePay + Banco Cora:**
- InfinitePay API para link de pagamento + PIX
- Banco Cora API para boleto + PIX + gestão de cobranças

**Fase 5 — Funcionalidades Transversais:**
- Depósito/sinal configurável por serviço (% ou valor fixo)
- Relatório de pagamentos unificado no dashboard (todos os gateways)
- Conciliação automática: webhook → atualiza status do pagamento → atualiza status do agendamento
- Reembolso automático em caso de cancelamento (quando suportado pelo gateway)
- Nota fiscal integrada (NF-e/NFC-e) — versão futura

#### Mensagens globais vinculadas (rota global)

| type | Uso |
|---|---|
| `payment_confirmed` | Confirmação de pagamento ao cliente (PIX, cartão, boleto) |
| `payment_reminder` | Lembrete de pagamento pendente (ex: boleto próximo do vencimento) |

---

## 3. Mobilidade e Ferramentas — v1.1

### AC-05: PWA (Progressive Web App)

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 4/6 concorrentes (Clínica Experts, Simples Agenda, Reservio, SimplyBook.me)
- **Justificativa incluso:** Acesso mobile é expectativa mínima em 2026. Alternativa viável a app nativo sem custo de stores.
- **Descrição:** Transformar o sistema em PWA para acesso mobile sem publicação em stores.
- **Abordagem:**
  - **Fase 1:** `manifest.json` com ícones, nome, cores + service worker básico para cache de assets estáticos
  - **Fase 2:** Notificações push via Web Push API (novo agendamento, lembrete, cancelamento)
  - **Fase 3:** Modo offline com cache da agenda do dia atual (service worker + IndexedDB)
- **Vantagem:** Não requer conta de desenvolvedor Apple/Google, instalação instantânea via navegador

### AC-07: QR Code para Agendamento

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 3/6 concorrentes (Reservio, SimplyBook.me, Agenda Serviço)
- **Justificativa incluso:** Baixo custo de implementação, alto valor percebido. Feature "wow" para marketing (cartões de visita, balcão).
- **Descrição:** Gerar QR code que aponta para a página pública de agendamento (`/agendamento/[token]`).
- **Abordagem:**
  - Usar lib `qrcode` (npm) para gerar QR code no servidor
  - Exibir no dashboard (card) e em `/dashboard/configurations`
  - Opção de download em PNG (para digital) e SVG (para impressão)
  - Personalização: incluir logo no centro do QR code (opcional)

### AC-08: Exportação de Dados (CSV/PDF)

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 2/6 concorrentes (Simples Agenda, Agenda Serviço)
- **Justificativa incluso:** Feature operacional básica. Profissionais precisam extrair dados para contabilidade. Custo de implementação baixo.
- **Descrição:** Exportar agendamentos, lista de clientes e relatórios.
- **Abordagem:**
  - Botão "Exportar" nas listagens de agendamentos e clientes
  - **CSV:** usar `papaparse` para gerar dados tabulares (agendamento, data, horário, cliente, serviço, funcionário, status)
  - **PDF:** usar `jspdf` ou `@react-pdf/renderer` para relatórios formatados com cabeçalho, filtros aplicados e totais
  - Filtros: período (data início/fim), serviço, funcionário, status
  - Server action que gera o arquivo e retorna como download

---

## 4. Integrações e Produtividade — v1.2

### AC-03: Sincronização com Google Calendar

- **Plano:** Add-on R$14,90/mês
- **Presente em:** 3/6 concorrentes (Reservio, SimplyBook.me, Agenda Serviço)
- **Justificativa add-on:** Sempre em planos premium nos concorrentes. Alta demanda de profissionais que usam Google Calendar.
- **Descrição:** Sync bidirecional com Google Calendar para evitar conflitos de agenda pessoal/profissional.
- **Abordagem:**
  - Integração via Google Calendar API v3 com OAuth 2.0
  - Sync bidirecional: agendamentos do Agenda aparecem no Google Calendar e eventos do Google bloqueiam horários no Agenda
  - Configuração por funcionário (cada um conecta sua conta Google)
  - Opção de sync apenas leitura (ver Google no Agenda) ou completo (criar eventos no Google)
  - Webhook do Google Calendar para eventos em tempo real (ou polling a cada 5 minutos)

### AC-10: Agendamentos Recorrentes

- **Plano:** Add-on R$14,90/mês
- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Justificativa add-on:** Feature avançada que economiza tempo. Reservio e SimplyBook.me cobram em planos premium.
- **Descrição:** Agendar compromissos que se repetem automaticamente.
- **Abordagem:**
  - Adicionar campos no modelo `Appointment`:
    - `recurrence`: enum (none, weekly, biweekly, monthly)
    - `recurrenceEndDate`: DateTime opcional
    - `recurrenceGroupId`: String (UUID) para agrupar série
  - Ao criar recorrente: gerar todos os agendamentos futuros até `recurrenceEndDate`
  - Cancelamento: opção "apenas este" ou "este e todos os seguintes"
  - Validação de conflitos para cada ocorrência

### AC-11: Permissões por Profissional

- **Plano:** Add-on R$19,90/mês
- **Presente em:** 4/6 concorrentes
- **Justificativa add-on:** Essencial para equipes maiores. Sempre em planos empresariais nos concorrentes.
- **Descrição:** Cada funcionário com login próprio e permissões limitadas.
- **Abordagem:**
  - Adicionar campo `role` no modelo `Employee`: admin, manager, employee
  - Criar fluxo de login separado para funcionários (email + senha)
  - Middleware de autorização por rota e server action
  - Permissões por role:
    - **employee:** ver apenas sua agenda, criar agendamentos para si
    - **manager:** ver todas as agendas, editar agendamentos, ver relatórios
    - **admin:** acesso total (configurações, financeiro, exclusões)
  - Página `/dashboard/configurations/permissions` para configurar

### F-04: Integração Taxidog

- **Plano:** Add-on R$19,90/mês
- **Presente em:** 0/6 concorrentes
- **Justificativa add-on:** Nicho específico (pet shops). Cobrado avulso conforme necessidade.
- **Descrição:** Transporte de pets como serviço complementar (pet shops e clínicas veterinárias).
- **Abordagem:**
  - Opção "Taxidog" como serviço adicional selecionável no agendamento
  - Campos: endereço de busca, horário preferido, observações (porte, nome do pet)
  - Notificação ao motorista via webhook/WhatsApp (N8N)
  - Configuração em `/dashboard/configurations/taxidog` (habilitar/desabilitar, motoristas cadastrados)

---

## 5. Engajamento e Retenção — v1.3

### AC-09: Avaliações e Feedback

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Justificativa incluso:** Reputação online e melhoria contínua do serviço. Essencial para crescimento do profissional.
- **Abordagem:**
  - Modelo `Review` no Prisma: id, appointmentId, rating (1-5), comment, createdAt
  - Email automático 24h após o atendimento com link para avaliar
  - Página pública: `/avaliar/[reviewToken]` com formulário simples (estrelas + comentário)
  - Exibição na página de agendamento público: média de estrelas e últimos depoimentos
  - Dashboard: métricas de satisfação por funcionário e serviço

#### Mensagens globais vinculadas (rota global)

| type | Uso |
|---|---|
| `feedback_request` | Solicita avaliação ao cliente após atendimento |
| `post_appointment` | Agradecimento e follow-up pós-atendimento |

> `post_appointment` e `feedback_request` podem ser combinados: agradecimento + link de avaliação na mesma mensagem.

#### Mensagens globais de engajamento geral (sem funcionalidade vinculada)

| type | Uso |
|---|---|
| `reengagement` | Mensagem para clientes inativos (X dias sem agendar) |
| `birthday` | Mensagem de aniversário do cliente |

> Essas mensagens seguem o padrão: N8N cron → Next.js API → `sendGlobalMessage()` → N8N envia. Implementação similar ao F-03 (lembretes).

### AC-13: Cupons e Promoções

- **Plano:** Add-on R$14,90/mês
- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Justificativa add-on:** Feature de marketing. Agrega valor mas não é essencial. Sempre premium nos concorrentes.
- **Abordagem:**
  - Modelo `Coupon`: id, code, discountType (percent/fixed), discountValue, validUntil, maxUses, currentUses, isActive
  - Aplicação no agendamento público: campo "Cupom" no checkout
  - Validação: expiração, limite de uso, valor mínimo
  - Dashboard: listagem de cupons com métricas (usos, receita gerada)

#### Mensagens globais vinculadas (rota global)

| type | Uso |
|---|---|
| `coupon` | Envia cupom personalizado ao cliente |
| `promotion` | Divulga promoção/desconto para clientes |
| `seasonal` | Campanha sazonal (Dia das Mães, Natal, Black Friday, etc.) |

### AC-14: Programa de Fidelidade

- **Plano:** Add-on R$19,90/mês
- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Justificativa add-on:** Feature avançada de retenção. Reservio e SimplyBook.me cobram em planos premium.
- **Abordagem:**
  - Modelo `LoyaltyPoints`: id, clientEmail, points, history (JSON com transações)
  - Regras configuráveis: X pontos por agendamento (configurável por serviço)
  - Resgate: desconto ou serviço gratuito ao atingir Y pontos
  - Painel do cliente (via link no email) para visualizar saldo e histórico

#### Mensagens globais vinculadas (rota global)

| type | Uso |
|---|---|
| `loyalty_reward` | Notifica cliente que atingiu recompensa de fidelidade |

### AC-16: Lista de Espera

- **Plano:** Add-on R$14,90/mês
- **Presente em:** 1/6 concorrentes (SimplyBook.me)
- **Justificativa add-on:** Diferencial competitivo (só SimplyBook.me tem). Gera receita extra ao preencher cancelamentos.
- **Abordagem:**
  - Modelo `Waitlist`: id, clientName, clientEmail, clientPhone, serviceId, preferredDate, status (waiting/notified/booked/expired)
  - Quando um agendamento é cancelado: verificar waitlist para mesma data/serviço
  - Notificar primeiro da fila via email + WhatsApp (N8N)
  - Expiração automática após 48h sem resposta → notificar próximo

#### Mensagens globais vinculadas (rota global)

| type | Uso |
|---|---|
| `waitlist_available` | Notifica cliente da lista de espera quando uma vaga abre |

---

## 6. Expansão — v2.0

### AC-06: Gestão Financeira

- **Plano:** Add-on R$29,90/mês
- **Presente em:** 2/6 concorrentes (Clínica Experts, Simples Agenda)
- **Justificativa add-on:** Feature complexa. Clínica Experts e Simples Agenda cobram caro por isso.
- **Abordagem por fases:**
  - **Fase 1:** Relatório de receita por período (baseado em preço dos serviços agendados)
  - **Fase 2:** Fluxo de caixa simples (entradas automáticas dos agendamentos + saídas manuais)
  - **Fase 3:** Comissões por funcionário (% configurável por serviço, cálculo automático)
  - **Fase 4:** Dashboard financeiro com gráficos (receita mensal, comparativo, top serviços)

### AC-12: Múltiplas Localizações

- **Plano:** Add-on R$24,90/mês
- **Presente em:** 3/6 concorrentes (Clínica Experts, Reservio, SimplyBook.me)
- **Justificativa add-on:** Sempre enterprise. Clínica Experts, Reservio e SimplyBook.me cobram em planos premium.
- **Abordagem:**
  - Modelo `Location`: id, userId, name, address, phone, workingHours (JSON)
  - Funcionários vinculados a uma ou mais localizações
  - Agendamento público: seleção de localização antes de escolher serviço
  - Dashboard com filtro por localização

### F-06: Venda de Produtos

- **Plano:** Add-on R$24,90/mês
- **Presente em:** 2/6 concorrentes (Clínica Experts, Simples Agenda)
- **Justificativa add-on:** E-commerce integrado. Alto custo de implementação, alto valor agregado.
- **Abordagem por fases:**
  - **Fase 1 — Cadastro:** Modelo `Product` (nome, preço, estoque, categoria, imagem), CRUD, página `/dashboard/products`
  - **Fase 2 — Carrinho:** Modelo `Sale`/`SaleItem`, PDV simplificado, controle de estoque (decremento automático)
  - **Fase 3 — Integração:** Vender produtos durante agendamento (serviço + produto = uma venda), relatório unificado
  - **Fase 4 — Pagamento:** Reutilizar módulo multi-gateway do AC-02 (Stripe, Mercado Pago, Asaas, PagSeguro, InfinitePay, Banco Cora), página pública de produtos

### AC-17: Formulários Customizados (Anamnese/Intake)

- **Plano:** Add-on R$19,90/mês
- **Presente em:** 2/6 concorrentes (Simples Agenda, SimplyBook.me)
- **Justificativa add-on:** Feature especializada. Simples Agenda e SimplyBook.me cobram em planos premium.
- **Abordagem:**
  - Modelo `FormTemplate`: id, userId, name, fields (JSON array com tipo, label, required, options)
  - Modelo `FormSubmission`: id, formTemplateId, appointmentId, answers (JSON), submittedAt
  - Builder de formulários no dashboard (drag & drop de campos: texto, seleção, checkbox, número, data)
  - Vinculação a serviços específicos (ex: anamnese só para consulta médica)
  - Cliente preenche antes ou durante o agendamento

---

## 7. Avançado — v3.0

### AC-15: Teleconsulta / Videochamada

- **Plano:** Add-on R$24,90/mês
- **Presente em:** 3/6 concorrentes (Clínica Experts, SimplyBook.me, Agenda Serviço)
- **Justificativa add-on:** Feature complexa. Sempre premium em todos os concorrentes.
- **Abordagem:**
  - Integração com Google Meet ou Zoom via API
  - Ao criar agendamento com `isOnline: true`, gerar link de videochamada automaticamente
  - Incluir link no email de confirmação e no lembrete
  - No calendário: ícone de vídeo para agendamentos online

### AC-18: Templates de Página de Agendamento

- **Plano:** Add-on R$14,90/mês
- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Justificativa add-on:** Personalização visual. Reservio tem 17 templates no premium.
- **Abordagem:**
  - Criar 3-5 templates visuais para `/agendamento/[token]` (minimal, classic, bold, elegant, modern)
  - Customização por empresa: cores primária/secundária, logo, banner, texto de boas-vindas
  - Seleção em `/dashboard/configurations/appearance`
  - Preview em tempo real antes de salvar

### F-05: Planilha Pública / Relatórios

- **Plano:** Add-on R$14,90/mês
- **Presente em:** 0/6 concorrentes
- **Justificativa add-on:** Feature única nossa. Diferencial competitivo exclusivo.
- **Abordagem:**
  - Rota `/agenda/[token]/planilha` com calendário semanal/mensal em formato tabela
  - Apenas horários disponíveis/ocupados (sem dados pessoais dos clientes)
  - Exportação CSV/PDF da planilha
  - Opção de embed via iframe para sites externos
  - Configuração por empresa (habilitar/desabilitar, nível de detalhe)

### API Pública

- **Plano:** Add-on R$29,90/mês
- **Presente em:** 1/6 concorrentes (SimplyBook.me)
- **Justificativa add-on:** Sempre tier enterprise com rate limiting. Apenas SimplyBook.me oferece.
- **Abordagem:**
  - Documentação OpenAPI/Swagger em `/api/docs`
  - Autenticação via API key (gerada no dashboard)
  - Endpoints: agendamentos (CRUD), serviços (leitura), funcionários (leitura), disponibilidade (leitura)
  - Rate limiting específico para API (1000 req/dia no plano básico)
  - Webhook configurável (notificar URL externa em eventos)

---

## 8. Análise Detalhada de Concorrentes

### 8.1 Clínica Experts

- **URL:** https://clinicaexperts.com.br/
- **Foco:** Clínicas e consultórios de saúde (estética, odontologia, medicina, biomedicina, etc.)
- **Funcionalidades:**
  - Agenda inteligente com disponibilidade em tempo real
  - Gestão de atendimentos e prontuários
  - Financeiro integrado (contas, relatórios, comissões)
  - Gestão de vendas e estoque
  - Módulo de marketing
  - Chatbot IA (Anna Chatbot) — secretária virtual 24h via WhatsApp
  - IA de transcrição de atendimentos (Anna Transcription)
  - IA de análise de pele facial (Anna Skin Analysis)
  - IA copilot para conteúdo (Anna Copilot)
  - Documentos digitais com assinatura (CliniDocs)
  - CRM comercial (CliniCRM)
  - Agendamento online via site (CliniSite)
  - Chat integrado ao WhatsApp (CliniChat)
  - Nota fiscal em um clique (CliniNotas)
  - Teleconsulta (CliniTeleconsulta)
  - Conformidade LGPD com auditoria
  - App mobile (iOS e Android)
  - Suporte especializado e treinamento semanal
- **Diferencial:** IA integrada em múltiplos módulos, ecossistema "tudo-em-um".

### 8.2 Simples Agenda

- **URL:** https://www.simplesagenda.com.br/
- **Foco:** ERP simplificado para PMEs com agendamento e gestão financeira.
- **Funcionalidades:**
  - Agendamento online 24h com link personalizado
  - Confirmação automática via WhatsApp (reduz faltas em até 50%)
  - Agendamento com pagamento por PIX
  - Fluxo de caixa (contas a pagar e receber)
  - Controle de vendas com resumo diário por forma de pagamento
  - Relatórios financeiros com gráficos analíticos
  - Cálculo automático de comissões (custos, descontos, taxas)
  - Controle de pacotes/sessões
  - Dashboard com gráficos de agendamentos, vendas e financeiro
  - Anamnese digital, prontuários e contratos com assinatura eletrônica
  - Controle de estoque com importação de XML
  - Permissões personalizadas por profissional
  - App mobile (iOS e Android)
- **Diferencial:** PIX integrado ao agendamento, comissões automáticas, gestão financeira completa.

### 8.3 Calenddar

- **URL:** https://calenddar.com.br/
- **Foco:** Organização inteligente de agenda.
- **Funcionalidades:**
  - Sistema de agendamento com interface simplificada
  - Organização de compromissos
  - (Conteúdo limitado no momento da análise)
- **Diferencial:** Interface minimalista e foco em simplicidade.

### 8.4 Reservio

- **URL:** https://www.reservio.com/
- **Foco:** Agendamento para negócios baseados em serviços (beleza, fitness, saúde, educação).
- **Funcionalidades:**
  - Calendário inteligente para gestão centralizada
  - Ponto de venda (POS) com rastreio de vendas e inventário
  - Gestão de clientes com programa de fidelidade
  - Gestão de equipe com coordenação de turnos
  - Reservas online 24/7 via site, link e QR code
  - Site personalizável para agendamentos (17 templates)
  - Processamento de pagamentos online integrado
  - Mensagens automáticas (SMS e email) para reduzir no-shows
  - App mobile admin e cliente (iOS e Android)
  - Chatbot IA para suporte (resolve 93% das questões)
  - Plano gratuito (até 40 agendamentos/mês)
- **Diferencial:** Plano gratuito, POS integrado, templates de site, fidelidade de clientes, app dedicado para cliente.

### 8.5 SimplyBook.me

- **URL:** https://simplybook.me/
- **Foco:** Agendamento online com 77+ recursos personalizáveis para qualquer setor.
- **Funcionalidades:**
  - Agendamento online 24/7 via múltiplos canais (site, Facebook, Instagram, Google)
  - Notificações via WhatsApp, SMS e Email automáticas
  - App admin e app cliente personalizado (com marca da empresa)
  - Pagamentos online (Stripe, PayPal, Apple Pay, Google Pay, parcelamento)
  - POS para pagamentos presenciais
  - Integração com WordPress, Joomla e outros CMS
  - Sincronização bidirecional com Google Calendar e Outlook
  - Formulários de admissão/intake customizados
  - Sistema de cupons, cartões-presente e pacotes
  - Programa de fidelidade
  - Reservas em grupo e recorrentes
  - Teleconsulta (Microsoft Teams, Google Meet, Zoom)
  - Lista de espera
  - Marketing integrado (social media, ads, email marketing)
  - Reviews/avaliações de clientes
  - Marketplace/diretório (Booking.page)
  - 17 templates de site personalizáveis
  - Múltiplas localizações
  - HIPAA compliance (saúde)
  - Webhooks e API pública
  - Integração Zapier e N8N
  - QR code para agendamento
  - ISO 27001 certificado
- **Diferencial:** 77+ recursos customizáveis, agendamento omnichannel, marketplace, API pública robusta.

### 8.6 Agenda Serviço

- **URL:** https://agendaservico.link/
- **Foco:** Agendamento online para prestadores de serviços autônomos e PMEs.
- **Funcionalidades:**
  - Marcação online via link compartilhável
  - Notificações automáticas via WhatsApp e email
  - Sincronização com Google Calendar
  - Recebimento de pagamentos online
  - Atendimentos online (Zoom e Google Meet)
  - Customização de cores e logo da empresa
  - Gestão de clientes (importar/exportar CSV/Excel)
  - Painel do cliente para gerenciar agendamentos
  - QR code e links compartilháveis para redes sociais
  - Conformidade LGPD
  - A partir de R$29,90/mês
- **Diferencial:** Preço acessível, Google Calendar sync, videochamada integrada, exportação de dados.

---

## 9. Checklist de Verificação Final

> Usar antes de cada release. Itens são removidos conforme implementados.

### Pré-v1.0 (Funcionalidades core)

- [x] Conflito de horários com validação de duração (F-01) — IMPLEMENTADO
- [x] Core compartilhado de cancelamento/reagendamento implementado (F-02) — IMPLEMENTADO
- [x] Editar agendamento funcional no painel (F-02) — IMPLEMENTADO
- [x] Cancelar agendamento funcional no painel (F-02) — IMPLEMENTADO
- [x] Reagendar agendamento funcional no painel (F-02) — IMPLEMENTADO
- [x] Tabela AppointmentHistory registrando alterações (F-02) — IMPLEMENTADO
- [x] Webhook atualizado com campo type para cancel/reschedule/edit (F-02) — IMPLEMENTADO
- [ ] Envio de mensagem WhatsApp individual para cliente (F-07)
- [ ] Envio de mensagem WhatsApp em massa para clientes de um período (F-07)
- [ ] Fluxo de indisponibilidade com cancelamento em lote (F-07)
- [ ] Tabela MessageLog rastreando mensagens enviadas (F-07)
- [ ] Página pública de gerenciamento via token (F-08)
- [ ] Cliente cancela agendamento via link público (F-08)
- [ ] Cliente reagenda agendamento via link público (F-08)
- [ ] Link de gerenciamento incluído na confirmação WhatsApp/Email (F-08)
- [ ] Prazo mínimo configurável para cancelamento/reagendamento (F-08)
- [ ] Modelo `ReminderLog` no Prisma — migração aplicada (F-03)
- [ ] API route `/api/cron/reminders` funcionando (F-03)
- [ ] Lembretes 7 dias antes funcionando — via rota global (F-03)
- [ ] Lembretes 24h antes funcionando — via rota global (F-03)
- [ ] Lembretes 2h antes funcionando — via rota global (F-03)
- [ ] managementLink incluído nos lembretes — integração F-08 (F-03)
- [ ] Controle de duplicatas via `ReminderLog` @@unique (F-03)
- [ ] Schedule Trigger configurado no N8N — cada 5 min (F-03)
- [ ] Campo trialEndsAt e subscriptionStatus no modelo User (F-09)
- [ ] Middleware de verificação de trial/assinatura no painel (F-09)
- [ ] Banner de countdown do trial no dashboard (F-09)
- [ ] Tela de bloqueio/conversão após expiração do trial (F-09)
- [ ] Notificação 7 dias antes da expiração do trial (F-09)
- [ ] Notificação 1 dia antes da expiração do trial (F-09)
- [ ] Registro define trialEndsAt automaticamente (F-09)

---

**Fim do Detalhamento Técnico — Agenda System v0.9.0 (24 funcionalidades pendentes)**
