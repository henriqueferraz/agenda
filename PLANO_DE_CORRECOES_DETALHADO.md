# Agenda System — Detalhamento Técnico de Correções e Melhorias

> **Versão:** 0.9.0 | **Atualizado:** 16/02/2026 | **Autor:** Henrique Ferraz
> **Resumo:** [PLANO_DE_CORRECOES.md](./PLANO_DE_CORRECOES.md)

Este documento contém a descrição completa de cada problema, impacto, abordagem de correção e detalhes de implementação para todas as 82 tarefas do plano.

---

## Índice

1. [Correções de Lógica](#1-correções-de-lógica)
2. [Correções de Segurança](#2-correções-de-segurança)
3. [Correções de Responsividade](#3-correções-de-responsividade)
4. [Correções de Acessibilidade](#4-correções-de-acessibilidade)
5. [Correções de UI/UX](#5-correções-de-uiux)
6. [Infraestrutura e Arquitetura](#6-infraestrutura-e-arquitetura)
7. [Funcionalidades Core — v1.0](#7-funcionalidades-core--v10)
8. [Pagamentos Multi-Gateway — v1.1](#8-pagamentos-multi-gateway--v11)
9. [Mobilidade e Ferramentas — v1.1](#9-mobilidade-e-ferramentas--v11)
10. [Integrações e Produtividade — v1.2](#10-integrações-e-produtividade--v12)
11. [Engajamento e Retenção — v1.3](#11-engajamento-e-retenção--v13)
12. [Expansão — v2.0](#12-expansão--v20)
13. [Avançado — v3.0](#13-avançado--v30)
14. [Análise Detalhada de Concorrentes](#14-análise-detalhada-de-concorrentes)
15. [Checklist de Verificação Final](#15-checklist-de-verificação-final)

---
---

## 1. Correções de Lógica

### M-01: Race condition no rate limiting

- **Arquivo:** `lib/rate-limit.ts`
- **Problema:** Padrão read-then-write não atômico. Duas requisições simultâneas podem ler o mesmo estado e criar duplicatas ou incrementar incorretamente o contador.
- **Impacto:** Rate limiting pode ser contornado em cenários de alta concorrência.
- **Correção:** Usar `prisma.ipRateLimit.upsert()` ao invés de `findUnique` + `create`/`update`, garantindo atomicidade.

### M-02: Exclusão de serviço sem verificar agendamentos futuros

- **Arquivo:** `app/(panel)/dashboard/services/service/_actions/delete-service.ts`
- **Problema:** Não verifica se há agendamentos futuros usando o serviço antes de deletá-lo.
- **Impacto:** Agendamentos futuros ficam órfãos, referenciando um serviço inexistente. Pode causar erros no calendário e na visualização diária.
- **Correção:** Antes de deletar, consultar `Appointment` com `serviceId` e `appointmentDate >= hoje`. Se encontrar, retornar erro com contagem de agendamentos afetados e sugerir desativação (soft-delete) ao invés de exclusão.

### M-03: Exclusão de funcionário sem verificar agendamentos futuros

- **Arquivo:** `app/(panel)/dashboard/services/employee/_actions/delete-employee.ts`
- **Problema:** Mesmo cenário do M-02, mas para funcionários.
- **Correção:** Consultar `Appointment` com `employeeId` e `appointmentDate >= hoje` antes de deletar.

### M-04: Exclusão de feriado sem avisar sobre agendamentos afetados

- **Arquivo:** `app/(panel)/dashboard/schedule/stopday/_actions/delete-stopday.ts`
- **Problema:** Ao deletar um feriado, não avisa se há agendamentos que foram bloqueados pela data. O `create-stopday` já bloqueia criação de agendamento na data, mas o `delete-stopday` não informa sobre agendamentos existentes.
- **Correção:** Verificar se existem agendamentos na data do feriado e exibir aviso ao usuário antes de confirmar exclusão.

### M-06: Timezone errado no dashboard

- **Arquivo:** `app/(panel)/dashboard/dashboard/_data-access/get-info-dashboard.ts`
- **Problema:** Uso de `new Date().getDay()` retorna o dia da semana no timezone do servidor, que pode não ser America/Sao_Paulo.
- **Impacto:** Estatísticas do dashboard podem mostrar dados do dia errado quando o servidor está em UTC.
- **Correção:** Usar `getDateComponentsInSaoPaulo()` do `utils/date-timezone.ts` que já existe no projeto.

### L-08: Agendamento duplicado por email

- **Arquivo:** `app/(public)/agendamento/[token]/_actions/create-public-appointment.ts`
- **Problema:** Não verifica se o mesmo email já tem agendamento no mesmo horário. Um cliente pode acidentalmente agendar duas vezes.
- **Impacto:** Slots de horário desperdiçados, confusão na agenda do profissional.
- **Correção:** Antes de criar, verificar se existe `Appointment` com mesmo email + mesma data + mesmo horário. Se sim, retornar mensagem informando que já possui agendamento.

### L-09: Validação de telefone brasileiro incompleta

- **Arquivo:** `app/(public)/agendamento/[token]/_components/public-appointment-modal.tsx`
- **Problema:** Aceita até 11 dígitos mas não valida formato brasileiro (DDD + 9 dígitos para celular, DDD + 8 dígitos para fixo).
- **Correção:** Validar com regex `/^\d{10,11}$/` e verificar se DDD é válido (11-99, excluindo faixas inexistentes como 10, 20, 30, etc).

---

## 2. Correções de Segurança

### M-05: IDs gerados com Math.random()

- **Arquivos:** `create-employee.ts`, `create-public-appointment.ts`
- **Problema:** IDs gerados com `Date.now() + Math.random()` podem colidir em alta concorrência. `Math.random()` não é criptograficamente seguro.
- **Impacto:** Colisão de IDs pode causar erro Prisma P2002 ou, pior, sobrescrever dados.
- **Correção:** Usar `crypto.randomUUID()` (Node.js nativo) ou deixar o Prisma gerar com `@default(cuid())` no schema.

### M-10: Falta de sanitização no agendamento público

- **Arquivo:** `app/(public)/agendamento/[token]/_actions/create-public-appointment.ts`
- **Problema:** Nome e telefone são salvos no banco sem sanitização adequada de caracteres especiais. Podem conter tags HTML, scripts ou caracteres de controle.
- **Impacto:** Risco de XSS stored se os dados forem exibidos sem escape. Dados sujos no banco.
- **Correção:**
  - `trim()` em todos os campos de texto
  - Remoção de caracteres perigosos: `<`, `>`, `"`, `'`, `\`, `/`
  - Limite de comprimento: nome max 100, telefone max 15
  - Validar com Zod antes de salvar

### L-04: Logging de dados sensíveis

- **Arquivos:** Múltiplos (server actions e API routes)
- **Problema:** Alguns `console.error` logam o objeto completo do formulário, que pode conter nome, email, telefone ou até senhas em formulários de autenticação.
- **Impacto:** Em produção, logs podem ser acessados por ferramentas de monitoramento, expondo dados pessoais (violação LGPD).
- **Correção:** Logar apenas:
  - ID do recurso (se disponível)
  - Mensagem de erro genérica
  - Stack trace (sem dados de payload)
  - Nunca: dados de formulário, tokens, senhas, emails completos

---

## 3. Correções de Responsividade

### M-12: Modais de confirmação sem responsividade

- **Arquivos:** `appointment-modal.tsx` (modal de confirmação), `tasks-list.tsx` (modal de criar/editar)
- **Problema:** `max-w-2xl` e `max-w-md` podem estourar a largura em telas mobile (< 640px), causando scroll horizontal ou conteúdo cortado.
- **Correção:** Adicionar `w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl` para garantir margem de 1rem em cada lado.

### M-13: Altura máxima de scroll fixa

- **Arquivos:** `daily-schedule-card.tsx`, `tasks-list.tsx`
- **Problema:** `max-h-[500px]` ocupa quase toda a tela em dispositivos com viewport < 700px de altura.
- **Correção:** Usar breakpoints responsivos: `max-h-[300px] sm:max-h-[400px] md:max-h-[500px]`.

### M-14: Padding não responsivo

- **Arquivo:** `app/(panel)/dashboard/dashboard/page.tsx`
- **Problema:** `p-6` (24px) fixo. Em mobile, reduz a área útil de conteúdo significativamente.
- **Correção:** `p-4 sm:p-6` (16px em mobile, 24px em desktop).

### L-06: Títulos grandes em mobile

- **Arquivos:** `activity/page.tsx`, `model/page.tsx`
- **Problema:** `text-2xl` (1.5rem) pode ser grande demais em telas < 400px.
- **Correção:** `text-xl sm:text-2xl`.

### L-07: Card max-width estreito

- **Arquivo:** `app/(panel)/dashboard/configurations/model/page.tsx`
- **Problema:** `max-w-sm` (384px) pode ser estreito para formulários com campos de CPF/CNPJ e endereço.
- **Correção:** `max-w-sm sm:max-w-md md:max-w-lg`.

---

## 4. Correções de Acessibilidade

### M-07: Botões do calendário sem aria-label

- **Arquivo:** `app/(panel)/dashboard/schedule/calendar/_components/monthly-calendar.tsx`
- **Problema:** Botões de dia no calendário mostram apenas o número (ex: "15"). Leitores de tela lerão "botão quinze" sem contexto de mês/ano.
- **Correção:** Adicionar `aria-label={`Selecionar dia ${day.getDate()} de ${MONTHS[selectedMonth]}`}`.

### M-08: Botões de horário sem aria-label

- **Arquivos:** `horario.tsx`, `modal-employee-times.tsx`
- **Problema:** Botões de seleção de horário sem contexto para leitores de tela. "Botão 14:00" é legível, mas "botão" sozinho não é.
- **Correção:** Adicionar `aria-label={`Selecionar horário ${time}`}`.

### M-09: Touch targets menores que 44x44px

- **Arquivo:** `app/(panel)/dashboard/services/employee/_components/modal-employee-times.tsx`
- **Problema:** Botões de dropdown com `h-8 w-8` (32x32px). WCAG 2.1 recomenda mínimo de 44x44px para touch targets.
- **Impacto:** Difícil de tocar em dispositivos mobile, especialmente para usuários com dificuldades motoras.
- **Correção:** Usar `h-10 w-10` (40x40px) ou idealmente `min-h-[44px] min-w-[44px]`.

### L-03: Carrossel sem navegação por teclado

- **Arquivo:** `app/(public)/page.tsx` (landing page)
- **Problema:** Indicadores do carrossel (dots) não são focáveis por teclado. Usuários que navegam por Tab não conseguem interagir com o carrossel.
- **Correção:** Adicionar `tabIndex={0}` nos indicadores e handler `onKeyDown` que aceite Enter e Space para trocar slide.

---

## 5. Correções de UI/UX

### M-11: Inputs sem maxLength

- **Arquivos:** `appointment-modal.tsx`, `public-appointment-modal.tsx`
- **Problema:** Inputs de nome e email não têm `maxLength` definido. Um usuário (ou bot) pode enviar strings de milhares de caracteres.
- **Impacto:** Strings excessivamente longas no banco, problemas de layout, possível DoS via payloads grandes.
- **Correção:** `maxLength={100}` para nome, `maxLength={255}` para email. Validar também no servidor com Zod.

### M-15: Falta de índices no banco de dados

- **Arquivo:** `prisma/schema.prisma`
- **Problema:** Consultas frequentes (agendamentos por data, feriados por data) não têm índices explícitos. O Prisma cria índices para PKs e unique, mas não para queries compostas.
- **Impacto:** Queries lentas em produção conforme o volume de dados cresce (especialmente em listagem de agenda diária/mensal).
- **Correção:**

```prisma
model Appointment {
  @@index([userId, appointmentDate])
  @@index([employeeId, appointmentDate])
}

model StopDay {
  @@index([UserId, date])
}
```

### L-01: Copyright desatualizado

- **Arquivo:** `app/(public)/page.tsx`
- **Problema:** Footer exibe "2025 Agenda". Estamos em 2026.
- **Correção:** Substituir por `{new Date().getFullYear()}` para atualizar dinamicamente.

### L-02: Versão inconsistente

- **Arquivo:** `app/(public)/page.tsx`
- **Problema:** Footer diz "Versão 1.0.2 (beta)", mas `package.json` declara `0.9.0`.
- **Correção:** Importar versão de `package.json` ou usar variável de ambiente `NEXT_PUBLIC_APP_VERSION`.

### L-05: Magic numbers

- **Arquivo:** `app/(panel)/dashboard/schedule/calendar/_components/appointment-modal.tsx`
- **Problema:** `30000` (timeout), `5000` (delay entre webhooks), `500` (delay) sem nomes descritivos.
- **Correção:** Extrair para constantes no topo do arquivo:

```typescript
const WEBHOOK_TIMEOUT_MS = 30000
const WEBHOOK_DELAY_BETWEEN_MS = 5000
const WEBHOOK_INITIAL_DELAY_MS = 500
```

---

## 6. Infraestrutura e Arquitetura

### P-01: Proteção contra replay attacks no webhook

- **Descrição:** Adicionar validação de timestamp e nonce no webhook para evitar que requisições antigas ou duplicadas sejam processadas.
- **Abordagem:**
  - Enviar header `x-webhook-timestamp` com Unix timestamp da requisição
  - Enviar header `x-webhook-nonce` com UUID único por requisição
  - No servidor: rejeitar se timestamp > 5 minutos de diferença
  - Armazenar nonces usados em tabela/cache (TTL de 10 minutos)
  - Rejeitar nonces duplicados

### P-02: Validação HMAC no webhook

- **Descrição:** Adicionar assinatura HMAC para garantir que apenas requisições legítimas (do N8N) sejam processadas.
- **Abordagem:**
  - Gerar `WEBHOOK_SECRET` como variável de ambiente
  - No emissor (N8N): calcular HMAC-SHA256 do body com o secret
  - Enviar no header `x-webhook-signature`
  - No servidor: recalcular e comparar com `timingSafeEqual`

### P-03: Logger estruturado

- **Descrição:** Substituir `console.log/warn/error` por um logger que filtre dados sensíveis automaticamente.
- **Abordagem:**
  - Criar `lib/logger.ts` com níveis: debug, info, warn, error
  - Filtro automático de campos sensíveis: password, token, email (parcial), cpf, cnpj
  - Em produção: formato JSON para ingestão por Sentry, Datadog ou similar
  - Em desenvolvimento: formato legível com cores

### P-04: Rate limiting via middleware

- **Descrição:** Adicionar rate limiting global via Next.js middleware.
- **Abordagem:**
  - Criar `middleware.ts` na raiz do projeto
  - Limites diferenciados:
    - Auth routes (`/api/auth/*`): 10 req/min
    - API routes (`/api/*`): 60 req/min
    - Páginas públicas: 120 req/min
  - Usar IP do header `x-real-ip` (prioridade) ou `x-forwarded-for`

### P-05: Testes de timezone

- **Descrição:** Testar funções de `utils/date-timezone.ts` e lógica de conflito de horários.
- **Abordagem:**
  - Criar `tests/date-timezone.test.ts`
  - Testar `startOfDayInSaoPaulo`, `endOfDayInSaoPaulo`, `getDateComponentsInSaoPaulo`
  - Edge cases: meia-noite, transição de DST (horário de verão), datas em dezembro/janeiro
  - Mock de `Date` para simular diferentes timezones

### P-06: Testes de segurança

- **Descrição:** Testes automatizados que validem autenticação e autorização.
- **Abordagem:**
  - Testar que todas as server actions retornam erro sem token válido
  - Testar que acessar recurso de outro usuário retorna 403
  - Testar que rate limiting bloqueia após X requisições
  - Testar que tokens expirados são rejeitados

### P-07: Alerta de tentativas de invasão

- **Descrição:** Enviar alerta ao admin quando rate limiting bloqueia um IP repetidamente.
- **Abordagem:**
  - Monitorar tabela `IpRateLimit` para IPs com bloqueios frequentes
  - Integrar com `lib/security-log.ts` existente
  - Enviar email ao admin com: IP, quantidade de tentativas, rotas acessadas
  - Threshold: 3+ bloqueios em 1 hora

### P-08: Componente modal responsivo

- **Descrição:** Criar componente wrapper de Dialog que já inclua responsividade e acessibilidade por padrão.
- **Abordagem:**
  - Criar `components/ui/responsive-dialog.tsx`
  - Props: `size` (sm, md, lg, xl) com breakpoints pré-configurados
  - Padrão: `w-full max-w-[calc(100vw-2rem)] sm:max-w-{size}`
  - Incluir `aria-describedby` e `aria-labelledby` automáticos

### P-09: Grid de horários reutilizável

- **Descrição:** Extrair o grid de seleção de horário que se repete em 4+ componentes.
- **Abordagem:**
  - Criar `components/time-grid.tsx`
  - Grid padrão: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`
  - Props: `times`, `selected`, `onSelect`, `disabled`
  - Cada botão com `min-h-[44px]` e `aria-label` automático

### P-10: Migrar NEXT_PUBLIC_BASE_N8N

- **Descrição:** A URL do N8N está como `NEXT_PUBLIC_BASE_N8N`, exposta no bundle do cliente.
- **Abordagem:**
  - Renomear para `BASE_N8N` no `.env.local`
  - Atualizar todas as referências em server actions e API routes
  - A chamada do webhook no modal do calendário já passa pela API route `/api/webhook/appointment`, então não há chamada direta do cliente

### P-11: Validação de CEP via API

- **Descrição:** Validar se o CEP informado realmente existe, não apenas o formato.
- **Abordagem:**
  - Já existe `utils/cep.ts` com integração ViaCEP + BrasilAPI
  - Integrar a consulta na validação do `update-address.ts` (server action)
  - Se CEP não existir, retornar erro específico ao invés de aceitar silenciosamente

### P-12: Soft-delete para serviços e funcionários

- **Descrição:** Ao invés de deletar registros que têm agendamentos históricos, marcá-los como inativos.
- **Abordagem:**
  - Adicionar campo `deletedAt DateTime?` nos models `Service` e `Employee`
  - Filtrar `deletedAt: null` em todas as queries de listagem
  - Manter registros deletados acessíveis para agendamentos históricos
  - UI: exibir filtro "mostrar inativos" nas listagens

---

## 7. Funcionalidades Core — v1.0

### F-01: Validação de Conflito de Horários

- **Descrição:** Impedir que dois agendamentos se sobreponham considerando a duração do serviço. Atualmente, o sistema verifica apenas o horário de início, não a sobreposição com duração.
- **Abordagem:**
  - No servidor, antes de criar agendamento, verificar:
    - `novoInicio < existenteFim AND novoFim > existenteInicio` (para o mesmo funcionário)
  - Usar `prisma.$transaction()` para garantir atomicidade (evitar TOCTOU)
  - Retornar mensagem clara: "O horário X-Y conflita com agendamento existente de CLIENTE às HH:MM"
  - Aplicar tanto no agendamento público quanto no painel

### F-02 / AC-04: Edição e Cancelamento de Agendamentos

- **Presente em:** 6/6 concorrentes (funcionalidade básica)
- **Descrição:** Permitir que o administrador edite (data, hora, serviço, funcionário) e cancele agendamentos. Opcionalmente, o cliente também pode cancelar via link.
- **Abordagem:**
  - **Server Actions:**
    - `update-appointment.ts` — alterar data, hora, serviço, funcionário
    - `cancel-appointment.ts` — marcar como cancelado (não deletar)
  - **Modelo Prisma:** Adicionar campo `status` enum: `confirmed`, `cancelled`, `rescheduled`
  - **UI no painel:**
    - Botões "Editar" e "Cancelar" na visualização diária do calendário
    - Modal de edição reutilizando `appointment-modal.tsx`
    - Visual diferente para cancelados (texto tachado, opacidade reduzida)
  - **Notificação:**
    - Email + WhatsApp (via N8N webhook) informando alteração ou cancelamento
    - Incluir dados: novo horário (se alterado), motivo (se cancelado)
  - **Página pública:**
    - Link no email/WhatsApp: `/agendamento/[token]/gerenciar/[appointmentId]`
    - Cliente pode cancelar (com confirmação) ou solicitar reagendamento

### F-03 / AC-01: Lembretes Automáticos Pré-Agendamento

- **Presente em:** 5/6 concorrentes
- **Impacto:** Redução de até 50% em faltas (dado do Simples Agenda)
- **Status atual:**
  - ✅ Confirmação instantânea via WhatsApp (N8N) — já funciona
  - ✅ Confirmação instantânea via Email (SMTP) — já funciona
  - ❌ Lembretes 24h e 1h antes — NÃO implementado
- **Abordagem:**
  - **Modelo Prisma:** `ReminderSchedule`
    - `id`, `appointmentId`, `type` (email/whatsapp), `hoursBeforeAppointment` (24, 1)
    - `status` (pending/sent/failed), `sentAt`, `createdAt`
  - **Disparo:**
    - N8N workflow com cron job verificando `ReminderSchedule` a cada hora
    - Ou: API route `/api/cron/reminders` chamada por cron externo (Vercel Cron, Railway, etc)
    - Buscar lembretes com `status: pending` e `appointment.date - hoursBeforeAppointment <= now`
  - **Configuração:**
    - Página `/dashboard/configurations/notifications`
    - Toggle on/off por tipo (email, WhatsApp)
    - Antecedência personalizável (default: 24h e 1h)
    - Preview da mensagem

---

## 8. Pagamentos Multi-Gateway — v1.1

### AC-02: Pagamento Online Integrado

- **Presente em:** 5/6 concorrentes
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

---

## 9. Mobilidade e Ferramentas — v1.1

### AC-05: PWA (Progressive Web App)

- **Presente em:** 4/6 concorrentes (Clínica Experts, Simples Agenda, Reservio, SimplyBook.me)
- **Descrição:** Transformar o sistema em PWA para acesso mobile sem publicação em stores.
- **Abordagem:**
  - **Fase 1:** `manifest.json` com ícones, nome, cores + service worker básico para cache de assets estáticos
  - **Fase 2:** Notificações push via Web Push API (novo agendamento, lembrete, cancelamento)
  - **Fase 3:** Modo offline com cache da agenda do dia atual (service worker + IndexedDB)
- **Vantagem:** Não requer conta de desenvolvedor Apple/Google, instalação instantânea via navegador

### AC-07: QR Code para Agendamento

- **Presente em:** 3/6 concorrentes (Reservio, SimplyBook.me, Agenda Serviço)
- **Descrição:** Gerar QR code que aponta para a página pública de agendamento (`/agendamento/[token]`).
- **Abordagem:**
  - Usar lib `qrcode` (npm) para gerar QR code no servidor
  - Exibir no dashboard (card) e em `/dashboard/configurations`
  - Opção de download em PNG (para digital) e SVG (para impressão)
  - Personalização: incluir logo no centro do QR code (opcional)

### AC-08: Exportação de Dados (CSV/PDF)

- **Presente em:** 2/6 concorrentes (Simples Agenda, Agenda Serviço)
- **Descrição:** Exportar agendamentos, lista de clientes e relatórios.
- **Abordagem:**
  - Botão "Exportar" nas listagens de agendamentos e clientes
  - **CSV:** usar `papaparse` para gerar dados tabulares (agendamento, data, horário, cliente, serviço, funcionário, status)
  - **PDF:** usar `jspdf` ou `@react-pdf/renderer` para relatórios formatados com cabeçalho, filtros aplicados e totais
  - Filtros: período (data início/fim), serviço, funcionário, status
  - Server action que gera o arquivo e retorna como download

---

## 10. Integrações e Produtividade — v1.2

### AC-03: Sincronização com Google Calendar

- **Presente em:** 3/6 concorrentes (Reservio, SimplyBook.me, Agenda Serviço)
- **Descrição:** Sync bidirecional com Google Calendar para evitar conflitos de agenda pessoal/profissional.
- **Abordagem:**
  - Integração via Google Calendar API v3 com OAuth 2.0
  - Sync bidirecional: agendamentos do Agenda aparecem no Google Calendar e eventos do Google bloqueiam horários no Agenda
  - Configuração por funcionário (cada um conecta sua conta Google)
  - Opção de sync apenas leitura (ver Google no Agenda) ou completo (criar eventos no Google)
  - Webhook do Google Calendar para eventos em tempo real (ou polling a cada 5 minutos)

### AC-10: Agendamentos Recorrentes

- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
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

- **Presente em:** 4/6 concorrentes
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

- **Descrição:** Transporte de pets como serviço complementar (pet shops e clínicas veterinárias).
- **Abordagem:**
  - Opção "Taxidog" como serviço adicional selecionável no agendamento
  - Campos: endereço de busca, horário preferido, observações (porte, nome do pet)
  - Notificação ao motorista via webhook/WhatsApp (N8N)
  - Configuração em `/dashboard/configurations/taxidog` (habilitar/desabilitar, motoristas cadastrados)

---

## 11. Engajamento e Retenção — v1.3

### AC-09: Avaliações e Feedback

- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Abordagem:**
  - Modelo `Review` no Prisma: id, appointmentId, rating (1-5), comment, createdAt
  - Email automático 24h após o atendimento com link para avaliar
  - Página pública: `/avaliar/[reviewToken]` com formulário simples (estrelas + comentário)
  - Exibição na página de agendamento público: média de estrelas e últimos depoimentos
  - Dashboard: métricas de satisfação por funcionário e serviço

### AC-13: Cupons e Promoções

- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Abordagem:**
  - Modelo `Coupon`: id, code, discountType (percent/fixed), discountValue, validUntil, maxUses, currentUses, isActive
  - Aplicação no agendamento público: campo "Cupom" no checkout
  - Validação: expiração, limite de uso, valor mínimo
  - Dashboard: listagem de cupons com métricas (usos, receita gerada)

### AC-14: Programa de Fidelidade

- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Abordagem:**
  - Modelo `LoyaltyPoints`: id, clientEmail, points, history (JSON com transações)
  - Regras configuráveis: X pontos por agendamento (configurável por serviço)
  - Resgate: desconto ou serviço gratuito ao atingir Y pontos
  - Painel do cliente (via link no email) para visualizar saldo e histórico

### AC-16: Lista de Espera

- **Presente em:** 1/6 concorrentes (SimplyBook.me)
- **Abordagem:**
  - Modelo `Waitlist`: id, clientName, clientEmail, clientPhone, serviceId, preferredDate, status (waiting/notified/booked/expired)
  - Quando um agendamento é cancelado: verificar waitlist para mesma data/serviço
  - Notificar primeiro da fila via email + WhatsApp (N8N)
  - Expiração automática após 48h sem resposta → notificar próximo

---

## 12. Expansão — v2.0

### AC-06: Gestão Financeira

- **Presente em:** 2/6 concorrentes (Clínica Experts, Simples Agenda)
- **Abordagem por fases:**
  - **Fase 1:** Relatório de receita por período (baseado em preço dos serviços agendados)
  - **Fase 2:** Fluxo de caixa simples (entradas automáticas dos agendamentos + saídas manuais)
  - **Fase 3:** Comissões por funcionário (% configurável por serviço, cálculo automático)
  - **Fase 4:** Dashboard financeiro com gráficos (receita mensal, comparativo, top serviços)

### AC-12: Múltiplas Localizações

- **Presente em:** 3/6 concorrentes (Clínica Experts, Reservio, SimplyBook.me)
- **Abordagem:**
  - Modelo `Location`: id, userId, name, address, phone, workingHours (JSON)
  - Funcionários vinculados a uma ou mais localizações
  - Agendamento público: seleção de localização antes de escolher serviço
  - Dashboard com filtro por localização

### F-06: Venda de Produtos

- **Abordagem por fases:**
  - **Fase 1 — Cadastro:** Modelo `Product` (nome, preço, estoque, categoria, imagem), CRUD, página `/dashboard/products`
  - **Fase 2 — Carrinho:** Modelo `Sale`/`SaleItem`, PDV simplificado, controle de estoque (decremento automático)
  - **Fase 3 — Integração:** Vender produtos durante agendamento (serviço + produto = uma venda), relatório unificado
  - **Fase 4 — Pagamento:** Reutilizar módulo multi-gateway do AC-02 (Stripe, Mercado Pago, Asaas, PagSeguro, InfinitePay, Banco Cora), página pública de produtos

### AC-17: Formulários Customizados (Anamnese/Intake)

- **Presente em:** 2/6 concorrentes (Simples Agenda, SimplyBook.me)
- **Abordagem:**
  - Modelo `FormTemplate`: id, userId, name, fields (JSON array com tipo, label, required, options)
  - Modelo `FormSubmission`: id, formTemplateId, appointmentId, answers (JSON), submittedAt
  - Builder de formulários no dashboard (drag & drop de campos: texto, seleção, checkbox, número, data)
  - Vinculação a serviços específicos (ex: anamnese só para consulta médica)
  - Cliente preenche antes ou durante o agendamento

---

## 13. Avançado — v3.0

### AC-15: Teleconsulta / Videochamada

- **Presente em:** 3/6 concorrentes (Clínica Experts, SimplyBook.me, Agenda Serviço)
- **Abordagem:**
  - Integração com Google Meet ou Zoom via API
  - Ao criar agendamento com `isOnline: true`, gerar link de videochamada automaticamente
  - Incluir link no email de confirmação e no lembrete
  - No calendário: ícone de vídeo para agendamentos online

### AC-18: Templates de Página de Agendamento

- **Presente em:** 2/6 concorrentes (Reservio, SimplyBook.me)
- **Abordagem:**
  - Criar 3-5 templates visuais para `/agendamento/[token]` (minimal, classic, bold, elegant, modern)
  - Customização por empresa: cores primária/secundária, logo, banner, texto de boas-vindas
  - Seleção em `/dashboard/configurations/appearance`
  - Preview em tempo real antes de salvar

### F-05: Planilha Pública / Relatórios

- **Abordagem:**
  - Rota `/agenda/[token]/planilha` com calendário semanal/mensal em formato tabela
  - Apenas horários disponíveis/ocupados (sem dados pessoais dos clientes)
  - Exportação CSV/PDF da planilha
  - Opção de embed via iframe para sites externos
  - Configuração por empresa (habilitar/desabilitar, nível de detalhe)

### API Pública

- **Abordagem:**
  - Documentação OpenAPI/Swagger em `/api/docs`
  - Autenticação via API key (gerada no dashboard)
  - Endpoints: agendamentos (CRUD), serviços (leitura), funcionários (leitura), disponibilidade (leitura)
  - Rate limiting específico para API (1000 req/dia no plano básico)
  - Webhook configurável (notificar URL externa em eventos)

---

## 14. Análise Detalhada de Concorrentes

### 14.1 Clínica Experts

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

### 14.2 Simples Agenda

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

### 14.3 Calenddar

- **URL:** https://calenddar.com.br/
- **Foco:** Organização inteligente de agenda.
- **Funcionalidades:**
  - Sistema de agendamento com interface simplificada
  - Organização de compromissos
  - (Conteúdo limitado no momento da análise)
- **Diferencial:** Interface minimalista e foco em simplicidade.

### 14.4 Reservio

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

### 14.5 SimplyBook.me

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

### 14.6 Agenda Serviço

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

## 15. Checklist de Verificação Final

> Usar após concluir TODAS as correções e antes de cada release.

### Pré-v0.9.1 (Correções)

- [ ] Race conditions tratadas com upsert (M-01)
- [ ] Agendamentos verificados antes de deletar serviços (M-02)
- [ ] Agendamentos verificados antes de deletar funcionários (M-03)
- [ ] Aviso de agendamentos ao deletar feriados (M-04)
- [ ] IDs com `crypto.randomUUID()` (M-05)
- [ ] Timezone São Paulo no dashboard (M-06)
- [ ] `aria-label` no calendário (M-07)
- [ ] `aria-label` nos horários (M-08)
- [ ] Touch targets >= 44x44px (M-09)
- [ ] Sanitização no agendamento público (M-10)
- [ ] `maxLength` em inputs (M-11)
- [ ] Modais responsivos (M-12)
- [ ] Scroll heights responsivos (M-13)
- [ ] Padding responsivo (M-14)
- [ ] Índices no banco (M-15)
- [ ] Copyright dinâmico (L-01)
- [ ] Versão sincronizada (L-02)
- [ ] Carrossel acessível (L-03)
- [ ] Logs sem dados sensíveis (L-04)
- [ ] Constantes nomeadas (L-05)
- [ ] Títulos responsivos (L-06)
- [ ] Card width responsivo (L-07)
- [ ] Validação duplicata email (L-08)
- [ ] Validação telefone BR (L-09)

### Pré-v1.0 (Funcionalidades core)

- [ ] Conflito de horários com validação de duração (F-01)
- [ ] Editar agendamento funcional (F-02)
- [ ] Cancelar agendamento funcional (F-02)
- [ ] Notificação de alteração/cancelamento (F-02)
- [ ] Lembretes 24h antes funcionando (F-03)
- [ ] Lembretes 1h antes funcionando (F-03)
- [ ] Configuração de notificações no dashboard (F-03)

---

**Fim do Detalhamento Técnico — Agenda System v0.9.0**
