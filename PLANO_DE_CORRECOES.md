# Agenda System — Plano de Correções e Melhorias

> **Versão:** 0.9.0 | **Atualizado:** 16/02/2026 | **Autor:** Henrique Ferraz
> **Detalhamento técnico:** [PLANO_DE_CORRECOES_DETALHADO.md](./PLANO_DE_CORRECOES_DETALHADO.md)

---

## Status Geral

| Categoria | Qtd | Status |
|---|:---:|:---:|
| Funcionalidades core (F-xx) | 7 | Planejado |
| Funcionalidades competitivas (AC-xx) | 17 | Planejado |
| **Total restante** | **24** | |

### Modelo de Negócio

| Componente | Descrição |
|---|---|
| **Trial gratuito (F-09)** | 30 dias grátis com todas as funcionalidades + add-ons liberados |
| **Plano Ilimitado** | R$75/mês — sem limite de uso, 7 funcionalidades novas + tudo já implementado |
| **Add-ons avulsos** | ~R$19,90/mês cada — 17 funcionalidades contratadas conforme necessidade |

### Distribuição por Plano

| Plano | Qtd | Features |
|---|:---:|---|
| Ilimitado (R$75/mês) | 8 | F-03, F-07, F-08, F-09, AC-05, AC-07, AC-08, AC-09 |
| Add-on avulso (~R$19,90/mês) | 17 | AC-02, AC-02+, AC-03, AC-06, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, F-04, F-05, F-06, API |

---

## Novas Funcionalidades

### v1.0 — Funcionalidades

| ID | Funcionalidade | Prioridade | Plano | Depende de |
|:---:|---|:---:|:---:|:---:|
| F-03 | Lembretes automáticos 24h/1h antes (via N8N) | Alta | Ilimitado | — |
| F-07 | Mensagens WhatsApp do profissional para clientes (via N8N) | Alta | Ilimitado | — |
| F-08 | Autogestão do cliente — cancelar / reagendar pelo próprio cliente | Alta | Ilimitado | — |
| F-09 | Trial de 30 dias — acesso completo gratuito para novos usuários | Alta | Ilimitado | — |

