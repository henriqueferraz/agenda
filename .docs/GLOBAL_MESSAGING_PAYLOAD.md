# GLOBAL_MESSAGING_PAYLOAD — Contrato GLOBAL_N8N

> **Única fonte** do schema (22 campos) e catálogo de `type`  
> Política: [13-integracoes-n8n.md](./13-integracoes-n8n.md) · Env: [10-configuracoes.md](./10-configuracoes.md)  
> BASE (agendamentos): [WEBHOOK_PAYLOAD.md](./WEBHOOK_PAYLOAD.md)  
> Atualizado: 2026-07-31

---

## Fluxo (alvo Django)

```
Django service / cron
   │  monta 22 campos + header x-global-auth
   │  POST → GLOBAL_N8N
   ▼
N8N → verifica x-global-auth → lê type → WhatsApp / Email
```

### Autenticação

| Aspecto | Detalhe |
|---|---|
| **Header** | `x-global-auth` |
| **Valor** | `GLOBAL_WEBHOOK_SECRET` |
| **Se ausente/diferente** | N8N descarta |

### Comparação rápida

| Aspecto | BASE_N8N | GLOBAL_N8N |
|---|---|---|
| Auth | `x-webhook-auth` + HMAC | `x-global-auth` |
| Formato | Array com wrapper n8n | JSON flat |
| Tipos | create/cancel/reschedule/edit | tabela abaixo |

---

## Payload enviado ao N8N

Toda mensagem global envia **exatamente 22 campos**. Campos não aplicáveis vão como string vazia `""`.

```json
{
  "type": "reminder_24h",
  "token_called": "abc123-token-da-empresa",
  "channel": "whatsapp",
  "clientName": "Maria Souza",
  "clientPhone": "5511988887777",
  "clientEmail": "maria@email.com",
  "appointmentDate": "2026-02-20",
  "appointmentTime": "10:00",
  "serviceName": "Escova Progressiva",
  "servicePrice": "15000",
  "serviceDuration": "120",
  "employeeName": "Ana",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "reason": "",
  "managementLink": "https://seusite.com/agendamento/gerenciar/abc123token",
  "message": "Olá Maria! Seu agendamento é amanhã! 📅 20/02/2026 às 10:00 — 💇 Escova Progressiva com Ana.",
  "professionalName": "",
  "promotionCode": "",
  "promotionExpiry": ""
}
```

---

## Campos do payload

Todos os campos são **sempre enviados** em todos os tipos de mensagem. Campos sem informação vão como string vazia `""`. Todos os valores são **strings** — sem exceção.

| # | Campo | Descrição | Preenchido em |
|:---:|---|---|---|
| 1 | `type` | Tag que identifica o tipo da mensagem | Sempre |
| 2 | `token_called` | Token da empresa — identifica quem originou no N8N | Sempre (`""` se não encontrado) |
| 3 | `channel` | Canal: `whatsapp`, `email` ou `both` | Sempre |
| 4 | `clientName` | Nome do destinatário | Sempre (exceto se não aplicável) |
| 5 | `clientPhone` | Telefone formatado (ex: `5511999998888`) | Sempre (exceto `email` only) |
| 6 | `clientEmail` | Email do destinatário | Quando `channel` = `email` ou `both` |
| 7 | `appointmentDate` | Data do agendamento (YYYY-MM-DD) | Mensagens vinculadas a agendamento |
| 8 | `appointmentTime` | Horário do agendamento (HH:mm) | Mensagens vinculadas a agendamento |
| 9 | `serviceName` | Nome do serviço | Mensagens vinculadas a agendamento |
| 10 | `servicePrice` | Preço em centavos como string (ex: `"5000"` = R$50) | `new_service`, mensagens com serviço |
| 11 | `serviceDuration` | Duração em minutos como string (ex: `"30"`) | `new_service`, mensagens com serviço |
| 12 | `employeeName` | Nome do funcionário/profissional | Mensagens vinculadas a agendamento |
| 13 | `oldDate` | Data original antes de alteração (YYYY-MM-DD) | `client_rescheduled` |
| 14 | `oldTime` | Horário original antes de alteração (HH:mm) | `client_rescheduled` |
| 15 | `newDate` | Nova data após alteração (YYYY-MM-DD) | `client_rescheduled` |
| 16 | `newTime` | Novo horário após alteração (HH:mm) | `client_rescheduled` |
| 17 | `reason` | Motivo (cancelamento, indisponibilidade, etc.) | `client_cancelled`, `unavailability` |
| 18 | `managementLink` | Link público de autogestão (F-08) | Lembretes (F-03), `management_link` |
| 19 | `message` | Corpo/texto da mensagem ao destinatário | Sempre |
| 20 | `professionalName` | Nome do profissional/empresa | Mensagens de negócio |
| 21 | `promotionCode` | Código de promoção/cupom | `promotion`, `coupon` |
| 22 | `promotionExpiry` | Expiração da promoção (YYYY-MM-DD) | `promotion`, `coupon` |

