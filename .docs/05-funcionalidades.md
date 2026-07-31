# 05 — Funcionalidades

> Inventário funcional para a reescrita Django + HTMX  
> Atualizado: 2026-07-31

---

## 1. Status — implementado no legado (deve existir na v1 Django)

### Autenticação

- Registro com OTP por e-mail
- Login / logout / sessão
- Forgot / reset / change password
- Roles: `enterprise`, `master`

### Organização / configurações

- Atividade profissional (lista **configurável**; seed inicial + gestão)
- Modelo PF/PJ (CPF/CNPJ oficiais) + nome fantasia + logo
- Endereço com busca CEP (ViaCEP → BrasilAPI)
- Horários de funcionamento por dia da semana

### Catálogo

- CRUD serviços (preço centavos, duração minutos)
- CRUD funcionários + horários por dia
- Vínculo N:N funcionário ↔ serviços

### Clientes

- CRUD clientes do negócio
- Unicidade por CPF e e-mail dentro do tenant

### Agendamento (painel)

- Calendário mensal + agenda diária
- Criar / editar / cancelar / reagendar
- Histórico de alterações
- Verificação de disponibilidade e conflitos
- Integração webhook n8n

### Agendamento público

- URL `/agendamento/<token>` e URL curta `/a/<code>`
- Criar agendamento sem login
- Autogestão via `management_token` (cancelar/reagendar)

### Bloqueios e feriados

- StopDay (dia inteiro)
- BlockedTime (slot por funcionário)

### Dashboard

- Estatísticas (agendamentos, clientes, receita)
- Novos agendamentos (polling / refresh)
- Agenda do dia
- Tarefas/lembretes (CRUD)
- Link de booking

### Mensagens

- Config de lembretes (7d / 24h / 2h)
- Cron de lembretes → GLOBAL_N8N
- Mensagens individuais / em massa / indisponibilidade (via n8n)
- Logs de envio

### Contato / marketing

- Landing page
- Formulário de contato
- Página upgrade pós-trial

### Admin master

- Gestão de usuários / reset de senha (conforme legado)

## 2. Fluxos críticos

### F1 — Cadastro → OTP → Login → Onboarding

1. Register  
2. Verify OTP  
3. Login  
4. Configurar atividade, modelo, endereço, horários  
5. Criar serviços e funcionários  
6. Compartilhar link público  

### F2 — Agendamento público

1. Abrir link  
2. Escolher serviço → funcionário → data → horário  
3. Informar dados (nome, e-mail, telefone, CPF)  
4. Persistir Appointment + Client  
5. Disparar webhook n8n (`type=create`)  
6. Exibir confirmação + link de gestão  

### F3 — Gestão no painel

1. Ver calendário / dia  
2. Cancelar / reagendar / editar  
3. Webhook com `type` correspondente  
4. Histórico registrado  

### F4 — Lembretes automáticos

1. Cron autentica com token  
2. Seleciona appointments nas janelas 7d/24h/2h  
3. Respeita MessageConfig  
4. Envia GLOBAL_N8N  
5. Grava ReminderLog (idempotente)  

## 3. Backlog (pós v1)

| ID | Feature | Fase típica |
| --- | --- | --- |
| AC-07 | QR Code agendamento | v1.1 |
| AC-08 | Export CSV/PDF | v1.1 |
| AC-05 | PWA | v1.1 |
| AC-02 | Pagamento Stripe/MP | v1.1 |
| AC-03 | Google Calendar | v1.2 |
| AC-09 | Avaliações | v1.3 |
| AC-10 | Recorrência | v1.2 |
| AC-11 | Permissões por profissional | v1.2 |
| SEC-01 | 2FA TOTP (`enterprise` opt-in; `master` obrigatório) | v1.1 |
| SEC-02 | TTL / revogação de `management_link` | v1.1 |
| SEC-03 | CI: SAST + fail em CVE alta + secret scan bloqueante | v1.1 |
| SEC-04 | Bot/WAF / challenge no booking público | v1.2 |
| SEC-05 | Outbox + retry/backoff webhooks n8n | v1.1 |
| + | cupons, waitlist, fidelidade, multi-loja, financeiro, produtos | v2+ |

Detalhe de segurança pós-v1: [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md) §10.

## 4. Critérios de aceite gerais (v1)

- [ ] Paridade funcional com o legado listado na seção 1
- [ ] HTMX cobrindo CRUDs principais sem full page reload desnecessário
- [ ] E2E dos fluxos **F1–F3**; fluxo **F4** com testes de **integração** obrigatórios (mock n8n)
- [ ] Cobertura de testes ≥ 80% global (ver [14-testes.md](./14-testes.md))
- [ ] CI verde em PR
- [ ] Webhooks n8n tipados e autenticados

## 5. Relacionados

- [06-regras-de-negocio.md](./06-regras-de-negocio.md)
- [07-rotas.md](./07-rotas.md)
- [11-gestao.md](./11-gestao.md)
