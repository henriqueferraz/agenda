# Agenda System — Plano de Correções e Melhorias

> **Versão:** 0.9.0 | **Atualizado:** 23/03/2026 | **Autor:** Henrique Ferraz
> **Detalhamento técnico:** [PLANO_DE_CORRECOES_DETALHADO.md](./PLANO_DE_CORRECOES_DETALHADO.md)

---

## Status Geral

| Categoria | Qtd | Status |
|---|:---:|:---:|
| Funcionalidades core (F-xx) | 3 | Planejado |
| Funcionalidades competitivas (AC-xx) | 17 | Planejado |
| Funcionalidades pós-varredura (NV-xx) | 5 | Planejado |
| **Total restante** | **25** | |

> **Regra de contagem:** `NV-xx` é backlog complementar estratégico (incrementos/evoluções), contabilizado separadamente de `AC-xx` para planejamento e priorização.

---

## Modelo de Negócio

| Componente | Descrição |
|---|---|
| **Trial gratuito** | 30 dias grátis com todas as funcionalidades + add-ons liberados |
| **Plano Ilimitado** | R$49,99/mês — sem limite de uso, 4 funcionalidades novas incluídas |
| **Add-ons avulsos** | R$9,99/mês cada — 17 funcionalidades contratadas conforme necessidade |

### Distribuição por Plano

| Plano | Qtd | Features |
|---|:---:|---|
| Ilimitado (R$49,99/mês) | 4 | AC-05, AC-07, AC-08, AC-09 |
| Add-on avulso (R$9,99/mês) | 17 | AC-02, AC-02+, AC-03, AC-06, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, F-04, F-05, F-06, API |

---

## Funcionalidades Pendentes

### Ordem de implementação por versão

#### v1.1 — Pagamentos e Mobilidade

| Ordem global | ID | Funcionalidade | Prioridade | Plano |
|:---:|:---:|---|:---:|:---:|
| 1 | AC-07 | QR Code de agendamento | Média | Ilimitado |
| 2 | AC-08 | Exportação CSV/PDF | Média | Ilimitado |
| 16 | AC-05 | PWA (Progressive Web App) | Alta | Ilimitado |
| 22 | AC-02 | Pagamento online (Stripe + Mercado Pago) | Alta | Add-on R$9,99 |
| 24 | AC-02+ | Pagamento multi-gateway (6 provedores) | Alta | Add-on R$9,99 |

#### v1.2 — Integrações

| Ordem global | ID | Funcionalidade | Prioridade | Plano |
|:---:|:---:|---|:---:|:---:|
| 8 | F-04 | Integração Taxidog | Média | Add-on R$9,99 |
| 9 | AC-10 | Agendamentos recorrentes | Média | Add-on R$9,99 |
| 15 | AC-11 | Permissões por profissional | Média | Add-on R$9,99 |
| 19 | AC-03 | Sync Google Calendar (bidirecional) | Alta | Add-on R$9,99 |

#### v1.3 — Engajamento

| Ordem global | ID | Funcionalidade | Prioridade | Plano |
|:---:|:---:|---|:---:|:---:|
| 3 | AC-09 | Avaliações e feedback de clientes | Média | Ilimitado |
| 6 | AC-13 | Cupons e promoções | Baixa | Add-on R$9,99 |
| 10 | AC-16 | Lista de espera | Baixa | Add-on R$9,99 |
| 12 | AC-14 | Programa de fidelidade | Baixa | Add-on R$9,99 |

#### v2.0 — Expansão

| Ordem global | ID | Funcionalidade | Prioridade | Plano |
|:---:|:---:|---|:---:|:---:|
| 13 | AC-17 | Formulários customizados (anamnese) | Baixa | Add-on R$9,99 |
| 17 | AC-12 | Múltiplas localizações | Média | Add-on R$9,99 |
| 18 | AC-06 | Gestão financeira | Média | Add-on R$9,99 |
| 25 | F-06 | Venda de produtos (multi-gateway) | Baixa | Add-on R$9,99 |

