# Agenda System — Detalhamento Técnico de Correções e Melhorias

> **Versão:** 0.9.0 | **Atualizado:** 24/02/2026 | **Autor:** Henrique Ferraz
> **Resumo:** [PLANO_DE_CORRECOES.md](./PLANO_DE_CORRECOES.md)

Este documento contém o detalhamento técnico completo de todas as **20 funcionalidades pendentes** do plano.

### Modelo de Negócio: Plano Ilimitado + Add-ons

| Componente | Qtd | Features |
|---|:---:|---|
| **Plano Ilimitado** (R$75/mês) | 4 | AC-05, AC-07, AC-08, AC-09 |
| **Add-ons avulsos** (R$9,99/mês cada) | 17 | AC-02, AC-02+, AC-03, AC-06, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, F-04, F-05, F-06, API |

---

## Índice

1. [Pagamentos Multi-Gateway — v1.1](#1-pagamentos-multi-gateway--v11)
2. [Mobilidade e Ferramentas — v1.1](#2-mobilidade-e-ferramentas--v11)
3. [Integrações e Produtividade — v1.2](#3-integrações-e-produtividade--v12)
4. [Engajamento e Retenção — v1.3](#4-engajamento-e-retenção--v13)
5. [Expansão — v2.0](#5-expansão--v20)
6. [Avançado — v3.0](#6-avançado--v30)
7. [Análise Detalhada de Concorrentes](#7-análise-detalhada-de-concorrentes)
8. [Backlog Priorizado (RICE) — 90 dias](#8-backlog-priorizado-rice--90-dias)
9. [Checklist de Verificação Final](#9-checklist-de-verificação-final)

---

## 1. Pagamentos Multi-Gateway — v1.1

### AC-02: Pagamento Online Integrado

- **Plano:** Add-on R$9,99/mês (Stripe + Mercado Pago) + Add-on R$9,99/mês (4 gateways adicionais)
- **Presente em:** 4/5 concorrentes
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

## 2. Mobilidade e Ferramentas — v1.1

### AC-05: PWA (Progressive Web App)

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 4/5 concorrentes (Clínica Experts, Simples Agenda, Reservio, SimplyBook.me)
- **Justificativa incluso:** Acesso mobile é expectativa mínima em 2026. Alternativa viável a app nativo sem custo de stores.
- **Descrição:** Transformar o sistema em PWA para acesso mobile sem publicação em stores.
- **Abordagem:**
  - **Fase 1:** `manifest.json` com ícones, nome, cores + service worker básico para cache de assets estáticos
  - **Fase 2:** Notificações push via Web Push API (novo agendamento, lembrete, cancelamento)
  - **Fase 3:** Modo offline com cache da agenda do dia atual (service worker + IndexedDB)
- **Vantagem:** Não requer conta de desenvolvedor Apple/Google, instalação instantânea via navegador

### AC-07: QR Code para Agendamento

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 2/5 concorrentes (Reservio, SimplyBook.me)
- **Justificativa incluso:** Baixo custo de implementação, alto valor percebido. Feature "wow" para marketing (cartões de visita, balcão).
- **Descrição:** Gerar QR code que aponta para a página pública de agendamento (`/agendamento/[token]`).
- **Abordagem:**
  - Usar lib `qrcode` (npm) para gerar QR code no servidor
  - Exibir no dashboard (card) e em `/dashboard/configurations`
  - Opção de download em PNG (para digital) e SVG (para impressão)
  - Personalização: incluir logo no centro do QR code (opcional)

### AC-08: Exportação de Dados (CSV/PDF)

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 1/5 concorrentes (Simples Agenda)
- **Justificativa incluso:** Feature operacional básica. Profissionais precisam extrair dados para contabilidade. Custo de implementação baixo.
- **Descrição:** Exportar agendamentos, lista de clientes e relatórios.
- **Abordagem:**
  - Botão "Exportar" nas listagens de agendamentos e clientes
  - **CSV:** usar `papaparse` para gerar dados tabulares (agendamento, data, horário, cliente, serviço, funcionário, status)
  - **PDF:** usar `jspdf` ou `@react-pdf/renderer` para relatórios formatados com cabeçalho, filtros aplicados e totais
  - Filtros: período (data início/fim), serviço, funcionário, status
  - Server action que gera o arquivo e retorna como download

---

## 3. Integrações e Produtividade — v1.2

### AC-03: Sincronização com Google Calendar

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Reservio, SimplyBook.me)
- **Justificativa add-on:** Sempre em planos premium nos concorrentes. Alta demanda de profissionais que usam Google Calendar.
- **Descrição:** Sync bidirecional com Google Calendar para evitar conflitos de agenda pessoal/profissional.
- **Abordagem:**
  - Integração via Google Calendar API v3 com OAuth 2.0
  - Sync bidirecional: agendamentos do Agenda aparecem no Google Calendar e eventos do Google bloqueiam horários no Agenda
  - Configuração por funcionário (cada um conecta sua conta Google)
  - Opção de sync apenas leitura (ver Google no Agenda) ou completo (criar eventos no Google)
  - Webhook do Google Calendar para eventos em tempo real (ou polling a cada 5 minutos)

### AC-10: Agendamentos Recorrentes

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Reservio, SimplyBook.me)
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

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 4/5 concorrentes
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

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 0/5 concorrentes
- **Justificativa add-on:** Nicho específico (pet shops). Cobrado avulso conforme necessidade.
- **Descrição:** Transporte de pets como serviço complementar (pet shops e clínicas veterinárias).
- **Abordagem:**
  - Opção "Taxidog" como serviço adicional selecionável no agendamento
  - Campos: endereço de busca, horário preferido, observações (porte, nome do pet)
  - Notificação ao motorista via webhook/WhatsApp (N8N)
  - Configuração em `/dashboard/configurations/taxidog` (habilitar/desabilitar, motoristas cadastrados)

---

## 4. Engajamento e Retenção — v1.3

### AC-09: Avaliações e Feedback

- **Plano:** Ilimitado (R$75/mês)
- **Presente em:** 2/5 concorrentes (Reservio, SimplyBook.me)
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

> Essas mensagens seguem o padrão: N8N cron → Next.js API → `sendGlobalMessage()` → N8N envia.

### AC-13: Cupons e Promoções

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Reservio, SimplyBook.me)
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

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Reservio, SimplyBook.me)
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

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 1/5 concorrentes (SimplyBook.me)
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

## 5. Expansão — v2.0

### AC-06: Gestão Financeira

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Clínica Experts, Simples Agenda)
- **Justificativa add-on:** Feature complexa. Clínica Experts e Simples Agenda cobram caro por isso.
- **Abordagem por fases:**
  - **Fase 1:** Relatório de receita por período (baseado em preço dos serviços agendados)
  - **Fase 2:** Fluxo de caixa simples (entradas automáticas dos agendamentos + saídas manuais)
  - **Fase 3:** Comissões por funcionário (% configurável por serviço, cálculo automático)
  - **Fase 4:** Dashboard financeiro com gráficos (receita mensal, comparativo, top serviços)

### AC-12: Múltiplas Localizações

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 3/5 concorrentes (Clínica Experts, Reservio, SimplyBook.me)
- **Justificativa add-on:** Sempre enterprise. Clínica Experts, Reservio e SimplyBook.me cobram em planos premium.
- **Abordagem:**
  - Modelo `Location`: id, userId, name, address, phone, workingHours (JSON)
  - Funcionários vinculados a uma ou mais localizações
  - Agendamento público: seleção de localização antes de escolher serviço
  - Dashboard com filtro por localização

### F-06: Venda de Produtos

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Clínica Experts, Simples Agenda)
- **Justificativa add-on:** E-commerce integrado. Alto custo de implementação, alto valor agregado.
- **Abordagem por fases:**
  - **Fase 1 — Cadastro:** Modelo `Product` (nome, preço, estoque, categoria, imagem), CRUD, página `/dashboard/products`
  - **Fase 2 — Carrinho:** Modelo `Sale`/`SaleItem`, PDV simplificado, controle de estoque (decremento automático)
  - **Fase 3 — Integração:** Vender produtos durante agendamento (serviço + produto = uma venda), relatório unificado
  - **Fase 4 — Pagamento:** Reutilizar módulo multi-gateway do AC-02 (Stripe, Mercado Pago, Asaas, PagSeguro, InfinitePay, Banco Cora), página pública de produtos

### AC-17: Formulários Customizados (Anamnese/Intake)

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Simples Agenda, SimplyBook.me)
- **Justificativa add-on:** Feature especializada. Simples Agenda e SimplyBook.me cobram em planos premium.
- **Abordagem:**
  - Modelo `FormTemplate`: id, userId, name, fields (JSON array com tipo, label, required, options)
  - Modelo `FormSubmission`: id, formTemplateId, appointmentId, answers (JSON), submittedAt
  - Builder de formulários no dashboard (drag & drop de campos: texto, seleção, checkbox, número, data)
  - Vinculação a serviços específicos (ex: anamnese só para consulta médica)
  - Cliente preenche antes ou durante o agendamento

---

## 6. Avançado — v3.0

### AC-15: Teleconsulta / Videochamada

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Clínica Experts, SimplyBook.me)
- **Justificativa add-on:** Feature complexa. Sempre premium em todos os concorrentes.
- **Abordagem:**
  - Integração com Google Meet ou Zoom via API
  - Ao criar agendamento com `isOnline: true`, gerar link de videochamada automaticamente
  - Incluir link no email de confirmação e no lembrete
  - No calendário: ícone de vídeo para agendamentos online

### AC-18: Templates de Página de Agendamento

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 2/5 concorrentes (Reservio, SimplyBook.me)
- **Justificativa add-on:** Personalização visual. Reservio tem 17 templates no premium.
- **Abordagem:**
  - Criar 3-5 templates visuais para `/agendamento/[token]` (minimal, classic, bold, elegant, modern)
  - Customização por empresa: cores primária/secundária, logo, banner, texto de boas-vindas
  - Seleção em `/dashboard/configurations/appearance`
  - Preview em tempo real antes de salvar

### F-05: Planilha Pública / Relatórios

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 0/5 concorrentes
- **Justificativa add-on:** Feature única nossa. Diferencial competitivo exclusivo.
- **Abordagem:**
  - Rota `/agenda/[token]/planilha` com calendário semanal/mensal em formato tabela
  - Apenas horários disponíveis/ocupados (sem dados pessoais dos clientes)
  - Exportação CSV/PDF da planilha
  - Opção de embed via iframe para sites externos
  - Configuração por empresa (habilitar/desabilitar, nível de detalhe)

### API Pública

- **Plano:** Add-on R$9,99/mês
- **Presente em:** 1/5 concorrentes (SimplyBook.me)
- **Justificativa add-on:** Sempre tier enterprise com rate limiting. Apenas SimplyBook.me oferece.
- **Abordagem:**
  - Documentação OpenAPI/Swagger em `/api/docs`
  - Autenticação via API key (gerada no dashboard)
  - Endpoints: agendamentos (CRUD), serviços (leitura), funcionários (leitura), disponibilidade (leitura)
  - Rate limiting específico para API (1000 req/dia no plano básico)
  - Webhook configurável (notificar URL externa em eventos)

---

## 7. Análise Detalhada de Concorrentes

### 7.1 Clínica Experts

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

### 7.2 Simples Agenda

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

### 7.3 Calenddar

- **URL:** https://calenddar.com.br/
- **Foco:** Organização inteligente de agenda.
- **Funcionalidades:**
  - Sistema de agendamento com interface simplificada
  - Organização de compromissos
  - (Conteúdo limitado no momento da análise)
- **Diferencial:** Interface minimalista e foco em simplicidade.

### 7.4 Reservio

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

### 7.5 SimplyBook.me

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

---

## 8. Backlog Priorizado (RICE) — 90 dias

### 8.1 Objetivo

Transformar a varredura competitiva em um plano executável de curto prazo, priorizando funcionalidades com maior retorno em receita, retenção e redução de ociosidade.

### 8.2 Metodologia de Priorização

- **RICE = (Reach x Impact x Confidence) / Effort**
- **Reach:** clientes potencialmente impactados no trimestre
- **Impact:** 0.25 (baixo), 0.5 (médio), 1 (alto), 2 (muito alto), 3 (massivo)
- **Confidence:** 0.0 a 1.0 conforme clareza técnica e de mercado
- **Effort:** semanas de desenvolvimento

### 8.3 Backlog Ranqueado

| Prioridade | Épico | Reach | Impact | Confidence | Effort (sem.) | Score RICE |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| 1 | Lista de espera inteligente + autopreenchimento | 700 | 2.0 | 0.85 | 3 | 396.7 |
| 2 | Distribuição social do link (UTM + botões sociais) | 950 | 0.75 | 0.90 | 2 | 320.6 |
| 3 | Campanhas automáticas de retenção (reativação/aniversário/retorno) | 900 | 1.5 | 0.80 | 4 | 270.0 |
| 4 | Pesquisa de satisfação pós-atendimento (NPS + review) | 800 | 1.0 | 0.90 | 3 | 240.0 |
| 5 | Fidelidade + cupons + gift card (módulo unificado) | 650 | 2.0 | 0.75 | 5 | 195.0 |
| 6 | POS leve + comandas/consumo + estoque automático | 500 | 2.0 | 0.70 | 7 | 100.0 |
| 7 | Secretária IA (MVP) para confirmação/reagendamento | 350 | 2.5 | 0.60 | 8 | 65.6 |

### 8.4 Recorte por Fase (90 dias)

#### Fase 1 (0-30 dias) — Quick Wins

1. **Distribuição social do link**
	- Compartilhamento nativo (WhatsApp/Instagram)
	- Parâmetros UTM para rastrear origem do agendamento
	- Métrica principal: crescimento de novos agendamentos por canal

2. **Lista de espera inteligente**
	- Fila por serviço/data
	- Notificação automática de vaga liberada via N8N
	- Expiração de oferta e avanço para próximo cliente
	- Métrica principal: taxa de preenchimento de cancelamentos

#### Fase 2 (31-60 dias) — Retenção

3. **Campanhas automáticas**
	- Fluxos: aniversário, inativo 30/60 dias, retorno pós-atendimento
	- Segmentação por perfil e histórico
	- Métrica principal: taxa de reativação e receita de reativados

4. **Pesquisa de satisfação (NPS + review)**
	- Envio automático pós-atendimento
	- Dashboard de satisfação por profissional/serviço
	- Métrica principal: NPS médio e taxa de resposta

#### Fase 3 (61-90 dias) — Monetização

5. **Fidelidade + cupons + gift card**
	- Unificação de regras promocionais e pontuação
	- Painel de saldo e resgate do cliente
	- Métrica principal: frequência de retorno e ticket médio

6. **POS leve + comandas + estoque**
	- Venda balcão + consumo por atendimento
	- Baixa automática de estoque e visão de ruptura
	- Métrica principal: redução de divergência de caixa e rupturas

### 8.5 Recomendação Estratégica

- **Paridade competitiva imediata:** lista de espera, campanhas de retenção e feedback
- **Vantagem comercial de curto prazo:** distribuição social do link com tracking
- **Diferenciação de médio prazo:** POS leve integrado ao fluxo de agendamento
- **Aposta avançada:** secretária IA em MVP controlado após estabilização operacional

### 8.6 Fontes usadas na varredura

- https://www.reservio.com/features
- https://simplybook.me/
- https://www.trinks.com/
- https://www.inbarberapp.com/
- https://appbarber.com.br/
- https://clinicaexperts.com.br/
- https://www.simplesagenda.com.br/site/conheca.php
- https://calenddar.com.br/

---

## 9. Checklist de Verificação Final

> Usar antes de cada release. Itens são removidos conforme implementados.

### Pré-v1.1 (Pagamentos e Mobilidade)

- [ ] Arquitetura multi-gateway com interface abstrata `PaymentProvider` (AC-02)
- [ ] Integração Stripe + Mercado Pago (AC-02)
- [ ] Integração Asaas + PagSeguro (AC-02+)
- [ ] Integração InfinitePay + Banco Cora (AC-02+)
- [ ] PWA com service worker e cache de assets (AC-05)
- [ ] QR Code para página de agendamento (AC-07)
- [ ] Exportação CSV/PDF de agendamentos e clientes (AC-08)

### Pré-v1.2 (Integrações e Produtividade)

- [ ] Sync bidirecional com Google Calendar (AC-03)
- [ ] Agendamentos recorrentes (AC-10)
- [ ] Permissões por profissional — login separado por funcionário (AC-11)
- [ ] Integração Taxidog (F-04)

### Pré-v1.3 (Engajamento e Retenção)

- [ ] Avaliações e feedback de clientes (AC-09)
- [ ] Cupons e promoções (AC-13)
- [ ] Programa de fidelidade (AC-14)
- [ ] Lista de espera (AC-16)

### Pré-v2.0 (Expansão)

- [ ] Gestão financeira — receita, fluxo de caixa, comissões (AC-06)
- [ ] Múltiplas localizações (AC-12)
- [ ] Venda de produtos — cadastro, PDV, estoque (F-06)
- [ ] Formulários customizados — anamnese/intake (AC-17)

### Pré-v3.0 (Avançado)

- [ ] Teleconsulta — Google Meet / Zoom (AC-15)
- [ ] Templates de página de agendamento (AC-18)
- [ ] Planilha pública / relatórios (F-05)
- [ ] API pública com Swagger + rate limiting

---

**Fim do Detalhamento Técnico — Agenda System v0.9.0 (20 funcionalidades pendentes)**