> Confirmação WhatsApp + Email no momento do agendamento **já funciona**.
> F-01 (Validação de conflito de horários) **já implementado** — conflito de funcionário e cliente com sobreposição de intervalos.
> F-02 (Gestão de agendamentos pelo profissional) **já implementado** — editar, cancelar, reagendar + core compartilhado + AppointmentHistory + UI completa.
> F-07 e F-08 reutilizam o **core de lógica** criado por F-02 (cancelar, reagendar, liberar vaga). Podem ser implementados em paralelo.
> Detalhamento completo: [PLANO_DE_CORRECOES_DETALHADO.md § 1](./PLANO_DE_CORRECOES_DETALHADO.md#1-funcionalidades-core--v10)

| ID | Quem age | O que faz | Notifica |
|:---:|---|---|---|
| F-07 | Profissional (painel) | Envia mensagens WhatsApp individual/massa — reutiliza core F-02 | Clientes (via n8n) |
| F-08 | Cliente (link público) | Cancela ou reagenda seu próprio agendamento — reutiliza core F-02 | Profissional (via n8n) |

### v1.1 — Pagamentos e Mobilidade

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-02 | Pagamento online (Stripe + Mercado Pago) | Alta | Add-on R$29,90 |
| AC-02+ | Pagamento multi-gateway completo (6 provedores) | Alta | Add-on R$19,90 |
| AC-05 | PWA (Progressive Web App) | Alta | Ilimitado |
| AC-07 | QR Code de agendamento | Média | Ilimitado |
| AC-08 | Exportação CSV/PDF | Média | Ilimitado |

**Gateways planejados:**

| Gateway | Métodos | Fase | Add-on |
|---|---|:---:|:---:|
| **Stripe** | Cartão, PIX, Apple Pay, Google Pay | 2 | AC-02 (R$29,90) |
| **Mercado Pago** | PIX, cartão, boleto | 2 | AC-02 (R$29,90) |
| **Asaas** | PIX, boleto, cartão, recorrência | 3 | AC-02+ (R$19,90) |
| **PagSeguro** | PIX, cartão, boleto, débito | 3 | AC-02+ (R$19,90) |
| **InfinitePay** | PIX, cartão, link de pagamento | 4 | AC-02+ (R$19,90) |
| **Banco Cora** | PIX, boleto, cobranças | 4 | AC-02+ (R$19,90) |

### v1.2 — Integrações

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-03 | Sync Google Calendar (bidirecional) | Alta | Add-on R$14,90 |
| AC-10 | Agendamentos recorrentes | Média | Add-on R$14,90 |
| AC-11 | Permissões por profissional | Média | Add-on R$19,90 |
| F-04 | Integração Taxidog | Média | Add-on R$19,90 |

### v1.3 — Engajamento

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-09 | Avaliações e feedback de clientes | Média | Ilimitado |
| AC-13 | Cupons e promoções | Baixa | Add-on R$14,90 |
| AC-14 | Programa de fidelidade | Baixa | Add-on R$19,90 |
| AC-16 | Lista de espera | Baixa | Add-on R$14,90 |

### v2.0 — Expansão

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-06 | Gestão financeira | Média | Add-on R$29,90 |
| AC-12 | Múltiplas localizações | Média | Add-on R$24,90 |
| F-06 | Venda de produtos (multi-gateway) | Baixa | Add-on R$24,90 |
| AC-17 | Formulários customizados (anamnese) | Baixa | Add-on R$19,90 |

### v3.0 — Avançado

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-15 | Teleconsulta (Meet / Zoom) | Baixa | Add-on R$24,90 |
| AC-18 | Templates de página de agendamento | Baixa | Add-on R$14,90 |
| F-05 | Planilha pública / relatórios | Média | Add-on R$14,90 |
| — | API pública (Swagger) | Baixa | Add-on R$29,90 |

---

## Plano Ilimitado — R$75/mês

Perfil: cabeleireiro com seu salão, profissional autônomo, pequeno negócio de serviços. Tudo que precisa para operar no dia a dia sem limitações.

**Inclui tudo já implementado:**

- Agendamento público com calendário mensal/diário
- Gestão de agendamentos: cancelar, reagendar, editar (F-02)
- Validação inteligente de conflitos de horário (F-01)
- CRUD de serviços e funcionários
- Dashboard com estatísticas em tempo real
- Confirmação automática via WhatsApp e Email
- Feriados e dias de folga
- Tarefas/lembretes
- Segurança completa (JWT, rate limit, audit, HMAC)

**Inclui funcionalidades planejadas:**

| ID | Funcionalidade | Justificativa |
|:---:|---|---|
| F-03 | Lembretes automáticos 24h/1h | Reduz faltas em até 50%. Todo profissional precisa |
| F-07 | Mensagens WhatsApp individual/massa | Comunicação ativa com clientes. Essencial para avisos e promoções |
| F-08 | Autogestão do cliente (cancelar/reagendar via link) | Reduz trabalho manual. Cliente resolve sozinho |
| AC-05 | PWA (acesso mobile) | Acesso pelo celular é essencial em 2026 |
| AC-07 | QR Code de agendamento | Marketing básico — cartão de visita, balcão |
| AC-08 | Exportação CSV/PDF | Contabilidade e controle básico |
| AC-09 | Avaliações e feedback de clientes | Reputação online e melhoria contínua do serviço |
| F-09 | Trial de 30 dias (acesso total gratuito) | Conversão de leads. Usuário experimenta tudo antes de pagar |

---

## Add-ons Avulsos

Cada add-on é contratado separadamente conforme a necessidade. Preço médio de ~R$19,90/mês.

### Marketing e Retenção

| ID | Add-on | Preço |
|:---:|---|:---:|
| AC-13 | Cupons e promoções | R$14,90 |
| AC-14 | Programa de fidelidade | R$19,90 |

### Pagamentos e Financeiro

| ID | Add-on | Preço |
|:---:|---|:---:|
| AC-02 | Pagamento online (Stripe + Mercado Pago) | R$29,90 |
| AC-02+ | Multi-gateway (4 gateways adicionais) | R$19,90 |
| AC-06 | Gestão financeira | R$29,90 |
| F-06 | Venda de produtos | R$24,90 |

### Integração e Produtividade

| ID | Add-on | Preço |
|:---:|---|:---:|
| AC-03 | Google Calendar sync | R$14,90 |
| AC-10 | Agendamentos recorrentes | R$14,90 |
| AC-11 | Permissões por profissional | R$19,90 |
| AC-16 | Lista de espera | R$14,90 |

### Avançado e Nicho

| ID | Add-on | Preço |
|:---:|---|:---:|
| AC-12 | Múltiplas localizações | R$24,90 |
| AC-17 | Formulários customizados (anamnese) | R$19,90 |
| AC-15 | Teleconsulta (Meet/Zoom) | R$24,90 |
| AC-18 | Templates de página | R$14,90 |
| F-05 | Planilha pública / relatórios | R$14,90 |
| F-04 | Integração Taxidog | R$19,90 |
| — | API pública (Swagger) | R$29,90 |

### Simulação de Cenários

| Cenário | Plano | Add-ons | Total |
|---|:---:|---|:---:|
| Cabeleireiro autônomo | R$75 | — | **R$75/mês** |
| Salão com 3 funcionários | R$75 | Permissões (R$19,90) + Google Cal (R$14,90) | **R$109,80/mês** |
| Salão completo com pagamento | R$75 | Permissões + Pagamento + Fidelidade | **R$144,70/mês** |
| Clínica estética full | R$75 | Permissões + Pagamento + Financeiro + Formulários + Teleconsulta + Fidelidade | **R$219,40/mês** |

---

## Pricing (referência concorrentes)

| Aspecto | Reservio | SimplyBook.me | Simples Agenda | **Agenda** |
|---|---|---|---|---|
| Modelo | 3 planos fixos | 3 planos + add-ons | 3 planos fixos | **1 plano + add-ons** |
| Entrada | Grátis (40/mês) | Grátis (50/mês) | ~R$49 | **Trial grátis → R$75** |
| Funcionalidades avulsas | Não | Sim | Não | **Sim (17 add-ons)** |
| Limite de agendamentos | Sim (no grátis) | Sim (no grátis) | Sim | **Não (ilimitado)** |
| Flexibilidade | Baixa | Alta | Baixa | **Alta** |

> **Vantagem competitiva:** O cliente paga pelo que usa. Não precisa pagar um plano caro para ter 1 funcionalidade específica. Modelo mais justo e transparente.

---

## Concorrentes

| # | Concorrente | URL | Segmento |
|:---:|---|---|---|
| 1 | **Clínica Experts** | https://clinicaexperts.com.br/ | Clínicas de saúde |
| 2 | **Simples Agenda** | https://www.simplesagenda.com.br/ | PMEs |
| 3 | **Calenddar** | https://calenddar.com.br/ | Agenda |
| 4 | **Reservio** | https://www.reservio.com/ | Serviços |
| 5 | **SimplyBook.me** | https://simplybook.me/ | Serviços |
| 6 | **Agenda Serviço** | https://agendaservico.link/ | Autônomos |

### Quadro Comparativo — O que JÁ temos

| Funcionalidade | Agenda | C.Exp | S.Ag | Cal | Res | Simpl | Ag.S |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Agendamento público | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendário mensal/diário | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRUD serviços + funcionários | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ⚠️ |
| Feriados / dias de folga | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Dashboard + estatísticas | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Auth JWT + OTP + lockout | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Rate limit + security log | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Rate limit middleware global | ✅ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ |
| Logger estruturado c/ filtro | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ |
| HMAC + anti-replay (webhook) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Alerta de intrusão | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Soft-delete (auditoria) | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ❌ |
| Gestão de agendamentos (F-02) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Confirmação WhatsApp (N8N) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Confirmação Email (SMTP) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Webhook N8N | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| CPF/CNPJ + CEP automático | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Validação CEP via API | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Quadro Comparativo — O que PLANEJAMOS

| Funcionalidade | Versão | Plano | C.Exp | S.Ag | Res | Simpl | Ag.S |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lembretes pré-agendamento | **1.0** | Ilimitado | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mensagens WhatsApp (individual/massa) | **1.0** | Ilimitado | ❌ | ⚠️ | ❌ | ✅ | ❌ |
| Autogestão do cliente (cancelar/reagendar) | **1.0** | Ilimitado | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Avaliações de clientes | **1.3** | Ilimitado | ❌ | ❌ | ✅ | ✅ | ❌ |
| Pagamento online (Stripe + MP) | **1.1** | Add-on R$29,90 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-gateway completo (6 provedores) | **1.1** | Add-on R$19,90 | ❌ | ❌ | ❌ | ❌ | ❌ |
| PWA / mobile | **1.1** | Ilimitado | ✅ | ✅ | ✅ | ✅ | ❌ |
| QR code | **1.1** | Ilimitado | ❌ | ❌ | ✅ | ✅ | ✅ |
| Exportação CSV/PDF | **1.1** | Ilimitado | ❌ | ✅ | ❌ | ❌ | ✅ |
| Google Calendar sync | **1.2** | Add-on R$14,90 | ❌ | ❌ | ✅ | ✅ | ✅ |
| Agendamentos recorrentes | **1.2** | Add-on R$14,90 | ❌ | ❌ | ✅ | ✅ | ❌ |
| Permissões por profissional | **1.2** | Add-on R$19,90 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cupons / promoções | **1.3** | Add-on R$14,90 | ❌ | ❌ | ✅ | ✅ | ❌ |
| Fidelidade | **1.3** | Add-on R$19,90 | ❌ | ❌ | ✅ | ✅ | ❌ |
| Lista de espera | **1.3** | Add-on R$14,90 | ❌ | ❌ | ❌ | ✅ | ❌ |
| Gestão financeira | **2.0** | Add-on R$29,90 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Múltiplas localizações | **2.0** | Add-on R$24,90 | ✅ | ❌ | ✅ | ✅ | ❌ |
| Teleconsulta | **3.0** | Add-on R$24,90 | ✅ | ❌ | ❌ | ✅ | ✅ |

### Nossos Diferenciais

| Diferencial | Concorrentes com algo similar |
|---|:---:|
| Mensagens WhatsApp individual/massa com cancelar/reagendar interativo | Apenas SimplyBook.me (parcial) |
| Autogestão do cliente via link público + WhatsApp interativo (sem login) | Parcial em alguns |
| Integração N8N (automação customizável) | Apenas SimplyBook.me |
| CPF/CNPJ + CEP automático + validação via API | Nenhum completo |
| Segurança enterprise (rate limit, lockout, audit, HMAC) | Raro em BR |
| Logger estruturado com filtro automático de dados sensíveis | Nenhum |
| Anti-replay attacks (timestamp + nonce) no webhook | Nenhum |
| Alerta automático de tentativas de invasão | Nenhum |
| Multi-gateway 6 provedores (planejado) | Nenhum com 6 |
| Integração Taxidog (planejado) | Nenhum |
| Modelo 1 plano + add-ons à la carte (flexibilidade) | Apenas SimplyBook.me |

---

## Organograma

```
              AGENDA SYSTEM — ROADMAP (24 itens restantes)
═══════════════════════════════════════════════════════════

 🔨 FUNDAÇÃO       v1.0      4 itens
    F-03  Lembretes automáticos (via N8N) .............. [Ilimitado]
    F-07  Mensagens WhatsApp profissional → clientes ... [Ilimitado]
    │     (individual/massa — reutiliza core F-02)
    F-08  Autogestão do cliente → cancelar/reagendar ... [Ilimitado]
    │     (público, sem login — reutiliza core F-02)
    F-09  Trial de 30 dias (acesso total gratuito) ..... [Ilimitado]
    │     (todas funcionalidades + add-ons liberados)
    │
    │  F-07 + F-08 podem ser implementados em paralelo
    │  F-09 deve ser implementado antes do lançamento
    │  ✅ F-01 Conflito de horários — IMPLEMENTADO
    │  ✅ F-02 Gestão de agendamentos — IMPLEMENTADO

 💳 PAGAMENTOS     v1.1      4 itens
    AC-02 Stripe + Mercado Pago .............. [Add-on R$29,90]
    AC-02+ Multi-gateway (4 adicionais) ...... [Add-on R$19,90]
          ├─ Asaas + PagSeguro
          └─ InfinitePay + Banco Cora
    AC-05 PWA ................................ [Ilimitado]
    AC-07 QR Code ............................ [Ilimitado]
    AC-08 Exportação CSV/PDF ................. [Ilimitado]

 🔗 INTEGRAÇÕES    v1.2      4 itens
    AC-03 Google Calendar .................... [Add-on R$14,90]
    AC-10 Recorrência ........................ [Add-on R$14,90]
    AC-11 Permissões ......................... [Add-on R$19,90]
    F-04  Taxidog ............................ [Add-on R$19,90]

 🎯 ENGAJAMENTO    v1.3      4 itens
    AC-09 Avaliações ......................... [Ilimitado]
    AC-13 Cupons ............................. [Add-on R$14,90]
    AC-14 Fidelidade ......................... [Add-on R$19,90]
    AC-16 Lista de espera .................... [Add-on R$14,90]

═══════════════════════════════════════════════════════════

 📈 EXPANSÃO       v2.0      4 itens
    AC-06 Financeiro ......................... [Add-on R$29,90]
    AC-12 Multi-local ........................ [Add-on R$24,90]
    F-06  Produtos ........................... [Add-on R$24,90]
    AC-17 Formulários ........................ [Add-on R$19,90]

 🚀 AVANÇADO       v3.0      4 itens
    AC-15 Teleconsulta ....................... [Add-on R$24,90]
    AC-18 Templates .......................... [Add-on R$14,90]
    F-05  Planilha pública ................... [Add-on R$14,90]
    ───   API pública ........................ [Add-on R$29,90]

═══════════════════════════════════════════════════════════
```

### Cronograma

| Fase | Versão | Itens | Estimativa |
|---|:---:|:---:|---|
| **Fundação** | **1.0** | **4** | **3-4 semanas** |
| Pagamentos | 1.1 | 4 | 6-8 semanas |
| Integrações | 1.2 | 4 | 4-6 semanas |
| Engajamento | 1.3 | 4 | 3-4 semanas |
| Expansão | 2.0 | 4 | 6-8 semanas |
| Avançado | 3.0 | 4 | 6-8 semanas |

**Total:** 24 itens — ~26-40 semanas (6-10 meses)
