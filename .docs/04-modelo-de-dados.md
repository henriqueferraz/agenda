# 04 — Modelo de Dados

> Mapeamento do domínio para Django ORM (PostgreSQL)  
> Fonte de verdade legado: `prisma/schema.prisma`  
> Atualizado: 2026-07-31

---

## 1. Diagrama lógico (resumo)

```
User ──1:1── Address
  │
  ├──1:N── Service ◄──N:N── Employee
  ├──1:N── Employee
  ├──1:N── Client ──1:N── Appointment
  ├──1:N── Appointment ──1:N── AppointmentHistory
  ├──1:N── StopDay
  ├──1:N── BlockedTime
  ├──1:N── Reminder
  ├──1:1── MessageConfig
  ├──1:1── Subscription
  └── auth tokens / OTP / security logs
```

## 2. Enums

| Enum | Valores |
|---|---|
| `UserRole` | `master`, `enterprise` |
| `Plans` | `TRIAL`, `BASIC`, `PROFESSIONAL` |
| `AppointmentStatus` | `confirmed`, `cancelled` |

### Regras do enum `Plans` (3C + transição)

| Valor | Significado |
|---|---|
| `TRIAL` | Assinatura/estado comercial de trial — **somente** enquanto não há plano pago ativo |
| `BASIC` | Plano intermediário (futuro / add-on base) |
| `PROFESSIONAL` | Plano Ilimitado (copy comercial) |

1. No cadastro: `trial_ends_at = now + 30d` em `User` **e** plano efetivo `TRIAL`.
2. Ao assinar plano pago: plano deixa de ser `TRIAL` e passa a `BASIC` ou `PROFESSIONAL`; não manter `TRIAL` em paralelo com cobrança ativa.
3. Bloqueio de painel usa **`trial_ends_at` + plano atual** (não só o rótulo do enum).
4. `trial_ends_at` e role vivem em **`accounts`** até existir Stripe; app `billing` só entra com pagamentos.

## 3. Entidades principais

### User (accounts / organizations)

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID/CUID | PK |
| name | str | opcional |
| email | str | único |
| email_verified | datetime | nullable |
| password_hash | str | Django usa `password` nativo |
| phone | str | BR |
| cpf | str | único, opcional |
| cnpj | str | opcional |
| trade_name | str | nome fantasia |
| logo | str/URL | storage |
| activity | FK/str | categoria — valida contra lista **configurável** (seed + gestão) |
| role | enum | default `enterprise` |
| trial_ends_at | datetime | nullable — fonte do bloqueio de trial |
| status | bool | ativo |
| mon_times…sun_times | list[str] | HH:MM slots empresa |
| be_called | str | único (slug) |
| token_called | str | único (URL longa) |
| booking_public_code | str | único (~20 chars) URL curta |
| stripe_customer_id | str | futuro |

### Address (1:1 User)

street, number, complement, neighborhood, city, state (UF), zip_code, country

### Service

name, price (**centavos** int), duration (**minutos**), status, user_id, soft delete (`deleted_at`)

### Employee

name, email, phone, function, status, horários por dia (`*_times`), soft delete, user_id  
**unique(user_id, email)** — não único global (multi-tenant)

### EmployeeService (N:N)

unique(employee_id, service_id)

### Client

name, email, phone, cpf, notes; unique(user_id, cpf), unique(user_id, email)

### Appointment

| Campo | Notas |
|---|---|
| appointment_date | date/datetime (dia em SP) |
| time | HH:MM |
| status | confirmed/cancelled |
| cancel_reason / cancelled_at / cancelled_by | cancelamento |
| management_token | único — autogestão pública; **armazenado em claro** (alta entropia); OTP/reset continuam hasheados |
| client_id, service_id, employee_id, user_id | FKs |
| **unique parcial** `(employee_id, appointment_date, time) WHERE status = confirmed` | libera slot após cancelamento |

### AppointmentHistory

action, performed_by, changes (JSON), reason, appointment_id

### StopDay (feriado/parada)

date, motivation, user_id — index(user, date)

### BlockedTime

date, time, motivation, employee_id, user_id — **unique(employee, date, time)**

### Reminder (tarefas do dashboard)

description (1–500), user_id

### MessageConfig

reminder_7d, reminder_24h, reminder_2h (bool), reminder_channel (default whatsapp)

### ReminderLog

appointment_id + type únicos; channel; status; sent_at

### MessageLog

auditoria de mensagens enviadas (tipo, destinatário, status)

### ActivityCategory (configurável)

slug/name, ativo, ordem — seed inicial (Barbearia, Cabelereiro, …); `master` (ou config) pode incluir/editar.  
`User.activity` referencia categoria existente e ativa.

### Auth auxiliares

LoginAttempt, IpRateLimit, EmailOtp, PasswordResetToken, SecurityLog  

> **v1:** autenticação por **sessão Django** — sem `RefreshToken`/JWT. JWT só se API separada no futuro.

### Subscription

status, plan (`TRIAL`\|`BASIC`\|`PROFESSIONAL`), price_id (nullable no trial), user_id único

## 4. Regras de integridade

1. Todo recurso de negócio tem `user_id` e operações verificam ownership.
2. Preço sempre em **centavos**; duração em **minutos**.
3. Soft delete em Service/Employee: não apagar se houver agendamentos futuros.
4. Agendamento cancelado permanece no banco (`status=cancelled`); unique parcial libera o slot.
5. Timezone de negócio: interpretar datas em `America/Sao_Paulo`.
6. OTP e reset: gerador criptográfico + **hash** no storage. `management_token`: gerador criptográfico + **persistência em claro** (lookup pela URL).

## 5. Índices críticos

- Appointment: (user, date), (employee, date), status, management_token, client
- Client: user, cpf
- BlockedTime: (user, date), (employee, date)
- StopDay: (user, date)

## 6. Migração do legado

- Preferir dump PostgreSQL + mapeamento de nomes (`UserId` → `user_id`)
- Ou ETL scripted (Django management command)
- Manter IDs quando possível para não quebrar tokens públicos

## 7. Relacionados

- [06-regras-de-negocio.md](./06-regras-de-negocio.md)
- [05-funcionalidades.md](./05-funcionalidades.md)
