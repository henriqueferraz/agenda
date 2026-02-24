# Agenda System — Plano de Correções e Melhorias

> **Versão:** 0.9.0 | **Atualizado:** 24/02/2026 | **Autor:** Henrique Ferraz
> **Detalhamento técnico:** [PLANO_DE_CORRECOES_DETALHADO.md](./PLANO_DE_CORRECOES_DETALHADO.md)

---

## Status Geral

| Categoria | Qtd | Status |
|---|:---:|:---:|
| Funcionalidades core (F-xx) | 3 | Planejado |
| Funcionalidades competitivas (AC-xx) | 17 | Planejado |
| **Total restante** | **20** | |

---

## Modelo de Negócio

| Componente | Descrição |
|---|---|
| **Trial gratuito** | 30 dias grátis com todas as funcionalidades + add-ons liberados |
| **Plano Ilimitado** | R$75/mês — sem limite de uso, 4 funcionalidades novas incluídas |
| **Add-ons avulsos** | R$9,99/mês cada — 17 funcionalidades contratadas conforme necessidade |

### Distribuição por Plano

| Plano | Qtd | Features |
|---|:---:|---|
| Ilimitado (R$75/mês) | 4 | AC-05, AC-07, AC-08, AC-09 |
| Add-on avulso (R$9,99/mês) | 17 | AC-02, AC-02+, AC-03, AC-06, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, F-04, F-05, F-06, API |

---

## Funcionalidades Pendentes

### v1.1 — Pagamentos e Mobilidade

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-02 | Pagamento online (Stripe + Mercado Pago) | Alta | Add-on R$9,99 |
| AC-02+ | Pagamento multi-gateway (6 provedores) | Alta | Add-on R$9,99 |
| AC-05 | PWA (Progressive Web App) | Alta | Ilimitado |
| AC-07 | QR Code de agendamento | Média | Ilimitado |
| AC-08 | Exportação CSV/PDF | Média | Ilimitado |

**Gateways planejados:**

| Gateway | Métodos | Fase | Add-on |
|---|---|:---:|:---:|
| **Stripe** | Cartão, PIX, Apple Pay, Google Pay | 2 | AC-02 |
| **Mercado Pago** | PIX, cartão, boleto | 2 | AC-02 |
| **Asaas** | PIX, boleto, cartão, recorrência | 3 | AC-02+ |
| **PagSeguro** | PIX, cartão, boleto, débito | 3 | AC-02+ |
| **InfinitePay** | PIX, cartão, link de pagamento | 4 | AC-02+ |
| **Banco Cora** | PIX, boleto, cobranças | 4 | AC-02+ |

### v1.2 — Integrações

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-03 | Sync Google Calendar (bidirecional) | Alta | Add-on R$9,99 |
| AC-10 | Agendamentos recorrentes | Média | Add-on R$9,99 |
| AC-11 | Permissões por profissional | Média | Add-on R$9,99 |
| F-04 | Integração Taxidog | Média | Add-on R$9,99 |

### v1.3 — Engajamento

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-09 | Avaliações e feedback de clientes | Média | Ilimitado |
| AC-13 | Cupons e promoções | Baixa | Add-on R$9,99 |
| AC-14 | Programa de fidelidade | Baixa | Add-on R$9,99 |
| AC-16 | Lista de espera | Baixa | Add-on R$9,99 |

### v2.0 — Expansão

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-06 | Gestão financeira | Média | Add-on R$9,99 |
| AC-12 | Múltiplas localizações | Média | Add-on R$9,99 |
| F-06 | Venda de produtos (multi-gateway) | Baixa | Add-on R$9,99 |
| AC-17 | Formulários customizados (anamnese) | Baixa | Add-on R$9,99 |

### v3.0 — Avançado

| ID | Funcionalidade | Prioridade | Plano |
|:---:|---|:---:|:---:|
| AC-15 | Teleconsulta (Meet / Zoom) | Baixa | Add-on R$9,99 |
| AC-18 | Templates de página de agendamento | Baixa | Add-on R$9,99 |
| F-05 | Planilha pública / relatórios | Média | Add-on R$9,99 |
| — | API pública (Swagger) | Baixa | Add-on R$9,99 |

### Mensagens globais vinculadas

| Funcionalidade | Tipos de mensagem (rota global) |
|---|---|
| AC-02/AC-02+ | `payment_confirmed`, `payment_reminder` |
| AC-09 | `feedback_request`, `post_appointment` |
| AC-13 | `coupon`, `promotion`, `seasonal` |
| AC-14 | `loyalty_reward` |
| AC-16 | `waitlist_available` |
| Engajamento geral | `reengagement`, `birthday` |

---

## Plano Ilimitado — R$75/mês

Perfil: cabeleireiro com seu salão, profissional autônomo, pequeno negócio de serviços.