#### v3.0 — Avançado

| Ordem global | ID | Funcionalidade | Prioridade | Plano |
|:---:|:---:|---|:---:|:---:|
| 5 | F-05 | Planilha pública / relatórios | Média | Add-on R$9,99 |
| 7 | AC-18 | Templates de página de agendamento | Baixa | Add-on R$9,99 |
| 14 | AC-15 | Teleconsulta (Meet / Zoom) | Baixa | Add-on R$9,99 |

#### Pós-varredura — NV

| Ordem global | ID | Funcionalidade | Prioridade | Plano |
|:---:|:---:|---|:---:|:---:|
| 4 | NV-04 | Pesquisa de satisfação pós-atendimento (NPS + review) | Média | Ilimitado |
| 11 | NV-03 | Campanhas automáticas de retenção (reativação/aniversário/retorno) | Alta | Add-on R$9,99 |
| 20 | NV-02 | Lista de espera inteligente com autopreenchimento | Alta | Add-on R$9,99 |
| 21 | NV-05 | Fidelidade + cupons + gift card (módulo unificado) | Média | Add-on R$9,99 |
| 23 | NV-06 | POS leve + comandas + baixa automática de estoque | Média | Add-on R$9,99 |

**Gateways planejados (AC-02/AC-02+):**

| Gateway | Métodos | Fase | Add-on |
|---|---|:---:|:---:|
| **Stripe** | Cartão, PIX, Apple Pay, Google Pay | 2 | AC-02 |
| **Mercado Pago** | PIX, cartão, boleto | 2 | AC-02 |
| **Asaas** | PIX, boleto, cartão, recorrência | 3 | AC-02+ |
| **PagSeguro** | PIX, cartão, boleto, débito | 3 | AC-02+ |
| **InfinitePay** | PIX, cartão, link de pagamento | 4 | AC-02+ |
| **Banco Cora** | PIX, boleto, cobranças | 4 | AC-02+ |

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

## Plano Ilimitado — R$49,99/mês

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

> **Observação:** os add-ons listados acima representam o baseline do plano (17 itens).  
> Os itens `NV` serão incorporados progressivamente como complementos pós-varredura.

### Simulação de Cenários

| Cenário | Plano | Add-ons | Total |
|---|:---:|---|:---:|
| Cabeleireiro autônomo | R$49,99 | — | **R$49,99/mês** |
| Salão com 3 funcionários | R$49,99 | Permissões + Google Cal | **R$69,97/mês** |
| Salão completo com pagamento | R$49,99 | Permissões + Pagamento + Fidelidade | **R$79,96/mês** |
| Clínica estética full | R$49,99 | Permissões + Pagamento + Financeiro + Formulários + Teleconsulta + Fidelidade | **R$109,93/mês** |

---

## Pricing (referência concorrentes)

| Aspecto | Reservio | SimplyBook.me | Simples Agenda | **Agenda** |
|---|---|---|---|---|
| Modelo | 3 planos fixos | 3 planos + add-ons | 3 planos fixos | **1 plano + add-ons** |
| Entrada | Grátis (40/mês) | Grátis (50/mês) | ~R$49 | **Trial grátis → R$49,99** |
| Funcionalidades avulsas | Não | Sim | Não | **Sim (17 add-ons)** |
| Preço por add-on | — | ~US$10 | — | **R$9,99** |
| Limite de agendamentos | Sim (no grátis) | Sim (no grátis) | Sim | **Não (ilimitado)** |
| Flexibilidade | Baixa | Alta | Baixa | **Alta** |

> **Vantagem competitiva:** O cliente paga pelo que usa. Add-ons a R$9,99 — preço único e acessível. Não precisa pagar um plano caro para ter 1 funcionalidade específica.

### Comparativo de valores — concorrentes (preço público)

