# Agenda System — Plano de Correções e Melhorias

> **Versão:** 0.9.0 | **Atualizado:** 16/02/2026 | **Autor:** Henrique Ferraz
> **Detalhamento técnico:** [PLANO_DE_CORRECOES_DETALHADO.md](./PLANO_DE_CORRECOES_DETALHADO.md)

---

## Status Geral

| Categoria | Qtd | Status |
|---|:---:|:---:|
| Funcionalidades core | 6 | Planejado |
| Funcionalidades competitivas | 18 | Planejado |
| **Total** | **82** | |

---

## Novas Funcionalidades

### v1.0 — Fundação

| ID | Funcionalidade | Prioridade |
|:---:|---|:---:|
| F-01 | Validação de conflito de horários | Alta |
| F-02 | Editar / cancelar agendamentos | Alta |
| F-03 | Lembretes automáticos 24h/1h antes (via N8N) | Alta |

> Confirmação WhatsApp + Email no momento do agendamento **já funciona**.

### v1.1 — Pagamentos e Mobilidade

| ID | Funcionalidade | Prioridade |
|:---:|---|:---:|
| AC-02 | Pagamento online multi-gateway | Alta |
| AC-05 | PWA (Progressive Web App) | Alta |
| AC-07 | QR Code de agendamento | Média |
| AC-08 | Exportação CSV/PDF | Média |

**Gateways planejados:**

| Gateway | Métodos | Fase |
|---|---|:---:|
| **Stripe** | Cartão, PIX, Apple Pay, Google Pay | 2 |
| **Mercado Pago** | PIX, cartão, boleto | 2 |
| **Asaas** | PIX, boleto, cartão, recorrência | 3 |
| **PagSeguro** | PIX, cartão, boleto, débito | 3 |
| **InfinitePay** | PIX, cartão, link de pagamento | 4 |
| **Banco Cora** | PIX, boleto, cobranças | 4 |

### v1.2 — Integrações

| ID | Funcionalidade | Prioridade |
|:---:|---|:---:|
| AC-03 | Sync Google Calendar (bidirecional) | Alta |
| AC-10 | Agendamentos recorrentes | Média |
| AC-11 | Permissões por profissional | Média |
| F-04 | Integração Taxidog | Média |

### v1.3 — Engajamento

| ID | Funcionalidade | Prioridade |
|:---:|---|:---:|
| AC-09 | Avaliações e feedback de clientes | Média |
| AC-13 | Cupons e promoções | Baixa |
| AC-14 | Programa de fidelidade | Baixa |
| AC-16 | Lista de espera | Baixa |

### v2.0 — Expansão

| ID | Funcionalidade | Prioridade |
|:---:|---|:---:|
| AC-06 | Gestão financeira | Média |
| AC-12 | Múltiplas localizações | Média |
| F-06 | Venda de produtos (multi-gateway) | Baixa |
| AC-17 | Formulários customizados (anamnese) | Baixa |

### v3.0 — Avançado

| ID | Funcionalidade | Prioridade |
|:---:|---|:---:|
| AC-15 | Teleconsulta (Meet / Zoom) | Baixa |
| AC-18 | Templates de página de agendamento | Baixa |
| F-05 | Planilha pública / relatórios | Média |
| — | API pública (Swagger) | Baixa |

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
| Confirmação WhatsApp (N8N) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Confirmação Email (SMTP) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Webhook N8N | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| CPF/CNPJ + CEP automático | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Validação CEP via API | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Quadro Comparativo — O que PLANEJAMOS

