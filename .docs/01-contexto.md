# 01 — Contexto do Sistema

> **Stack alvo:** Python · Django · HTMX · PostgreSQL  
> **Produto:** Agenda — sistema de agendamento online  
> **Versão de referência (legado):** 0.9.0 (Next.js)  
> **Atualizado:** 2026-07-31

---

## 1. O que é o Agenda

O **Agenda** é um SaaS de agendamento online para profissionais de serviços (barbearias, salões, manicure, maquiagem, pet shops, etc.). Permite que o profissional configure o negócio, compartilhe um link público e receba agendamentos sem exigir login do cliente final.

## 2. Problema que resolve

- Agenda manual (caderno / WhatsApp) gera conflitos de horário e no-shows.
- Clientes precisam de um fluxo simples: escolher serviço, profissional, data e hora.
- O profissional precisa de painel para gerenciar serviços, equipe, feriados, bloqueios e comunicação.

## 3. Personas

| Persona | Descrição | Necessidades |
|---|---|---|
| **Profissional / Empresa** | Dono do negócio (role `enterprise`) | Configurar negócio, agenda, equipe, receber notificações |
| **Cliente final** | Quem agenda pelo link público | Agendar sem login; cancelar/reagendar via token |
| **Master** | Administrador da plataforma | Gestão de usuários, suporte, reset de senha |

## 4. Modelo de negócio

| Componente | Regra |
|---|---|
| **Trial** | 30 dias; plano efetivo `TRIAL` + `trial_ends_at` |
| **BASIC** | Plano intermediário (futuro) |
| **PROFESSIONAL** | Plano Ilimitado (copy comercial) |
| **Add-ons** | Funcionalidades avulsas (backlog) |
| **Upgrade** | Após trial sem plano pago → bloqueio / contato |

## 5. Escopo da reescrita

Reescrever **todo o sistema** preservando regras de negócio e funcionalidades já implementadas no legado, com:

- Backend e templates server-driven (**Django**)
- Interatividade progressiva (**HTMX** + Alpine.js opcional para UI leve)
- PostgreSQL como banco
- Integrações externas via **n8n** (WhatsApp / e-mail de negócio)
- Qualidade: testes (unitário, integração, e2e), CI/CD, Conventional Commits, cobertura ≥ 80%

## 6. Fora de escopo imediato (backlog)

Itens planejados no legado que podem ser fases posteriores:

- Stripe / multi-gateway de pagamento
- PWA / app mobile nativo
- Sync Google Calendar
- Avaliações, cupons, fidelidade, lista de espera
- Multi-localização, venda de produtos

Detalhes: ver [05-funcionalidades.md](./05-funcionalidades.md) (inventário v1 + backlog).

## 7. Princípios de produto

1. **Timezone único de negócio:** `America/Sao_Paulo`
2. **Cliente final sem conta** no fluxo público
3. **Comunicação:** WhatsApp/e-mail ao cliente/profissional → n8n; auth (OTP/reset) e formulário de **contato** → SMTP/Mailtrap
4. **Multi-tenant por `User`:** todo recurso pertence ao usuário autenticado
5. **Mobile-first** e acessível
6. **Segurança first:** sessão Django + CSRF, ownership, rate limit, validação de entrada
7. **Auth v1:** apenas sessão Django (sem JWT)

## 8. Documentos relacionados

- [02-arquitetura.md](./02-arquitetura.md)
- [05-funcionalidades.md](./05-funcionalidades.md)
- [00-SISTEMA.md](./00-SISTEMA.md) — índice mestre