| Concorrente | Valor de entrada mensal* | Modelo de cobrança | Observação |
|---|---:|---|---|
| **Agenda** | **R$49,99** | Plano único + add-ons (R$9,99) | Sem limite de uso no plano base |
| Clínica Experts | R$149,00 | Planos por faixa (Essencial/Avançado/Experts) | Até R$599,00/mês no plano topo |
| Simples Agenda | R$39,90 | Escalonado por nº de profissionais | Ex.: 1 prof R$39,90; 3 prof R$69,90; 5 prof R$89,90 |
| Reservio | Grátis | Free + planos pagos por recursos/limites | Preço final varia por país/moeda na página dinâmica |
| SimplyBook.me | £10,9 (Basic anual) / £12,9 (mensal) | Free + tiers (Basic/Standard/Premium) | Também possui Free (£0) |
| Trinks | N/D público | Planos comerciais | Site destaca teste grátis (5 dias), sem preço explícito aberto |
| InBarber | R$32,90 por profissional | Mensal por profissional | 45 dias de teste |
| AppBarber | R$79,90 (1 profissional, mensal) | Mensal/semestral/anual por faixa de profissionais | Exibe descontos semestral (15%) e anual (30%) |
| **SmartPOS** | R$0 (Grátis) / Smart **R$39,90** | Tiers mensais Grátis → Smart → Essencial **R$69,90** → Premium **R$99,90** (há plano anual) | PDV + catálogo + estoque + fiscal; foco **varejo/MEI**, não agenda de serviços ([smartpos.net.br](https://www.smartpos.net.br/)) |
| Calenddar | N/D público | N/D | Não foi identificado quadro público de preços no site |

\* Valores de referência capturados em páginas públicas dos concorrentes; podem variar por campanha, região, moeda e periodicidade.

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
| 9 | **SmartPOS** | https://www.smartpos.net.br/ | PDV / varejo / MEI (gestão + estoque + catálogo) |

### Quadro Comparativo — Funcionalidades Planejadas

| Funcionalidade | Versão | Plano | C.Exp | S.Ag | Cal | Res | Simpl | Trinks | InBarber | AppBarber | Spo |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| PWA / mobile | **1.1** | Ilimitado | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR code | **1.1** | Ilimitado | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Exportação CSV/PDF | **1.1** | Ilimitado | ❌ | ✅ | — | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Pagamento online (Stripe + MP) | **1.1** | Add-on R$9,99 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-gateway (6 provedores) | **1.1** | Add-on R$9,99 | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Google Calendar sync | **1.2** | Add-on R$9,99 | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Agendamentos recorrentes | **1.2** | Add-on R$9,99 | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Permissões por profissional | **1.2** | Add-on R$9,99 | ✅ | ✅ | — | ✅ | ✅ | ❌ | ✅ | ✅ | ⚠️ |
| Avaliações de clientes | **1.3** | Ilimitado | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Cupons / promoções | **1.3** | Add-on R$9,99 | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Fidelidade | **1.3** | Add-on R$9,99 | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Lista de espera | **1.3** | Add-on R$9,99 | ❌ | ❌ | — | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Gestão financeira | **2.0** | Add-on R$9,99 | ✅ | ✅ | — | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Múltiplas localizações | **2.0** | Add-on R$9,99 | ✅ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Teleconsulta | **3.0** | Add-on R$9,99 | ✅ | ❌ | — | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Distribuição social do link (UTM + sociais) | **NV** | Ilimitado | ❌ | ✅ | — | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Campanhas automáticas de retenção | **NV** | Add-on R$9,99 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pesquisa de satisfação (NPS + review) | **NV** | Ilimitado | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| POS leve + comandas + estoque automático | **NV** | Add-on R$9,99 | ✅ | ✅ | — | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |

> **Legenda Spo (SmartPOS):** ✅ forte no segmento deles; ⚠️ parcial (ex.: várias adquirentes/PIX, mas não os 6 gateways do nosso AC-02+); ❌ não é foco do produto.

### SmartPOS → o que implementar no Agenda (mapeamento)

| Recurso observado no site público | Onde encaixa no nosso plano |
|---|---|
| PDV, PIX, recebimento com maquininha (PagBank, Stone, Cielo, etc.) | **AC-02**, **AC-02+**, **NV-06** |
| Catálogo online, pedidos, delivery | **F-06**, **NV-06** |
| Estoque (entradas/saídas, inventário) | **NV-06** |
| Caixa, contas a pagar/receber, **fiado**, boletos | **AC-06** (+ evolução futura “fiado” explícito) |
| Relatórios e exportações | **AC-08**, **F-05** |
| Comissionamento de vendedores | **NV-06** / **AC-06** (complementar) |
| **NF-e / NFC-e** | Fora do core de agenda; módulo fiscal BR — **fase futura** (alto esforço/regulatório) |
| Fichas modo eventos | Nicho; **prioridade baixa** se surgir demanda |

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
| 1 | Pesquisa de satisfação pós-atendimento (NPS + review) | 0-30 dias |
| 2 | Campanhas automáticas de retenção (reativação/aniversário/retorno) | 31-60 dias |
| 3 | Lista de espera inteligente (autopreenchimento de cancelamentos) | 31-60 dias |
| 4 | Fidelidade + cupons + gift card (módulo único) | 61-90 dias |
| 5 | POS leve + comandas + baixa automática de estoque | 61-90 dias |

> **Objetivo da priorização:** fechar gaps observados em Reservio, SimplyBook.me, Trinks, InBarber, AppBarber e referências de **PDV/estoque** (ex.: SmartPOS), mantendo nosso diferencial de preço com add-ons.

### Ordem recomendada por funcionalidade (fácil → difícil)

| Ordem | ID | Funcionalidade |
|:---:|:---:|---|
| 1 | AC-07 | QR Code de agendamento |
| 2 | AC-08 | Exportação CSV/PDF |
| 3 | AC-09 | Avaliações e feedback de clientes |
| 4 | NV-04 | Pesquisa de satisfação pós-atendimento (NPS + review) |
| 5 | F-05 | Planilha pública / relatórios |
| 6 | AC-13 | Cupons e promoções |
| 7 | AC-18 | Templates de página de agendamento |
| 8 | F-04 | Integração Taxidog |
| 9 | AC-10 | Agendamentos recorrentes |
| 10 | AC-16 | Lista de espera |
| 11 | NV-03 | Campanhas automáticas de retenção |
| 12 | AC-14 | Programa de fidelidade |
| 13 | AC-17 | Formulários customizados (anamnese) |
| 14 | AC-15 | Teleconsulta (Meet / Zoom) |
| 15 | AC-11 | Permissões por profissional |
| 16 | AC-05 | PWA (Progressive Web App) |
| 17 | AC-12 | Múltiplas localizações |
| 18 | AC-06 | Gestão financeira |
| 19 | AC-03 | Sync Google Calendar (bidirecional) |
| 20 | NV-02 | Lista de espera inteligente com autopreenchimento |
| 21 | NV-05 | Fidelidade + cupons + gift card (módulo unificado) |
| 22 | AC-02 | Pagamento online (Stripe + Mercado Pago) |
| 23 | NV-06 | POS leve + comandas + baixa automática de estoque |
| 24 | AC-02+ | Pagamento multi-gateway (6 provedores) |
| 25 | F-06 | Venda de produtos (multi-gateway) |

> **Primeira funcionalidade a fazer:** `AC-07` (entrega rápida, baixo risco técnico e impacto direto em aquisição local).

---

## Organograma

```
              AGENDA SYSTEM — ROADMAP (25 itens restantes)
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

 🧭 PÓS-VARREDURA  NV       5 itens
    NV-02 Lista de espera inteligente ......... [Add-on R$9,99]
    NV-03 Campanhas de retenção .............. [Add-on R$9,99]
    NV-04 Pesquisa de satisfação (NPS) ....... [Ilimitado]
    NV-05 Fidelidade + cupons + gift card .... [Add-on R$9,99]
    NV-06 POS + comandas + estoque ........... [Add-on R$9,99]

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
| Pós-varredura | NV | 5 | 7-9 semanas |

**Total:** 25 itens — ~31-42 semanas (8-10 meses)
