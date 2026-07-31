# 06 — Regras de Negócio

> Regras obrigatórias a preservar na reescrita  
> Atualizado: 2026-07-31

---

## 1. Multi-tenancy e ownership

1. Todo recurso de negócio pertence a um `User` (`user_id`).
2. Operações autenticadas obtêm o usuário da **sessão** — nunca confiar em `user_id` vindo do cliente.
3. Antes de mutar Service/Employee/Appointment/etc., validar `resource.user_id == request.user.id` (exceto `master` quando explicitamente permitido).
4. No vínculo employee↔service, ambos devem pertencer ao mesmo usuário.
5. E-mail de funcionário: **unique(user_id, email)** — não único global.

## 2. Timezone

1. Timezone canônico: **`America/Sao_Paulo`**.
2. Não usar “agora + 24h” manual para limites de dia.
3. Funções obrigatórias: portar de `utils/date-timezone.ts` (já testado no legado) — início/fim do dia, componentes de data, comparação, “é hoje/passado”, formatação pt-BR.

## 3. Disponibilidade de horários

Um slot HH:MM está disponível se **todas** forem verdadeiras:

1. Dia não é `StopDay` do usuário.
2. Slot existe nos horários da **empresa** naquele dia da semana.
3. Slot existe nos horários do **funcionário**.
4. Não há `BlockedTime` para (employee, date, time).
5. Não há `Appointment` **confirmed** com mesmo (employee, date, time).
6. Constraint de banco: **unique parcial** `(employee_id, appointment_date, time) WHERE status = 'confirmed'` — cancelados não ocupam o slot.
7. Em reagendamento/edição, excluir o próprio agendamento da checagem de conflito.
8. Cliente não pode ter outro confirmed no mesmo intervalo conflitante (regra do legado).

## 4. Agendamentos

1. Status padrão: `confirmed`.
2. Cancelamento: status `cancelled` + motivo opcional + `cancelled_at`/`cancelled_by` + history (sem hard-delete padrão).
3. Toda mutação relevante gera `AppointmentHistory` (action, who, changes JSON, reason).
4. `management_token`: gerado com `secrets` (alta entropia), **único**, armazenado **em claro** para lookup pela URL pública. (OTP e reset usam hash — ver §7.)
5. Preço do serviço em **centavos**; duração em **minutos**.
6. Soft delete: não remover serviço/funcionário com agendamentos futuros — bloquear com mensagem clara.

## 5. Cliente (Client)

1. Find-or-create por (user, email) ou (user, cpf) conforme fluxo.
2. Unicidade: `(user_id, cpf)` e `(user_id, email)`.
3. CPF validado com algoritmo oficial brasileiro.

## 6. Documentos e contatos BR

1. CPF/CNPJ: validação algorítmica oficial + máscaras de exibição — portar de `utils/formatCPF.ts` e `utils/formatCNPJ.ts`.
2. Telefone: formatos BR (fixo/celular) — portar de `utils/formatPhone.ts`.
3. CEP: ViaCEP com fallback BrasilAPI; UF validada contra lista oficial — portar de `utils/cep.ts`.

Mapa completo dos utilitários: [03-estrutura.md](./03-estrutura.md) §7.2.

## 7. Autenticação / segurança operacional

1. **v1:** sessão Django + CSRF (sem JWT); **rotacionar sessão no login**.
2. Senhas: mínimo **≥ 12** + validadores Django; hash Argon2 preferencial / PBKDF2.
3. OTP e-mail: expiração, tentativas limitadas, cooldown; **código hasheado** no storage.
4. Reset de senha: token hasheado, TTL curto, single-use.
5. Rate limit por IP em endpoints públicos/auth/contato/autogestão.
6. Lockout após tentativas de login excessivas.
7. Tokens aleatórios via `secrets`/`os.urandom` — nunca PRNG fraco; compare timing-safe.
8. Anti-enumeração: respostas genéricas em register/forgot/OTP.
9. Respostas de erro sem stack interno; logs sem senhas/tokens/payloads sensíveis.

Detalhamento e checklist: [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md).

## 8. Trial e planos

1. Cadastro `enterprise`: `trial_ends_at = now + 30 dias` + plano efetivo `TRIAL`.
2. Enum `Plans`: `TRIAL` | `BASIC` | `PROFESSIONAL` (Ilimitado na copy).
3. Ao assinar plano pago: sair de `TRIAL` → `BASIC` ou `PROFESSIONAL`; não coexistir `TRIAL` com cobrança ativa.
4. Após `trial_ends_at` sem plano pago: bloquear painel → upgrade (exceto `master`).
5. **App dono na v1:** `accounts` (role, trial, plano até Stripe). App `billing` só quando houver pagamentos.

## 9. Comunicação

1. WhatsApp e e-mails de **negócio ao cliente/profissional** → somente n8n (`BASE_N8N` / `GLOBAL_N8N`).
2. E-mail de **auth** (OTP/reset) → SMTP/Mailtrap no Django.
3. E-mail do **formulário de contato** do site → SMTP/Mailtrap no Django (`CONTACT_EMAIL_TO`) — ops interno, **não** n8n.
4. Eventos de appointment: `type` ∈ {create, cancel, reschedule, edit}; envio **direto** service → `BASE_N8N` (sem proxy HTTP interno na v1).
5. Lembretes: 7d / 24h / 2h conforme MessageConfig; ReminderLog idempotente `(appointment, type)`.
6. Cron v1: endpoint HTTP autenticado; Celery/Beat apenas se o volume exigir depois.
7. HMAC / tokens de auth nos webhooks outbound.

## 10. Categorias de atividade

Lista **configurável** (modelo/tabela + seed), validada server-side contra categorias **ativas**.

Seed inicial sugerido (não hardcode definitivo no código):

- Barbearia  
- Cabelereiro  
- Manicure  
- Maquiagem  
- Petshop  
- Dentistas  
- Médicos  
- Outros profissionais liberais (agendamento de horários)

Inclusão/edição/desativação: gestão `master` (ou tela de config equivalente).

## 11. URLs públicas de booking

Paths em **português** (produto BR):

1. Longa: `/agendamento/<token_called>/`
2. Curta: `/a/<booking_public_code>/`
3. Gestão: `/agendamento/gerenciar/<management_token>/`

## 12. Relacionados

- [04-modelo-de-dados.md](./04-modelo-de-dados.md)
- [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md)
- [13-integracoes-n8n.md](./13-integracoes-n8n.md)
- [00-SISTEMA.md](./00-SISTEMA.md) — decisões fechadas
