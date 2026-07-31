# 07 — Rotas

> Mapa de rotas alvo (Django URLConf) espelhando o legado  
> Atualizado: 2026-07-31

---

## 1. Públicas (marketing + auth)

| Método | Path | Descrição |
|---|---|---|
| GET | `/` | Landing page |
| POST | `/contato/` | Formulário de contato |
| GET/POST | `/login/` | Login |
| POST | `/logout/` | Logout |
| GET/POST | `/register/` | Registro |
| GET/POST | `/register/verificar-otp/` | Verificação OTP |
| POST | `/register/reenviar-otp/` | Reenvio OTP |
| GET/POST | `/esqueci-senha/` | Forgot password |
| GET/POST | `/redefinir-senha/` | Reset password |

## 2. Booking público

| Método | Path | Descrição |
|---|---|---|
| GET | `/agendamento/<token>/` | Página de agendamento |
| POST | `/agendamento/<token>/criar/` | Criar (HTMX) |
| GET | `/a/<code>/` | Redirect/resolve código curto |
| GET | `/agendamento/gerenciar/<mgmt_token>/` | Autogestão |
| POST | `/agendamento/gerenciar/<mgmt_token>/cancelar/` | Cancelar público |
| POST | `/agendamento/gerenciar/<mgmt_token>/reagendar/` | Reagendar público |

## 3. Painel (`/dashboard/`)

| Path | Descrição |
|---|---|
| `/dashboard/` | Home / stats / agenda do dia / tarefas |
| `/dashboard/upgrade/` | Trial expirado |
| `/dashboard/configuracoes/atividade/` | Atividade |
| `/dashboard/configuracoes/modelo/` | PF/PJ + logo |
| `/dashboard/configuracoes/endereco/` | Endereço |
| `/dashboard/configuracoes/horarios/` | Horários empresa |
| `/dashboard/servicos/` | CRUD serviços |
| `/dashboard/funcionarios/` | CRUD funcionários |
| `/dashboard/funcionarios/<id>/horarios/` | Horários do funcionário |
| `/dashboard/clientes/` | CRUD clientes |
| `/dashboard/agenda/calendario/` | Calendário + agenda |
| `/dashboard/agenda/feriados/` | StopDay |
| `/dashboard/agenda/bloqueios/` | BlockedTime |
| `/dashboard/mensagens/` | Config + envio + logs |
| `/dashboard/conta/senha/` | Alterar senha |

## 4. Admin master

| Path | Descrição |
|---|---|
| `/dashboard/admin/usuarios/` | Lista / ações |
| `/dashboard/admin/usuarios/<id>/reset-senha/` | Reset |

## 5. APIs internas / webhooks / jobs

| Método | Path | Descrição |
|---|---|---|
| POST | `/api/cron/reminders/` | Job lembretes (auth token) — v1 via cron HTTP |
| GET | `/api/cep/<cep>/` | Proxy CEP (opcional) |
| POST | `/api/upload/logo/` | Upload logo |
| GET | `/healthz/` | Healthcheck |

> **Não** manter proxy `/api/webhooks/appointment/` na v1: services enviam direto ao `BASE_N8N`.  
> Com HTMX, CRUDs do painel são views HTML/partials. APIs JSON só quando necessário (mobile futuro).

## 6. Middleware / guards

1. Rotas `/dashboard/**` exigem login (sessão Django).
2. Trial expirado sem plano pago → redirect `/dashboard/upgrade/` (exceto master e a própria upgrade).
3. Rate limit em auth, booking público e contato.
4. CSRF em todos os POST (incluindo HTMX).

## 7. Relacionados

- [08-layout.md](./08-layout.md)
- [11-gestao.md](./11-gestao.md)
- [13-integracoes-n8n.md](./13-integracoes-n8n.md)