---

## Tipos de mensagem (`type`)

| type | Fase | Direção | Descrição | Campos preenchidos (além de base) |
|---|---|---|---|---|
| `reminder_7d` | F-03 | Sistema → Cliente | Lembrete 7 dias antes | agendamento + managementLink |
| `reminder_24h` | F-03 | Sistema → Cliente | Lembrete 24h antes | agendamento + managementLink |
| `reminder_2h` | F-03 | Sistema → Cliente | Lembrete 2h antes | agendamento + managementLink |
| `custom_individual` | F-07 | Profissional → Cliente | Mensagem livre individual | message |
| `custom_bulk` | F-07 | Profissional → Clientes | Mensagem livre em massa | message |
| `unavailability` | F-07 | Profissional → Clientes | Aviso de indisponibilidade | agendamento + reason |
| `management_link` | F-08 | Sistema → Cliente | Envia link de gerenciamento | agendamento + managementLink |
| `client_cancelled` | F-08 | Sistema → Profissional | Cliente cancelou | agendamento + reason |
| `client_rescheduled` | F-08 | Sistema → Profissional | Cliente reagendou | agendamento + old/new + reason |
| `post_appointment` | Engajamento | Sistema → Cliente | Agradecimento pós-atendimento | agendamento |
| `reengagement` | Engajamento | Sistema → Cliente | Reengajamento | message |
| `birthday` | Engajamento | Sistema → Cliente | Aniversário | message |
| `feedback_request` | Engajamento | Sistema → Cliente | Solicitar avaliação | agendamento + managementLink |
| `promotion` | Marketing | Profissional → Clientes | Promoção/desconto | promotionCode + promotionExpiry |
| `new_service` | Marketing | Profissional → Clientes | Novo serviço | serviceName + servicePrice |
| `seasonal` | Marketing | Profissional → Clientes | Campanha sazonal | message |
| `coupon` | Marketing | Profissional → Cliente | Cupom personalizado | promotionCode + promotionExpiry |
| `business_update` | Negócio | Profissional → Clientes | Alteração de horário/info | professionalName |
| `holiday_notice` | Negócio | Profissional → Clientes | Aviso de feriado/folga | professionalName |
| `new_employee` | Negócio | Profissional → Clientes | Novo profissional | employeeName + professionalName |
| `payment_confirmed` | Futuro | Sistema → Cliente | Confirmação de pagamento | agendamento |
| `payment_reminder` | Futuro | Sistema → Cliente | Lembrete de pagamento | agendamento |
| `waitlist_available` | Futuro | Sistema → Cliente | Vaga liberada | agendamento |
| `loyalty_reward` | Futuro | Sistema → Cliente | Recompensa fidelidade | message |

> **"agendamento"** = appointmentDate, appointmentTime, serviceName, employeeName
> **"old/new"** = oldDate, oldTime, newDate, newTime
> **"base"** = type, token_called, channel, clientName, clientPhone, clientEmail, message

---

## Exemplos de payload por tipo

### Lembrete 24h (`type: 'reminder_24h'`)

```json
{
  "type": "reminder_24h",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "clientName": "Maria Souza",
  "clientPhone": "5511988887777",
  "clientEmail": "maria@email.com",
  "appointmentDate": "2026-02-20",
  "appointmentTime": "10:00",
  "serviceName": "Escova Progressiva",
  "servicePrice": "",
  "serviceDuration": "",
  "employeeName": "Ana",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "reason": "",
  "managementLink": "https://seusite.com/agendamento/gerenciar/abc123token",
  "message": "Olá Maria! Seu agendamento é amanhã! 📅 20/02/2026 às 10:00 — 💇 Escova Progressiva com Ana.",
  "professionalName": "",
  "promotionCode": "",
  "promotionExpiry": ""
}
```

### Cliente cancelou (`type: 'client_cancelled'`)