| ID | Funcionalidade | Justificativa |
|:---:|---|---|
| AC-05 | PWA (acesso mobile) | Acesso pelo celular é essencial em 2026 |
| AC-07 | QR Code de agendamento | Marketing básico — cartão de visita, balcão |
| AC-08 | Exportação CSV/PDF | Contabilidade e controle básico |
| AC-09 | Avaliações e feedback de clientes | Reputação online e melhoria contínua |

---

## Add-ons Avulsos — R$9,99/mês cada

| ID | Add-on |
|:---:|---|
| AC-02 | Pagamento online (Stripe + Mercado Pago) |
| AC-02+ | Multi-gateway (4 gateways adicionais) |
| AC-03 | Google Calendar sync |
| AC-06 | Gestão financeira |
| AC-10 | Agendamentos recorrentes |
| AC-11 | Permissões por profissional |
| AC-12 | Múltiplas localizações |
| AC-13 | Cupons e promoções |
| AC-14 | Programa de fidelidade |
| AC-15 | Teleconsulta (Meet/Zoom) |
| AC-16 | Lista de espera |
| AC-17 | Formulários customizados (anamnese) |
| AC-18 | Templates de página |
| F-04 | Integração Taxidog |
| F-05 | Planilha pública / relatórios |
| F-06 | Venda de produtos |
| — | API pública (Swagger) |

### Simulação de Cenários

| Cenário | Plano | Add-ons | Total |
|---|:---:|---|:---:|
| Cabeleireiro autônomo | R$75 | — | **R$75/mês** |
| Salão com 3 funcionários | R$75 | Permissões + Google Cal | **R$94,98/mês** |
| Salão completo com pagamento | R$75 | Permissões + Pagamento + Fidelidade | **R$104,97/mês** |
| Clínica estética full | R$75 | Permissões + Pagamento + Financeiro + Formulários + Teleconsulta + Fidelidade | **R$134,94/mês** |

---

## Pricing (referência concorrentes)

| Aspecto | Reservio | SimplyBook.me | Simples Agenda | **Agenda** |
|---|---|---|---|---|
| Modelo | 3 planos fixos | 3 planos + add-ons | 3 planos fixos | **1 plano + add-ons** |
| Entrada | Grátis (40/mês) | Grátis (50/mês) | ~R$49 | **Trial grátis → R$75** |
| Funcionalidades avulsas | Não | Sim | Não | **Sim (17 add-ons)** |
| Preço por add-on | — | ~US$10 | — | **R$9,99** |
| Limite de agendamentos | Sim (no grátis) | Sim (no grátis) | Sim | **Não (ilimitado)** |
| Flexibilidade | Baixa | Alta | Baixa | **Alta** |

> **Vantagem competitiva:** O cliente paga pelo que usa. Add-ons a R$9,99 — preço único e acessível. Não precisa pagar um plano caro para ter 1 funcionalidade específica.

---

## Concorrentes

| # | Concorrente | URL | Segmento |
|:---:|---|---|---|
| 1 | **Clínica Experts** | https://clinicaexperts.com.br/ | Clínicas de saúde |
| 2 | **Simples Agenda** | https://www.simplesagenda.com.br/ | PMEs |
| 3 | **Calenddar** | https://calenddar.com.br/ | Agenda |
| 4 | **Reservio** | https://www.reservio.com/ | Serviços |
| 5 | **SimplyBook.me** | https://simplybook.me/ | Serviços |
| 6 | **Trinks** | https://www.trinks.com/ | Beleza e bem-estar |
| 7 | **InBarber** | https://www.inbarberapp.com/ | Barbearias |
| 8 | **AppBarber** | https://appbarber.com.br/ | Barbearias |

### Quadro Comparativo — Funcionalidades Planejadas

| Funcionalidade | Versão | Plano | C.Exp | S.Ag | Res | Simpl |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| PWA / mobile | **1.1** | Ilimitado | ✅ | ✅ | ✅ | ✅ |
| QR code | **1.1** | Ilimitado | ❌ | ❌ | ✅ | ✅ |
| Exportação CSV/PDF | **1.1** | Ilimitado | ❌ | ✅ | ❌ | ❌ |
| Pagamento online (Stripe + MP) | **1.1** | Add-on R$9,99 | ✅ | ✅ | ✅ | ✅ |
| Multi-gateway (6 provedores) | **1.1** | Add-on R$9,99 | ❌ | ❌ | ❌ | ❌ |
| Google Calendar sync | **1.2** | Add-on R$9,99 | ❌ | ❌ | ✅ | ✅ |
| Agendamentos recorrentes | **1.2** | Add-on R$9,99 | ❌ | ❌ | ✅ | ✅ |
| Permissões por profissional | **1.2** | Add-on R$9,99 | ✅ | ✅ | ✅ | ✅ |
| Avaliações de clientes | **1.3** | Ilimitado | ❌ | ❌ | ✅ | ✅ |
| Cupons / promoções | **1.3** | Add-on R$9,99 | ❌ | ❌ | ✅ | ✅ |
| Fidelidade | **1.3** | Add-on R$9,99 | ❌ | ❌ | ✅ | ✅ |
| Lista de espera | **1.3** | Add-on R$9,99 | ❌ | ❌ | ❌ | ✅ |
| Gestão financeira | **2.0** | Add-on R$9,99 | ✅ | ✅ | ❌ | ❌ |
| Múltiplas localizações | **2.0** | Add-on R$9,99 | ✅ | ❌ | ✅ | ✅ |
| Teleconsulta | **3.0** | Add-on R$9,99 | ✅ | ❌ | ❌ | ✅ |

