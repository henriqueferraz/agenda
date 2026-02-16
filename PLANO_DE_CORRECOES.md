# Plano de Correções e Melhorias - Agenda System

**Data:** 16 de Fevereiro de 2026
**Versão do Projeto:** 0.9.0
**Escopo:** Itens pendentes após auditoria de segurança, lógica, responsividade e melhorias
**Total de Itens:** 40

> Todos os 6 CRITICAL e 16 HIGH foram corrigidos em 16/02/2026.

---

## Índice

1. [MEDIUM - Correção em Breve](#1-medium---correção-em-breve)
2. [LOW - Melhorias Recomendadas](#2-low---melhorias-recomendadas)
3. [PLANEJAMENTO - Melhorias de Sistema](#3-planejamento---melhorias-de-sistema)
4. [FUTURO - Funcionalidades Planejadas](#4-futuro---funcionalidades-planejadas)
5. [Checklist de Verificação Final](#5-checklist-de-verificação-final)
6. [Roadmap Resumido](#6-roadmap-resumido)

---

## Legenda

- 🟡 **MEDIUM** — Melhoria importante para qualidade e robustez
- 🟢 **LOW** — Refinamento e boas práticas
- 🔵 **PLANEJAMENTO** — Melhorias de arquitetura e funcionalidades futuras
- 🟣 **FUTURO** — Funcionalidades novas planejadas

Categorias: `[SEGURANÇA]` `[LÓGICA]` `[RESPONSIVIDADE]` `[ACESSIBILIDADE]` `[UI/UX]` `[MELHORIA]`

---

## 1. MEDIUM - Correção em Breve

### 🟡 M-01: Race conditions no rate limiting `[LÓGICA]`

- [ ] **Corrigir**
- **Arquivo:** `lib/rate-limit.ts`
- **Problema:** Padrão read-then-write não atômico. Duas requisições simultâneas podem ler o mesmo estado e criar duplicatas ou incrementar incorretamente.
- **Correção:** Usar `prisma.ipRateLimit.upsert()` ao invés de `findUnique` + `create`/`update`.

---

### 🟡 M-02: Falta de verificação de agendamentos ao deletar serviço `[LÓGICA]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/services/service/_actions/delete-service.ts`
- **Problema:** Não verifica se há agendamentos futuros usando o serviço antes de deletá-lo.
- **Impacto:** Agendamentos futuros ficam órfãos, referenciando um serviço inexistente.
- **Correção:** Verificar e impedir exclusão se há agendamentos futuros.

---

### 🟡 M-03: Falta de verificação de agendamentos ao deletar funcionário `[LÓGICA]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/services/employee/_actions/delete-employee.ts`
- **Problema:** Mesmo problema do M-02 para funcionários.
- **Correção:** Verificar agendamentos futuros antes de deletar.

---

### 🟡 M-04: Aviso de agendamentos ao deletar feriado `[LÓGICA]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/schedule/stopday/_actions/delete-stopday.ts`
- **Problema:** Ao deletar um feriado, não avisa se há agendamentos que podem ser afetados na data (o create-stopday já bloqueia, mas o delete não informa).
- **Correção:** Verificar se existem agendamentos na data e informar o usuário.

---

### 🟡 M-05: Geração manual de IDs com Math.random() `[SEGURANÇA]`

- [ ] **Corrigir `create-employee.ts`**
- [ ] **Corrigir `create-public-appointment.ts`**
- **Problema:** IDs gerados com `Date.now() + Math.random()` podem colidir em alta concorrência.
- **Correção:** Usar `crypto.randomUUID()` ou deixar o Prisma gerar com `@default(cuid())`.

---

### 🟡 M-06: Falta de validação de timezone em get-info-dashboard `[LÓGICA]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/dashboard/_data-access/get-info-dashboard.ts`
- **Problema:** Uso de `new Date().getDay()` pode não respeitar o timezone de São Paulo.
- **Correção:** Usar `getDateComponentsInSaoPaulo()` do `utils/date-timezone.ts`.

---

### 🟡 M-07: Botões de dia do calendário sem aria-label `[ACESSIBILIDADE]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/schedule/calendar/_components/monthly-calendar.tsx`
- **Problema:** Leitores de tela lerão apenas o número do dia sem contexto.
- **Correção:** Adicionar `aria-label={`Selecionar dia ${day.getDate()} de ${MONTHS[selectedMonth]}`}`.

---

### 🟡 M-08: Botões de horário sem aria-label `[ACESSIBILIDADE]`

- [ ] **Corrigir `horario.tsx`**
- [ ] **Corrigir `modal-employee-times.tsx`**
- **Problema:** Botões de seleção de horário sem label acessível.
- **Correção:** Adicionar `aria-label={`Selecionar horário ${time}`}`.

---

### 🟡 M-09: Touch targets menores que 44x44px `[ACESSIBILIDADE]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/services/employee/_components/modal-employee-times.tsx`
- **Problema:** Botões de dropdown com `h-8 w-8` (32x32px), abaixo do mínimo de 44x44px para touch.
- **Correção:** Usar `h-10 w-10` ou `min-h-[44px] min-w-[44px]`.

---

### 🟡 M-10: Falta de sanitização de nome e telefone no agendamento público `[SEGURANÇA]`

- [ ] **Corrigir**
- **Arquivo:** `app/(public)/agendamento/[token]/_actions/create-public-appointment.ts`
- **Problema:** Nome e telefone são salvos sem sanitização adequada de caracteres especiais.
- **Correção:** Adicionar trim, remoção de caracteres perigosos e limite de comprimento.

---

### 🟡 M-11: Falta de maxLength em inputs do modal de agendamento `[UI/UX]`

- [ ] **Corrigir modal panel** — `appointment-modal.tsx`
- [ ] **Corrigir modal público** — `public-appointment-modal.tsx`
- **Problema:** Inputs de nome e email não têm `maxLength` definido, permitindo strings excessivamente longas.
- **Correção:** Adicionar `maxLength={100}` para nome e `maxLength={255}` para email.

---

### 🟡 M-12: Modais de confirmação sem responsividade `[RESPONSIVIDADE]`

- [ ] **Corrigir `appointment-modal.tsx`** (modal de confirmação)
- [ ] **Corrigir `tasks-list.tsx`** (modal de criar/editar)
- **Problema:** `max-w-2xl` e `max-w-md` podem estourar em mobile.
- **Correção:** Adicionar `w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl`.

---

### 🟡 M-13: Altura máxima de scroll fixa em cards `[RESPONSIVIDADE]`

- [ ] **Corrigir `daily-schedule-card.tsx`**
- [ ] **Corrigir `tasks-list.tsx`**
- **Problema:** `max-h-[500px]` pode ser excessivo em telas mobile.
- **Correção:** Usar `max-h-[300px] sm:max-h-[400px] md:max-h-[500px]`.

---

### 🟡 M-14: Padding não responsivo em páginas do dashboard `[RESPONSIVIDADE]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/dashboard/page.tsx`
- **Problema:** `p-6` fixo pode ser excessivo em mobile.
- **Correção:** Usar `p-4 sm:p-6`.

---

### 🟡 M-15: Falta de índices no banco de dados `[MELHORIA]`

- [ ] **Corrigir**
- **Arquivo:** `prisma/schema.prisma`
- **Problema:** Consultas frequentes não têm índices explícitos, podendo causar lentidão em produção.
- **Correção:** Adicionar índices:

```prisma
model Appointment {
  @@index([userId, appointmentDate])
  @@index([employeeId, appointmentDate])
}

model StopDay {
  @@index([UserId, date])
}
```

---

## 2. LOW - Melhorias Recomendadas

### 🟢 L-01: Ano do copyright desatualizado `[UI/UX]`

- [ ] **Corrigir**
- **Arquivo:** `app/(public)/page.tsx`
- **Problema:** Footer diz "2025 Agenda". Estamos em 2026.
- **Correção:** Atualizar para `new Date().getFullYear()` dinamicamente.

---

### 🟢 L-02: Versão inconsistente entre footer e package.json `[UI/UX]`

- [ ] **Corrigir**
- **Arquivo:** `app/(public)/page.tsx`
- **Problema:** Footer diz "Versão 1.0.2 (beta)", mas `package.json` declara `0.9.0`.
- **Correção:** Sincronizar versões. Idealmente, importar de `package.json` ou usar variável de ambiente.

---

### 🟢 L-03: Navegação por teclado no carrossel `[ACESSIBILIDADE]`

- [ ] **Corrigir**
- **Arquivo:** `app/(public)/page.tsx`
- **Problema:** Indicadores do carrossel não têm `tabIndex` para navegação por teclado.
- **Correção:** Adicionar `tabIndex={0}` e handler `onKeyDown` para Enter/Space.

---

### 🟢 L-04: Logging de dados sensíveis no console `[SEGURANÇA]`

- [ ] **Corrigir** (múltiplos arquivos)
- **Problema:** Alguns `console.error` logam dados completos do formulário que podem conter informações sensíveis.
- **Correção:** Logar apenas IDs e mensagens de erro, nunca dados de formulário completos.

---

### 🟢 L-05: Magic numbers sem constantes nomeadas `[MELHORIA]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/schedule/calendar/_components/appointment-modal.tsx`
- **Problema:** `30000` (timeout), `5000` (delay), `500` (delay) sem nomes descritivos.
- **Correção:** Extrair para constantes nomeadas (`WEBHOOK_TIMEOUT_MS`, `WEBHOOK_DELAY_BETWEEN_MS`, etc).

---

### 🟢 L-06: Títulos de páginas sem breakpoints responsivos `[RESPONSIVIDADE]`

- [ ] **Corrigir `activity/page.tsx`**
- [ ] **Corrigir `model/page.tsx`**
- **Problema:** Títulos com `text-2xl` podem ser grandes demais em mobile.
- **Correção:** Usar `text-xl sm:text-2xl`.

---

### 🟢 L-07: Card max-width pode ser muito estreito `[RESPONSIVIDADE]`

- [ ] **Corrigir**
- **Arquivo:** `app/(panel)/dashboard/configurations/model/page.tsx`
- **Problema:** `max-w-sm` pode ser estreito para formulários com muitos campos.
- **Correção:** Usar `max-w-sm sm:max-w-md md:max-w-lg`.

---

### 🟢 L-08: Falta de validação de agendamento duplicado por email `[LÓGICA]`

- [ ] **Avaliar necessidade**
- **Arquivo:** `app/(public)/agendamento/[token]/_actions/create-public-appointment.ts`
- **Problema:** Não verifica se o mesmo email já tem agendamento no mesmo horário.
- **Impacto:** Possíveis agendamentos duplicados acidentais.
- **Correção:** Verificar se existe agendamento com mesmo email + data + hora antes de criar.

---

### 🟢 L-09: Validação de telefone brasileiro incompleta `[LÓGICA]`

- [ ] **Corrigir**
- **Arquivo:** `app/(public)/agendamento/[token]/_components/public-appointment-modal.tsx`
- **Problema:** Aceita até 11 dígitos mas não valida formato brasileiro (DDD + 9 dígitos).
- **Correção:** Validar com regex `/^\d{10,11}$/` e verificar DDD válido.

---

## 3. PLANEJAMENTO - Melhorias de Sistema

### 🔵 P-01: Implementar proteção contra replay attacks no webhook

- [ ] **Implementar**
- **Descrição:** Adicionar validação de timestamp e nonce no webhook para evitar que requisições antigas sejam reenviadas.
- **Abordagem:** Usar header `x-webhook-timestamp` + `x-webhook-nonce` com tolerância de 5 minutos e armazenamento de nonces usados.

---

### 🔵 P-02: Implementar validação HMAC no webhook

- [ ] **Implementar**
- **Descrição:** Adicionar assinatura HMAC para garantir que apenas requisições legítimas sejam processadas.
- **Abordagem:** Gerar `WEBHOOK_SECRET`, calcular HMAC-SHA256 do payload e comparar com header `x-webhook-signature`.

---

### 🔵 P-03: Criar logger estruturado para produção

- [ ] **Implementar**
- **Descrição:** Substituir `console.log/warn/error` por um logger que não exponha dados sensíveis em produção.
- **Abordagem:** Criar `lib/logger.ts` que filtre dados sensíveis e, futuramente, integre com serviço como Sentry ou Datadog.

---

### 🔵 P-04: Implementar rate limiting via middleware

- [ ] **Implementar**
- **Descrição:** Adicionar rate limiting global via Next.js middleware para proteger todas as rotas.
- **Abordagem:** Criar `middleware.ts` que aplique limites diferenciados por tipo de rota (auth, API, público).

---

### 🔵 P-05: Adicionar testes unitários para lógica de timezone

- [ ] **Implementar**
- **Descrição:** Testar funções de `utils/date-timezone.ts` e lógica de conflito de horários.
- **Abordagem:** Criar testes em `tests/` cobrindo edge cases como DST, meia-noite, fusos diferentes.

---

### 🔵 P-06: Adicionar testes de segurança automatizados

- [ ] **Implementar**
- **Descrição:** Testes que validem autenticação/autorização em todas as server actions e API routes.
- **Abordagem:** Testar que chamadas sem auth retornam 401, chamadas com userId errado retornam 403.

---

### 🔵 P-07: Implementar sistema de notificação de tentativas de invasão

- [ ] **Implementar**
- **Descrição:** Quando rate limiting bloqueia um IP ou há tentativas repetidas de acesso não autorizado, enviar alerta ao admin.
- **Abordagem:** Integrar com `lib/security-log.ts` e adicionar envio de email/notificação para alertas críticos.

---

### 🔵 P-08: Padronizar componente de modal responsivo

- [ ] **Implementar**
- **Descrição:** Criar componente wrapper de Dialog que já inclua responsividade e acessibilidade.
- **Abordagem:** Criar `components/ui/responsive-dialog.tsx` com `w-full max-w-[calc(100vw-2rem)]` por padrão.

---

### 🔵 P-09: Implementar grid responsivo reutilizável para horários

- [ ] **Implementar**
- **Descrição:** Criar componente `TimeGrid` que já tenha `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` por padrão.
- **Abordagem:** Extrair a grid de horários que se repete em 4+ componentes para um componente reutilizável.

---

### 🔵 P-10: Migrar NEXT_PUBLIC_BASE_N8N para variável server-only

- [ ] **Implementar**
- **Descrição:** Renomear `NEXT_PUBLIC_BASE_N8N` para `BASE_N8N` e garantir que nunca seja exposta no bundle do cliente.
- **Abordagem:** Atualizar `.env.local`, server actions e API routes. A chamada do webhook no modal já passa pela API route.

---

### 🔵 P-11: Adicionar validação de CEP via API externa

- [ ] **Avaliar necessidade**
- **Descrição:** Além de validar formato, consultar ViaCEP para verificar se o CEP existe.
- **Abordagem:** Já existe `utils/cep.ts` — integrar na validação do `update-address.ts`.

---

### 🔵 P-12: Implementar soft-delete para serviços e funcionários

- [ ] **Avaliar necessidade**
- **Descrição:** Ao invés de deletar serviços/funcionários que têm agendamentos, marcá-los como inativos.
- **Abordagem:** Adicionar campo `deletedAt` nos models e filtrar nas queries.

---

## 4. FUTURO - Funcionalidades Planejadas

> Funcionalidades novas que serão desenvolvidas em versões futuras do sistema.

### 🟣 F-01: Impedir agendamento de serviço no mesmo horário (validação de conflito)

- [ ] **Implementar**
- **Prioridade:** Alta
- **Descrição:** Reforçar validação de conflito para cobrir todos os cenários de sobreposição de duração.
- **Abordagem:**
  - Validar no servidor se já existe agendamento que se sobrepõe considerando a duração
  - Usar transação Prisma para atomicidade
  - Feedback claro ao usuário quando houver conflito

---

### 🟣 F-02: Botão para alterar ou cancelar agendamento

- [ ] **Implementar**
- **Prioridade:** Alta
- **Descrição:** Permitir que o administrador (e opcionalmente o cliente) altere ou cancele agendamentos existentes.
- **Abordagem:**
  - Botões "Editar" e "Cancelar" na visualização diária do calendário
  - Server actions: `update-appointment.ts` e `cancel-appointment.ts`
  - Notificação ao cliente (email + WhatsApp via webhook)
  - Status: `confirmed`, `cancelled`, `rescheduled`
  - Visual diferente para cancelados (tachado/opacidade)

---

### 🟣 F-03: Lembrete automático ao cliente sobre agendamento

- [ ] **Implementar**
- **Prioridade:** Alta
- **Descrição:** Enviar lembrete automático (WhatsApp + email) antes do horário do agendamento (24h e 1h antes).
- **Abordagem:**
  - Modelo `ReminderSchedule` no Prisma para controlar envios
  - Integração com N8N via webhook
  - Configuração por empresa (habilitar/desabilitar, antecedência)
  - Página em `/dashboard/configurations/notifications`

---

### 🟣 F-04: Integração com Taxidog

- [ ] **Implementar**
- **Prioridade:** Média
- **Descrição:** Transporte de pets (pet shops e clínicas veterinárias).
- **Abordagem:**
  - Opção "Taxidog" como serviço complementar no agendamento
  - Campos: endereço de busca, horário, observações
  - Notificação ao motorista via webhook/WhatsApp
  - Configuração em `/dashboard/configurations/taxidog`

---

### 🟣 F-05: Planilha única com acesso público (relatórios)

- [ ] **Implementar**
- **Prioridade:** Média
- **Descrição:** Visualização pública da agenda em formato de planilha/tabela.
- **Abordagem:**
  - Rota `/agenda/[token]/planilha` com calendário semanal/mensal
  - Apenas horários disponíveis/ocupados (sem dados pessoais)
  - Exportação CSV/PDF
  - Opção de embed (iframe)
  - Configuração por empresa

---

### 🟣 F-06: Sistema de venda de produtos

- [ ] **Implementar**
- **Prioridade:** Baixa (versão futura)
- **Descrição:** Módulo completo para venda de produtos com gestão de estoque.
- **Abordagem:**
  - **Fase 1** — Cadastro: modelo `Product`, CRUD, página `/dashboard/products`
  - **Fase 2** — Carrinho: modelo `Sale`/`SaleItem`, PDV simplificado, controle de estoque
  - **Fase 3** — Integração: vender produtos durante agendamento, relatório unificado
  - **Fase 4** — Pagamento: gateway (Stripe, Mercado Pago), página pública

---

## 5. Checklist de Verificação Final

### Lógica

- [ ] Race conditions no rate limiting tratadas (upsert)
- [ ] Verificação de agendamentos antes de deletar serviços/funcionários/feriados
- [ ] Timezone de São Paulo usado consistentemente no dashboard
- [ ] IDs gerados com `crypto.randomUUID()` ou Prisma `cuid()`
- [ ] Índices no banco para consultas frequentes

### Responsividade

- [ ] Modais de confirmação com largura responsiva
- [ ] Altura máxima de scroll responsiva em cards
- [ ] Padding/spacing responsivo no dashboard
- [ ] Títulos com tamanhos responsivos

### Acessibilidade

- [ ] `aria-label` em botões do calendário
- [ ] `aria-label` em botões de seleção de horário
- [ ] Touch targets mínimo 44x44px
- [ ] Navegação por teclado no carrossel

### UI/UX

- [ ] `maxLength` em todos os inputs de formulário
- [ ] Versão e copyright atualizados
- [ ] Magic numbers extraídos para constantes

### Documentação

- [ ] Versão consistente em package.json, footer e documentação
- [ ] Todas as correções refletidas nos .md do projeto

---

## 6. Roadmap Resumido

| Fase | Itens | Foco |
|---|---|---|
| ~~**Concluído**~~ | ~~C-01 a C-06, H-01 a H-16~~ | ~~Segurança crítica e alta~~ |
| **Próximo** | M-01 a M-15 | Robustez, responsividade e acessibilidade |
| **Refinamento** | L-01 a L-09 | Boas práticas e UX |
| **Infraestrutura** | P-01 a P-12 | Arquitetura e testes |
| **Versão 1.1** | F-01, F-02, F-03 | Conflito, cancelamento, lembrete |
| **Versão 1.2** | F-04, F-05 | Taxidog, planilha pública |
| **Versão 2.0** | F-06 | Venda de produtos |

---

**Fim do Plano de Correções e Melhorias**

**Concluídos:** 6 CRITICAL + 16 HIGH = **22 itens**
**Pendentes:** 15 MEDIUM | 9 LOW | 12 PLANEJAMENTO | 6 FUTURO = **42 itens**
**Total original:** 64 itens