| Funcionalidade | Versão | C.Exp | S.Ag | Res | Simpl | Ag.S |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Editar/cancelar agendamento | **1.0** | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lembretes pré-agendamento | **1.0** | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pagamento online (6 gateways) | **1.1** | ✅ | ✅ | ✅ | ✅ | ✅ |
| PWA / mobile | **1.1** | ✅ | ✅ | ✅ | ✅ | ❌ |
| QR code | **1.1** | ❌ | ❌ | ✅ | ✅ | ✅ |
| Exportação CSV/PDF | **1.1** | ❌ | ✅ | ❌ | ❌ | ✅ |
| Google Calendar sync | **1.2** | ❌ | ❌ | ✅ | ✅ | ✅ |
| Agendamentos recorrentes | **1.2** | ❌ | ❌ | ✅ | ✅ | ❌ |
| Permissões por profissional | **1.2** | ✅ | ✅ | ✅ | ✅ | ❌ |
| Avaliações de clientes | **1.3** | ❌ | ❌ | ✅ | ✅ | ❌ |
| Cupons / fidelidade | **1.3** | ❌ | ❌ | ✅ | ✅ | ❌ |
| Gestão financeira | **2.0** | ✅ | ✅ | ❌ | ❌ | ❌ |
| Múltiplas localizações | **2.0** | ✅ | ❌ | ✅ | ✅ | ❌ |
| Teleconsulta | **3.0** | ✅ | ❌ | ❌ | ✅ | ✅ |

### Nossos Diferenciais

| Diferencial | Concorrentes com algo similar |
|---|:---:|
| Integração N8N (automação customizável) | Apenas SimplyBook.me |
| CPF/CNPJ + CEP automático + validação via API | Nenhum completo |
| Segurança enterprise (rate limit, lockout, audit, HMAC) | Raro em BR |
| Logger estruturado com filtro automático de dados sensíveis | Nenhum |
| Anti-replay attacks (timestamp + nonce) no webhook | Nenhum |
| Alerta automático de tentativas de invasão | Nenhum |
| Multi-gateway 6 provedores (planejado) | Nenhum com 6 |
| Integração Taxidog (planejado) | Nenhum |

---

## Organograma

```
                    AGENDA SYSTEM — ROADMAP
═══════════════════════════════════════════════════════════

 ✅ CONCLUÍDO      v0.9.0   22 itens — Segurança crítica
 ✅ CORREÇÕES      v0.9.1   24 itens — Bugs e débitos
 ✅ INFRAESTRUTURA v0.9.5   12 itens — Testes e arquitetura

═══════════════════════════════════════════════════════════

 🔨 FUNDAÇÃO       v1.0      3 itens
    F-01  Conflito de horários
    F-02  Editar/cancelar agendamento
    F-03  Lembretes automáticos

 💳 PAGAMENTOS     v1.1      4 itens
    AC-02 Multi-gateway (6 provedores)
          ├─ Stripe + Mercado Pago
          ├─ Asaas + PagSeguro
          └─ InfinitePay + Banco Cora
    AC-05 PWA
    AC-07 QR Code
    AC-08 Exportação CSV/PDF

 🔗 INTEGRAÇÕES    v1.2      4 itens
    AC-03 Google Calendar
    AC-10 Recorrência
    AC-11 Permissões
    F-04  Taxidog

 🎯 ENGAJAMENTO    v1.3      4 itens
    AC-09 Avaliações
    AC-13 Cupons
    AC-14 Fidelidade
    AC-16 Lista de espera

═══════════════════════════════════════════════════════════

 📈 EXPANSÃO       v2.0      4 itens
    AC-06 Financeiro
    AC-12 Multi-local
    F-06  Produtos
    AC-17 Formulários

 🚀 AVANÇADO       v3.0      4 itens
    AC-15 Teleconsulta
    AC-18 Templates
    F-05  Planilha pública
    ───   API pública

═══════════════════════════════════════════════════════════
```

### Cronograma

| Fase | Versão | Itens | Estimativa |
|---|:---:|:---:|---|
| ~~Concluído~~ | ~~0.9.0~~ | ~~22~~ | ~~Feito~~ |
| ~~Correções~~ | ~~0.9.1~~ | ~~24~~ | ~~Feito (16/02/2026)~~ |
| ~~Infraestrutura~~ | ~~0.9.5~~ | ~~12~~ | ~~Feito (16/02/2026)~~ |
| **Fundação** | **1.0** | **3** | **2-3 semanas** |
| Pagamentos | 1.1 | 4 | 6-8 semanas |
| Integrações | 1.2 | 4 | 4-6 semanas |
| Engajamento | 1.3 | 4 | 3-4 semanas |
| Expansão | 2.0 | 4 | 6-8 semanas |
| Avançado | 3.0 | 4 | 6-8 semanas |

**Total restante:** ~25-39 semanas (6-9 meses)