### Nossos Diferenciais

| Diferencial | Concorrentes com algo similar |
|---|:---:|
| Multi-gateway 6 provedores (planejado) | Nenhum com 6 |
| Integração Taxidog (planejado) | Nenhum |
| Add-ons a R$9,99 — preço único e acessível | Nenhum |
| Modelo 1 plano + add-ons à la carte | Apenas SimplyBook.me |
| Integração N8N (automação customizável) | Apenas SimplyBook.me |

---

## Priorização pós-varredura de concorrentes (90 dias)

| Prioridade | Funcionalidade | Janela |
|:---:|---|---|
| 1 | Distribuição social do link (UTM + WhatsApp/Instagram) | 0-30 dias |
| 2 | Lista de espera inteligente (autopreenchimento de cancelamentos) | 0-30 dias |
| 3 | Campanhas automáticas de retenção (reativação/aniversário/retorno) | 31-60 dias |
| 4 | Pesquisa de satisfação pós-atendimento (NPS + review) | 31-60 dias |
| 5 | Fidelidade + cupons + gift card (módulo único) | 61-90 dias |
| 6 | POS leve + comandas + baixa automática de estoque | 61-90 dias |

> **Objetivo da priorização:** fechar gaps observados em Reservio, SimplyBook.me, Trinks, InBarber e AppBarber, mantendo nosso diferencial de preço com add-ons.

---

## Organograma

```
              AGENDA SYSTEM — ROADMAP (20 itens restantes)
═══════════════════════════════════════════════════════════

 💳 PAGAMENTOS     v1.1      5 itens
    AC-02 Stripe + Mercado Pago .............. [Add-on R$9,99]
    AC-02+ Multi-gateway (4 adicionais) ...... [Add-on R$9,99]
          ├─ Asaas + PagSeguro
          └─ InfinitePay + Banco Cora
    AC-05 PWA ................................ [Ilimitado]
    AC-07 QR Code ............................ [Ilimitado]
    AC-08 Exportação CSV/PDF ................. [Ilimitado]

 🔗 INTEGRAÇÕES    v1.2      4 itens
    AC-03 Google Calendar .................... [Add-on R$9,99]
    AC-10 Recorrência ........................ [Add-on R$9,99]
    AC-11 Permissões ......................... [Add-on R$9,99]
    F-04  Taxidog ............................ [Add-on R$9,99]

 🎯 ENGAJAMENTO    v1.3      4 itens
    AC-09 Avaliações ......................... [Ilimitado]
    AC-13 Cupons ............................. [Add-on R$9,99]
    AC-14 Fidelidade ......................... [Add-on R$9,99]
    AC-16 Lista de espera .................... [Add-on R$9,99]

═══════════════════════════════════════════════════════════

 📈 EXPANSÃO       v2.0      4 itens
    AC-06 Financeiro ......................... [Add-on R$9,99]
    AC-12 Multi-local ........................ [Add-on R$9,99]
    F-06  Produtos ........................... [Add-on R$9,99]
    AC-17 Formulários ........................ [Add-on R$9,99]

 🚀 AVANÇADO       v3.0      4 itens
    AC-15 Teleconsulta ....................... [Add-on R$9,99]
    AC-18 Templates .......................... [Add-on R$9,99]
    F-05  Planilha pública ................... [Add-on R$9,99]
    ───   API pública ........................ [Add-on R$9,99]

═══════════════════════════════════════════════════════════
```

### Cronograma

| Fase | Versão | Itens | Estimativa |
|---|:---:|:---:|---|
| **Pagamentos** | **1.1** | **5** | **6-8 semanas** ← PRÓXIMA |
| Integrações | 1.2 | 4 | 4-6 semanas |
| Engajamento | 1.3 | 4 | 3-4 semanas |
| Expansão | 2.0 | 4 | 6-8 semanas |
| Avançado | 3.0 | 4 | 6-8 semanas |

**Total:** 20 itens — ~25-34 semanas (6-9 meses)