```json
{
  "type": "client_cancelled",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "clientName": "Henrique Ferraz",
  "clientPhone": "5521999990000",
  "clientEmail": "henrique@empresa.com",
  "appointmentDate": "2026-02-20",
  "appointmentTime": "10:00",
  "serviceName": "Escova Progressiva",
  "servicePrice": "",
  "serviceDuration": "",
  "employeeName": "Ana",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "reason": "Não poderei comparecer",
  "managementLink": "",
  "message": "O cliente Maria Souza cancelou o agendamento de Escova Progressiva do dia 20/02/2026 às 10:00.",
  "professionalName": "",
  "promotionCode": "",
  "promotionExpiry": ""
}
```

### Cliente reagendou (`type: 'client_rescheduled'`)

```json
{
  "type": "client_rescheduled",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "clientName": "Henrique Ferraz",
  "clientPhone": "5521999990000",
  "clientEmail": "",
  "appointmentDate": "2026-02-22",
  "appointmentTime": "14:00",
  "serviceName": "Escova Progressiva",
  "servicePrice": "",
  "serviceDuration": "",
  "employeeName": "Ana",
  "oldDate": "2026-02-20",
  "oldTime": "10:00",
  "newDate": "2026-02-22",
  "newTime": "14:00",
  "reason": "Cliente solicitou novo horário",
  "managementLink": "",
  "message": "O cliente Maria Souza reagendou: Escova Progressiva de 20/02 10:00 → 22/02 14:00.",
  "professionalName": "",
  "promotionCode": "",
  "promotionExpiry": ""
}
```

### Mensagem individual do profissional (`type: 'custom_individual'`)

```json
{
  "type": "custom_individual",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "clientName": "João Silva",
  "clientPhone": "5511999998888",
  "clientEmail": "",
  "appointmentDate": "",
  "appointmentTime": "",
  "serviceName": "",
  "servicePrice": "",
  "serviceDuration": "",
  "employeeName": "",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "reason": "",
  "managementLink": "",
  "message": "Olá João, temos uma promoção especial esta semana!",
  "professionalName": "",
  "promotionCode": "",
  "promotionExpiry": ""
}
```

### Promoção (`type: 'promotion'`)

```json
{
  "type": "promotion",
  "token_called": "empresa-token-123",
  "channel": "both",
  "clientName": "João Silva",
  "clientPhone": "5511999998888",
  "clientEmail": "joao@email.com",
  "appointmentDate": "",
  "appointmentTime": "",
  "serviceName": "",
  "servicePrice": "",
  "serviceDuration": "",
  "employeeName": "",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "reason": "",
  "managementLink": "",
  "message": "🎉 20% de desconto em todos os serviços! Use o código DESC20 até 01/03.",
  "professionalName": "Studio Hair",
  "promotionCode": "DESC20",
  "promotionExpiry": "2026-03-01"
}
```

### Novo profissional (`type: 'new_employee'`)

```json
{
  "type": "new_employee",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "clientName": "Maria Souza",
  "clientPhone": "5511988887777",
  "clientEmail": "",
  "appointmentDate": "",
  "appointmentTime": "",
  "serviceName": "",
  "servicePrice": "",
  "serviceDuration": "",
  "employeeName": "Carlos",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "reason": "",
  "managementLink": "",
  "message": "Novidade! Carlos se juntou à nossa equipe. Agende um horário!",
  "professionalName": "Studio Hair",
  "promotionCode": "",
  "promotionExpiry": ""
}
```

---

## Headers enviados ao N8N

| Header | Valor | Obrigatório | Finalidade |
|---|---|:---:|---|
| `Content-Type` | `application/json` | Sim | Tipo do payload |
| `x-global-auth` | Valor de `GLOBAL_WEBHOOK_SECRET` (.env) | Sim | Autenticação — N8N verifica se a chave bate |

### Configuração no N8N

No workflow de mensagens globais do N8N, adicionar verificação no nó de entrada:

```
1. Ler header: x-global-auth
2. Comparar com: (mesmo valor do GLOBAL_WEBHOOK_SECRET no .env)
3. Se igual → continuar processamento
4. Se diferente ou ausente → finalizar (descartar mensagem)
```

Após a autenticação, ler o campo `type` do body para decidir qual fluxo seguir (template de WhatsApp, formatação de email, etc.).

---

## O que NÃO é enviado

- ID do agendamento / usuário no banco
- Timestamps internos / status
- Objetos aninhados (tudo é string flat)

Env vars: [10-configuracoes.md](./10-configuracoes.md).
