# Mensagens Globais — Plano de Implementação (N8N + Next.js)

> **Versão:** 1.1 | **Criado:** 18/02/2026 | **Atualizado:** 18/02/2026 | **Autor:** Henrique Ferraz
> **Status:** Planejado | **Funcionalidades:** F-03, F-07, F-08 + Mensagens gerais

---

## Visão Geral

O sistema Agenda possui **duas rotas de comunicação** com o N8N, cada uma com propósito distinto:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA AGENDA                                   │
│                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  ROTA 1 — Agendamento        │  │  ROTA 2 — Mensagens Globais     │ │
│  │  (BASE_N8N — já existe)      │  │  (GLOBAL_N8N — nova)    │ │
│  │                              │  │                                  │ │
│  │  • create                    │  │  • reminder_7d           (F-03) │ │
│  │  • cancel                    │  │  • reminder_24h          (F-03) │ │
│  │  • reschedule                │  │  • reminder_2h           (F-03) │ │
│  │  • edit                      │  │  • custom_individual     (F-07) │ │
│  │                              │  │  • custom_bulk           (F-07) │ │
│  │  Notifica: CLIENTE           │  │  • unavailability        (F-07) │ │
│  │  Disparado por: Profissional │  │  • client_cancelled      (F-08) │ │
│  │                              │  │  • client_rescheduled    (F-08) │ │
│  └──────────────────────────────┘  │  • management_link       (F-08) │ │
│                                    │  • post_appointment             │ │
│                                    │  • reengagement                 │ │
│                                    │  • birthday                     │ │
│                                    │  • promotion                    │ │
│                                    │  • new_service                  │ │
│                                    │  • business_update              │ │
│                                    │  • holiday_notice               │ │
│                                    │                                  │ │
│                                    │  Notifica: CLIENTE ou PROFISS.  │ │
│                                    │  Disparado por: N8N cron/Prof.  │ │
│                                    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                    │                              │
                    ▼                              ▼
            ┌──────────────┐              ┌──────────────┐
            │  N8N Workflow │              │  N8N Workflow │
            │  Agendamento │              │  Global Msg   │
            └──────┬───────┘              └──────┬───────┘
                   │                              │
                   ▼                              ▼
          ┌─────────────────┐            ┌─────────────────┐
          │  WhatsApp/Email │            │  WhatsApp/Email │
          │  (ao cliente)   │            │  (cliente/prof) │
          └─────────────────┘            └─────────────────┘
```

### Separação de responsabilidades

| Aspecto | Rota 1 (Agendamento) | Rota 2 (Global) |
|---|---|---|
| **Variável .env** | `BASE_N8N` | `GLOBAL_N8N` |
| **Propósito** | Eventos do ciclo de vida do agendamento | Comunicação geral e notificações |
| **Quem notifica** | Sempre o cliente | Cliente ou profissional |
| **Disparado por** | Ações do profissional no painel | Sistema, profissional ou cliente |
| **Payload** | Formato fixo (appointments/services) | Formato flexível (message/recipients) |
| **Funcionalidades** | Já implementado | F-07, F-08 + mensagens gerais |

---

## Variável de ambiente

```env
# URL do webhook N8N para mensagens globais
GLOBAL_N8N="https://n8n.hferraz.com.br/webhook/agendageral"

# Chave de autenticação — enviada como header x-global-auth
# O N8N compara este valor para aceitar ou descartar a mensagem
# Gerar com: openssl rand -hex 32
GLOBAL_WEBHOOK_SECRET="sua-chave-hex-de-64-caracteres"
```

### Segurança da Rota Global — Token Fixo

A rota global usa **autenticação por token fixo** (chave compartilhada via header):

| Aspecto | Rota Agendamento (BASE_N8N) | Rota Global (GLOBAL_N8N) |
|---|---|---|
| **Auth** | `x-webhook-auth` + HMAC `x-webhook-signature` | `x-global-auth` (token fixo) |
| **Secret** | `WEBHOOK_AUTH_TOKEN` + `WEBHOOK_SECRET` | `GLOBAL_WEBHOOK_SECRET` |
| **Módulo** | `lib/webhook-notify.ts` + `lib/webhook-hmac.ts` | `lib/global-messaging.ts` |

**Fluxo de autenticação:**
```
Next.js                                          N8N
   │                                               │
   │  1. Lê GLOBAL_WEBHOOK_SECRET do .env          │
   │                                               │
   │  2. Envia POST com header                     │
   │     x-global-auth: <secret>     ──────────►   │
   │                                               │
   │                                  3. N8N lê header x-global-auth
   │                                  4. Compara com secret armazenado:
   │                                     ✅ Igual → processa mensagem
   │                                     ❌ Diferente/ausente → descarta
```

**Importante:** Se o header `x-global-auth` estiver ausente ou o valor não coincidir, o N8N **descarta** a mensagem sem processar.

> Documentação completa do payload: ver [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md)

---

## Payload padrão (nova rota)

Toda mensagem global envia **exatamente 22 campos fixos**. Campos não aplicáveis vão como string vazia `""`. Todos os valores são **strings** — sem exceção. Sem objetos aninhados, sem arrays.

> Documentação completa com todos os exemplos: ver [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md)

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
  "servicePrice": "",
  "serviceDuration": "",
  "employeeName": "Ana",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "reason": "",
  "managementLink": "https://seusite.com/agendamento/gerenciar/abc123token",
  "message": "Olá Maria! Seu agendamento é amanhã!",
  "professionalName": "",
  "promotionCode": "",
  "promotionExpiry": ""
}
```

### Campos do payload (22 campos fixos)

| # | Campo | Tipo | Descrição | Preenchido em |
|:---:|---|---|---|---|
| 1 | `type` | `string` | Tag que identifica o tipo da mensagem | Sempre |
| 2 | `token_called` | `string` | Token da empresa no N8N | Sempre (`""` se não encontrado) |
| 3 | `channel` | `string` | Canal: `whatsapp`, `email` ou `both` | Sempre |
| 4 | `clientName` | `string` | Nome do destinatário | Sempre |
| 5 | `clientPhone` | `string` | Telefone (ex: `5511999998888`) | Sempre |
| 6 | `clientEmail` | `string` | Email do destinatário | Quando canal = email/both |
| 7 | `appointmentDate` | `string` | Data do agendamento (YYYY-MM-DD) | Mensagens de agendamento |
| 8 | `appointmentTime` | `string` | Horário (HH:mm) | Mensagens de agendamento |
| 9 | `serviceName` | `string` | Nome do serviço | Mensagens de agendamento |
| 10 | `servicePrice` | `string` | Preço em centavos (ex: `"5000"`) | `new_service` |
| 11 | `serviceDuration` | `string` | Duração em minutos (ex: `"30"`) | `new_service` |
| 12 | `employeeName` | `string` | Nome do funcionário | Mensagens de agendamento |
| 13 | `oldDate` | `string` | Data original (YYYY-MM-DD) | `client_rescheduled` |
| 14 | `oldTime` | `string` | Horário original (HH:mm) | `client_rescheduled` |
| 15 | `newDate` | `string` | Nova data (YYYY-MM-DD) | `client_rescheduled` |
| 16 | `newTime` | `string` | Novo horário (HH:mm) | `client_rescheduled` |
| 17 | `reason` | `string` | Motivo da ação | `client_cancelled`, `unavailability` |
| 18 | `managementLink` | `string` | Link de autogestão (F-08) | Lembretes, `management_link` |
| 19 | `message` | `string` | Corpo/texto da mensagem | Sempre |
| 20 | `professionalName` | `string` | Nome do profissional/empresa | Mensagens de negócio |
| 21 | `promotionCode` | `string` | Código de promoção | `promotion`, `coupon` |
| 22 | `promotionExpiry` | `string` | Expiração (YYYY-MM-DD) | `promotion`, `coupon` |

---

## Tipos de mensagem (`type`)

### Fase 1A — F-03: Lembretes Automáticos Pré-Agendamento

| type | Direção | Descrição | channel |
|---|---|---|---|
| `reminder_7d` | Sistema → Cliente | Lembrete 7 dias antes do agendamento | `whatsapp` ou `both` |
| `reminder_24h` | Sistema → Cliente | Lembrete 24 horas antes do agendamento | `whatsapp` ou `both` |
| `reminder_2h` | Sistema → Cliente | Lembrete 2 horas antes do agendamento | `whatsapp` ou `both` |

#### Arquitetura F-03 (N8N cron → Next.js API → Rota Global → N8N envia)

```
┌──────────────┐   HTTP POST    ┌──────────────────────────────┐
│  N8N (cron)  │ ────────────► │  /api/cron/reminders          │
│  cada 5 min  │  x-webhook-   │  (Next.js API Route)          │
│              │  auth header   │                                │
└──────────────┘               │  1. Valida x-webhook-auth      │
                               │  2. Busca agendamentos (Prisma)│
                               │     - 7d, 24h, 2h antes        │
                               │  3. Filtra não enviados         │
                               │     (ReminderLog)               │
                               │  4. Monta mensagem com          │
                               │     managementLink (F-08)       │
                               │  5. sendGlobalMessage() p/ cada │
                               │  6. Marca como enviado          │
                               │     (ReminderLog)               │
                               └──────────────┬───────────────────┘
                                              │
                                 POST (rota global)
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │  N8N (Global Webhook)        │
                               │  Envia WhatsApp/Email        │
                               └──────────────────────────────┘
```

#### Modelo Prisma — `ReminderLog`

```prisma
model ReminderLog {
  id            String   @id @default(cuid())
  appointmentId String
  type          String   // 'reminder_7d' | 'reminder_24h' | 'reminder_2h'
  channel       String   // 'whatsapp' | 'email' | 'both'
  status        String   // 'sent' | 'failed'
  sentAt        DateTime @default(now())

  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@unique([appointmentId, type])
  @@index([appointmentId])
}
```

> O `@@unique([appointmentId, type])` garante que cada tipo de lembrete seja enviado **uma única vez** por agendamento. Controle de duplicatas confiável via banco.

#### Intervalos de lembrete

| type | Quando enviar | Janela de detecção |
|---|---|---|
| `reminder_7d` | 7 dias antes do agendamento | Data do agendamento = CURRENT_DATE + 7 dias |
| `reminder_24h` | 24 horas antes do agendamento | Data do agendamento = amanhã E horário dentro da janela de 5 min |
| `reminder_2h` | 2 horas antes do agendamento | Data do agendamento = hoje E horário entre 115 e 125 min à frente |

#### Lógica da API `/api/cron/reminders`

```typescript
// Pseudocódigo da API Route
export async function POST(request: Request) {
  // 1. Valida autenticação (x-webhook-auth)
  const authToken = request.headers.get('x-webhook-auth')
  if (authToken !== process.env.WEBHOOK_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = getNowInSaoPaulo()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // 2. Lembrete 7 dias — busca agendamentos daqui a 7 dias
  const in7Days = addDays(now, 7)
  const appointments7d = await prisma.appointment.findMany({
    where: {
      status: 'confirmed',
      appointmentDate: { gte: startOfDay(in7Days), lte: endOfDay(in7Days) },
      reminderLogs: { none: { type: 'reminder_7d' } },
    },
    include: { service: true, employee: true, user: true },
  })

  // 3. Lembrete 24h — busca agendamentos de amanhã na janela de 5 min
  const in24h = addHours(now, 24)
  const appointments24h = await prisma.appointment.findMany({
    where: {
      status: 'confirmed',
      appointmentDate: { gte: startOfDay(in24h), lte: endOfDay(in24h) },
      reminderLogs: { none: { type: 'reminder_24h' } },
    },
    include: { service: true, employee: true, user: true },
  })

  // 4. Lembrete 2h — busca agendamentos de hoje entre 115-125 min à frente
  const appointments2h = await prisma.appointment.findMany({
    where: {
      status: 'confirmed',
      appointmentDate: { gte: startOfDay(now), lte: endOfDay(now) },
      reminderLogs: { none: { type: 'reminder_2h' } },
    },
    include: { service: true, employee: true, user: true },
  })
  // Filtra por horário: time entre now+115min e now+125min

  // 5. Para cada agendamento encontrado:
  for (const apt of [...appointments7d, ...appointments24h, ...appointments2h]) {
    const managementLink = apt.managementToken
      ? `${baseUrl}/agendamento/gerenciar/${apt.managementToken}`
      : ''

    const message = buildReminderMessage(apt, reminderType, managementLink)

    await sendGlobalMessage({
      type: reminderType,
      channel: 'whatsapp',
      recipients: [{ name: apt.name, phone: apt.phone, email: apt.email }],
      message,
      userId: apt.userId,
      metadata: {
        appointmentId: apt.id,
        appointmentDate: formatDate(apt.appointmentDate),
        appointmentTime: apt.time,
        serviceName: apt.service.name,
        employeeName: apt.employee.name,
        managementLink,
      },
    })

    // 6. Registra no ReminderLog (evita duplicata)
    await prisma.reminderLog.create({
      data: { appointmentId: apt.id, type: reminderType, channel: 'whatsapp', status: 'sent' },
    })
  }

  return NextResponse.json({ sent: totalSent })
}
```

#### Exemplo: `reminder_7d`

```json
{
  "type": "reminder_7d",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    {
      "name": "Maria Souza",
      "phone": "5511988887777",
      "email": "maria@email.com"
    }
  ],
  "message": "Olá Maria! Lembrete: você tem um agendamento em 7 dias.\n\n📅 27/02/2026 às 10:00\n💇 Escova Progressiva com Ana\n\nPrecisa cancelar ou reagendar? Acesse: https://seusite.com/agendamento/gerenciar/abc123token",
  "metadata": {
    "appointmentId": "apt_456",
    "appointmentDate": "2026-02-27",
    "appointmentTime": "10:00",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana",
    "managementLink": "https://seusite.com/agendamento/gerenciar/abc123token"
  }
}
```

#### Exemplo: `reminder_24h`

```json
{
  "type": "reminder_24h",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    {
      "name": "Maria Souza",
      "phone": "5511988887777",
      "email": "maria@email.com"
    }
  ],
  "message": "Olá Maria! Lembrete: seu agendamento é amanhã!\n\n📅 20/02/2026 às 10:00\n💇 Escova Progressiva com Ana\n📍 Rua Exemplo, 123 — Centro\n\nPrecisa cancelar ou reagendar? Acesse: https://seusite.com/agendamento/gerenciar/abc123token",
  "metadata": {
    "appointmentId": "apt_456",
    "appointmentDate": "2026-02-20",
    "appointmentTime": "10:00",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana",
    "managementLink": "https://seusite.com/agendamento/gerenciar/abc123token"
  }
}
```

#### Exemplo: `reminder_2h`

```json
{
  "type": "reminder_2h",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    {
      "name": "Maria Souza",
      "phone": "5511988887777",
      "email": "maria@email.com"
    }
  ],
  "message": "Olá Maria! Seu horário é daqui a 2 horas!\n\n📅 Hoje às 10:00\n💇 Escova Progressiva com Ana\n📍 Rua Exemplo, 123 — Centro\n\nNão poderá comparecer? Acesse: https://seusite.com/agendamento/gerenciar/abc123token",
  "metadata": {
    "appointmentId": "apt_456",
    "appointmentDate": "2026-02-20",
    "appointmentTime": "10:00",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana",
    "managementLink": "https://seusite.com/agendamento/gerenciar/abc123token"
  }
}
```

#### Mensagens de lembrete (templates)

| type | Mensagem |
|---|---|
| `reminder_7d` | "Olá {nome}! Lembrete: você tem um agendamento em 7 dias. 📅 {data} às {hora} — 💇 {serviço} com {profissional}. Precisa cancelar ou reagendar? {link}" |
| `reminder_24h` | "Olá {nome}! Lembrete: seu agendamento é amanhã! 📅 {data} às {hora} — 💇 {serviço} com {profissional}. 📍 {endereço}. Precisa cancelar ou reagendar? {link}" |
| `reminder_2h` | "Olá {nome}! Seu horário é daqui a 2 horas! 📅 Hoje às {hora} — 💇 {serviço} com {profissional}. 📍 {endereço}. Não poderá comparecer? {link}" |

> Todos os lembretes incluem o `managementLink` do F-08, permitindo ao cliente cancelar ou reagendar diretamente pelo link.

---

### Fase 1B — F-07: Mensagens do Profissional para Clientes

| type | Direção | Descrição | channel |
|---|---|---|---|
| `custom_individual` | Profissional → Cliente | Mensagem livre para um cliente | `whatsapp` |
| `custom_bulk` | Profissional → Clientes | Mensagem livre para múltiplos clientes | `whatsapp` |
| `unavailability` | Profissional → Clientes | Aviso de indisponibilidade + cancelamento em lote | `whatsapp` |

#### Exemplo: `custom_individual`

O profissional envia uma mensagem direta para um cliente específico a partir do detalhe do agendamento.

```json
{
  "type": "custom_individual",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    {
      "name": "Maria Souza",
      "phone": "5511988887777",
      "email": "maria@email.com"
    }
  ],
  "message": "Olá Maria, gostaria de avisar que sua escova progressiva de amanhã foi reagendada. Qualquer dúvida, estou à disposição!",
  "metadata": {
    "appointmentId": "apt_456",
    "appointmentDate": "2026-02-20",
    "appointmentTime": "10:00",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana"
  }
}
```

#### Exemplo: `custom_bulk`

O profissional envia uma promoção para todos os clientes com agendamento na semana.

```json
{
  "type": "custom_bulk",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    { "name": "Maria Souza", "phone": "5511988887777", "email": "maria@email.com" },
    { "name": "João Silva", "phone": "5511999998888", "email": "joao@email.com" },
    { "name": "Ana Costa", "phone": "5511977776666", "email": "ana@email.com" }
  ],
  "message": "Olá {name}, temos uma promoção especial esta semana: 20% de desconto em todos os serviços! Agende pelo link: https://seusite.com/agendamento/empresa-token-123",
  "metadata": {}
}
```

#### Exemplo: `unavailability`

O profissional ficou doente e precisa cancelar todos os agendamentos de um dia.

```json
{
  "type": "unavailability",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    { "name": "Maria Souza", "phone": "5511988887777", "email": "maria@email.com" },
    { "name": "João Silva", "phone": "5511999998888", "email": "joao@email.com" }
  ],
  "message": "Olá {name}, infelizmente preciso cancelar seu agendamento do dia {date} às {time}. Motivo: problemas de saúde. Peço desculpas pelo inconveniente. Deseja reagendar?",
  "metadata": {
    "reason": "Problemas de saúde",
    "period": { "start": "2026-02-20", "end": "2026-02-20" },
    "affectedCount": 2
  }
}
```

---

### Fase 2 — F-08: Autogestão do Cliente

| type | Direção | Descrição | channel |
|---|---|---|---|
| `management_link` | Sistema → Cliente | Envia link de gerenciamento do agendamento | `whatsapp` ou `both` |
| `client_cancelled` | Sistema → Profissional | Avisa profissional que cliente cancelou | `whatsapp` |
| `client_rescheduled` | Sistema → Profissional | Avisa profissional que cliente reagendou | `whatsapp` |

#### Exemplo: `management_link`

Enviado automaticamente junto com a confirmação, ou sob demanda.

```json
{
  "type": "management_link",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    {
      "name": "Maria Souza",
      "phone": "5511988887777",
      "email": "maria@email.com"
    }
  ],
  "message": "Olá Maria! Seu agendamento: Escova Progressiva em 20/02/2026 às 10:00 com Ana. Precisa cancelar ou reagendar? Acesse: https://seusite.com/agendamento/gerenciar/abc123token",
  "metadata": {
    "appointmentId": "apt_456",
    "appointmentDate": "2026-02-20",
    "appointmentTime": "10:00",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana",
    "managementLink": "https://seusite.com/agendamento/gerenciar/abc123token"
  }
}
```

#### Exemplo: `client_cancelled`

O cliente cancelou pelo link público — profissional recebe o aviso.

```json
{
  "type": "client_cancelled",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    {
      "name": "Henrique Ferraz",
      "phone": "5521999990000",
      "email": "henrique@empresa.com"
    }
  ],
  "message": "O cliente Maria Souza cancelou o agendamento de Escova Progressiva do dia 20/02/2026 às 10:00. Motivo: Não poderei comparecer. O horário já foi liberado para novos agendamentos.",
  "metadata": {
    "appointmentId": "apt_456",
    "appointmentDate": "2026-02-20",
    "appointmentTime": "10:00",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana",
    "reason": "Não poderei comparecer"
  }
}
```

#### Exemplo: `client_rescheduled`

O cliente reagendou pelo link público — profissional recebe o aviso.

```json
{
  "type": "client_rescheduled",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    {
      "name": "Henrique Ferraz",
      "phone": "5521999990000",
      "email": "henrique@empresa.com"
    }
  ],
  "message": "O cliente Maria Souza reagendou: Escova Progressiva de 20/02/2026 10:00 → 22/02/2026 14:00.",
  "metadata": {
    "appointmentId": "apt_456",
    "appointmentDate": "2026-02-22",
    "appointmentTime": "14:00",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana",
    "oldDate": "2026-02-20",
    "oldTime": "10:00",
    "newDate": "2026-02-22",
    "newTime": "14:00"
  }
}
```

---

### Fase 3 — Engajamento e Follow-up

| type | Direção | Descrição | channel |
|---|---|---|---|
| `post_appointment` | Sistema → Cliente | Agradecimento após atendimento | `whatsapp` |
| `reengagement` | Sistema → Cliente | Cliente sem agendamento há X dias | `whatsapp` |
| `birthday` | Sistema → Cliente | Mensagem de aniversário | `whatsapp` |
| `feedback_request` | Sistema → Cliente | Solicitar avaliação (AC-09) | `whatsapp` ou `both` |

#### Exemplo: `post_appointment`

```json
{
  "type": "post_appointment",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    { "name": "Maria Souza", "phone": "5511988887777" }
  ],
  "message": "Olá Maria! Obrigado pela sua visita hoje. Como foi sua experiência com a Escova Progressiva? Esperamos te ver novamente!",
  "metadata": {
    "appointmentId": "apt_456",
    "serviceName": "Escova Progressiva",
    "employeeName": "Ana"
  }
}
```

#### Exemplo: `reengagement`

```json
{
  "type": "reengagement",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    { "name": "João Silva", "phone": "5511999998888" }
  ],
  "message": "Olá João, faz 45 dias que não te vemos! Que tal agendar um horário? Acesse: https://seusite.com/agendamento/empresa-token-123",
  "metadata": {}
}
```

#### Exemplo: `birthday`

```json
{
  "type": "birthday",
  "token_called": "empresa-token-123",
  "channel": "whatsapp",
  "recipients": [
    { "name": "Maria Souza", "phone": "5511988887777" }
  ],
  "message": "Feliz aniversário, Maria! 🎂 Para comemorar, preparamos um desconto de 15% no seu próximo serviço. Agende: https://seusite.com/agendamento/empresa-token-123",
  "metadata": {}
}
```

---

### Fase 4 — Marketing e Promoção

| type | Direção | Descrição | channel |
|---|---|---|---|
| `promotion` | Profissional → Clientes | Desconto ou oferta especial | `whatsapp` ou `both` |
| `new_service` | Profissional → Clientes | Divulgação de novo serviço | `whatsapp` ou `both` |
| `seasonal` | Profissional → Clientes | Campanha sazonal | `whatsapp` ou `both` |
| `coupon` | Profissional → Cliente | Cupom personalizado (AC-13) | `whatsapp` |

---

### Fase 5 — Informações do Negócio

| type | Direção | Descrição | channel |
|---|---|---|---|
| `business_update` | Profissional → Clientes | Alteração de horário/informações | `whatsapp` ou `both` |
| `holiday_notice` | Profissional → Clientes | Aviso de feriado/folga | `whatsapp` |
| `new_employee` | Profissional → Clientes | Apresentação de novo profissional | `whatsapp` |

---

### Fase futura — Financeiro e Lista de Espera

| type | Direção | Descrição | Depende de |
|---|---|---|---|
| `payment_confirmed` | Sistema → Cliente | Confirmação de pagamento | AC-02 |
| `payment_reminder` | Sistema → Cliente | Lembrete de pagamento pendente | AC-02 |
| `waitlist_available` | Sistema → Cliente | Vaga liberada na lista de espera | AC-16 |
| `loyalty_reward` | Sistema → Cliente | Recompensa de fidelidade | AC-14 |

---

## Implementação no Next.js

### Arquitetura

```
┌───────────────────────────────────────────────────────────┐
│                      Next.js                               │
│                                                           │
│  lib/global-messaging.ts        ← Utilitário de envio     │
│    sendGlobalMessage()          ← Função principal         │
│                                                           │
│  app/api/webhook/global/route.ts  ← API route (proxy)     │
│  app/api/cron/reminders/route.ts  ← API cron lembretes    │
│                                                           │
│  Prisma (F-03):                                           │
│    ReminderLog                  ← Controle de duplicatas  │
│                                                           │
│  Server Actions (F-07):                                   │
│    send-whatsapp-message.ts     ← Individual              │
│    send-bulk-whatsapp.ts        ← Em massa                │
│    notify-unavailability.ts     ← Indisponibilidade       │
│                                                           │
│  Server Actions (F-08):                                   │
│    cancel-appointment-public.ts   ← Cliente cancela       │
│    reschedule-appointment-public.ts ← Cliente reagenda    │
│                                                           │
│  Prisma (F-08):                                           │
│    Appointment.managementToken  ← Token único por apt     │
│                                                           │
│  Rota pública (F-08):                                     │
│    /agendamento/gerenciar/[token] ← Página do cliente     │
└───────────────────────────────────────────────────────────┘
```

### Lib — `lib/global-messaging.ts` ✅ Implementado

Utilitário server-side para envio de mensagens globais. Payload padronizado (22 campos fixos, `""` para não usados) com autenticação via header `x-global-auth`.

```typescript
import { sendGlobalMessage } from '@/lib/global-messaging'

// Lembrete 24h — todos os 22 campos são enviados, os não preenchidos = ''
await sendGlobalMessage({
  type: 'reminder_24h',
  userId: session.id,
  channel: 'whatsapp',
  clientName: 'Maria Souza',
  clientPhone: '5511988887777',
  appointmentDate: '2026-02-20',
  appointmentTime: '10:00',
  serviceName: 'Escova Progressiva',
  employeeName: 'Ana',
  managementLink: 'https://seusite.com/agendamento/gerenciar/abc123',
  message: 'Olá Maria! Seu agendamento é amanhã!',
})
```

> Ver documentação completa do payload em [GLOBAL_MESSAGING_PAYLOAD.md](./GLOBAL_MESSAGING_PAYLOAD.md)

---

## Plano de implementação

### Fase 1 — Infraestrutura base

| # | Tarefa | Tipo | Estimativa |
|:---:|---|---|:---:|
| 1.1 | ~~Criar `lib/global-messaging.ts` (sendGlobalMessage + payload padronizado 22 campos)~~ ✅ | Lib | ✅ Feito |
| 1.2 | ~~Adicionar `GLOBAL_N8N` e `GLOBAL_WEBHOOK_SECRET` no `.env` e `ENVIRONMENT.md`~~ ✅ | Config | ✅ Feito |
| 1.3 | ~~Criar `lib/global-webhook-hmac.ts` (HMAC-SHA256 dedicado)~~ ✅ | Lib | ✅ Feito |
| 1.4 | ~~Criar testes para `lib/global-webhook-hmac.ts` (14 testes)~~ ✅ | Teste | ✅ Feito |
| 1.5 | ~~Criar testes para `lib/global-messaging.ts` (21 testes)~~ ✅ | Teste | ✅ Feito |
| 1.6 | ~~Criar `GLOBAL_MESSAGING_PAYLOAD.md` (documentação do payload)~~ ✅ | Doc | ✅ Feito |

### Fase 1.5 — F-03: Lembretes automáticos

| # | Tarefa | Tipo | Estimativa |
|:---:|---|---|:---:|
| 1.6 | Criar modelo `ReminderLog` no Prisma + migração | Schema | 30min |
| 1.7 | Criar `app/api/cron/reminders/route.ts` (lógica de lembretes) | API Route | 2h |
| 1.8 | Implementar busca de agendamentos 7d/24h/2h com filtro de ReminderLog | Prisma | 1h |
| 1.9 | Montar mensagens com `managementLink` (integração F-08) | Lib | 30min |
| 1.10 | Criar testes para `app/api/cron/reminders/route.ts` | Teste | 2h |
| 1.11 | Configurar Schedule Trigger no N8N (POST para `/api/cron/reminders`) | N8N | 30min |

> **Nota:** F-03 depende do `managementToken` do F-08 para incluir o link de cancelar/reagendar nos lembretes. A Fase 1.5 pode ser implementada antes da Fase 2 (o link será vazio até F-08 estar pronto), ou após a Fase 2 (com link completo desde o início).

### Fase 2 — F-08: Autogestão do cliente

| # | Tarefa | Tipo | Estimativa |
|:---:|---|---|:---:|
| 2.1 | Adicionar `managementToken` no modelo Prisma + migração | Schema | 30min |
| 2.2 | Gerar `managementToken` na criação de agendamentos (painel + público) | Action | 1h |
| 2.3 | Criar rota pública `/agendamento/gerenciar/[token]/page.tsx` | Página | 2h |
| 2.4 | Criar `cancel-appointment-public.ts` (usa core + sendGlobalMessage) | Action | 1h |
| 2.5 | Criar `reschedule-appointment-public.ts` (usa core + sendGlobalMessage) | Action | 2h |
| 2.6 | UI da página pública (detalhes + cancelar + reagendar + TimeGrid) | UI | 3h |
| 2.7 | Incluir `managementLink` no payload da confirmação existente (create) | Action | 30min |
| 2.8 | Criar testes para as server actions públicas | Teste | 2h |
| 2.9 | Criar testes para a página pública | Teste | 1h |
| 2.10 | Atualizar template no N8N para incluir link de gerenciamento | N8N | 30min |

### Fase 3 — F-07: Mensagens WhatsApp do profissional

| # | Tarefa | Tipo | Estimativa |
|:---:|---|---|:---:|
| 3.1 | Criar `send-whatsapp-message.ts` (individual via sendGlobalMessage) | Action | 1h |
| 3.2 | Criar `send-bulk-whatsapp.ts` (massa via sendGlobalMessage) | Action | 1.5h |
| 3.3 | Criar `notify-unavailability.ts` (lote: cancelar + notificar) | Action | 2h |
| 3.4 | UI: Botão "Enviar WhatsApp" no detalhe do agendamento | UI | 1h |
| 3.5 | UI: Botão "Informar indisponibilidade" no calendário | UI | 1h |
| 3.6 | UI: Modal de indisponibilidade (período + afetados + preview) | UI | 3h |
| 3.7 | UI: Modal de mensagem individual (template + customizada) | UI | 2h |
| 3.8 | Criar testes para as server actions de F-07 | Teste | 2h |

### Fase 4 — Engajamento (opcional, após F-03/F-07/F-08)

| # | Tarefa | Tipo | Estimativa |
|:---:|---|---|:---:|
| 4.1 | `post_appointment` — agradecimento após atendimento | API + N8N | 2h |
| 4.2 | `reengagement` — reengajamento de clientes inativos | API + N8N | 2h |
| 4.3 | `birthday` — mensagem de aniversário | API + N8N | 2h |

> Fase 4 segue o mesmo padrão: N8N cron → Next.js API → sendGlobalMessage → N8N envia.

---

## Cronograma estimado

| Fase | Descrição | Estimativa | Depende de |
|---|---|:---:|---|
| **Fase 1** | Infraestrutura base | **~4h** | — |
| **Fase 1.5** | F-03 (Lembretes automáticos) | **~6.5h** | Fase 1 |
| **Fase 2** | F-08 (Autogestão do cliente) | **~14h** | Fase 1 |
| **Fase 3** | F-07 (WhatsApp profissional) | **~13h** | Fase 1 |
| **Fase 4** | Engajamento | **~6h** | Fases 1, 1.5 |
| **Total Next.js** | Fases 1 + 1.5 + 2 + 3 | **~37.5h** | ~5-6 dias |

> Fases 1.5, 2 e 3 podem ser desenvolvidas em paralelo após a Fase 1.
> Recomendação: Fase 1 → Fase 2 (managementToken) → Fase 1.5 (lembretes com link) → Fase 3.

---

## Fluxo de dados completo

### F-03 — Lembrete automático (7d / 24h / 2h)

```
1. N8N Schedule Trigger dispara a cada 5 minutos
2. N8N faz POST para /api/cron/reminders com header x-webhook-auth
3. API Route valida autenticação
4. Prisma busca agendamentos confirmados nas janelas de 7d, 24h e 2h
5. Filtra os que ainda NÃO têm ReminderLog para aquele tipo
6. Para cada agendamento encontrado:
   ├─ Monta mensagem com template (inclui managementLink do F-08)
   ├─ Envia sendGlobalMessage({ type: 'reminder_Xd/h', recipients: [cliente] })
   └─ Cria ReminderLog({ appointmentId, type, status: 'sent' })
7. N8N Global Webhook recebe e envia WhatsApp/Email ao cliente
8. Cliente recebe: "Olá Maria! Lembrete: seu agendamento é amanhã..."
   └─ Com link para cancelar/reagendar (F-08)
```

### F-08 — Cliente cancela pelo link público

```
1. Cliente recebe confirmação WhatsApp com link de gerenciamento
2. Cliente acessa: /agendamento/gerenciar/{managementToken}
3. Página exibe: dados do agendamento + botões Cancelar / Reagendar
4. Cliente clica "Cancelar" → modal de confirmação + motivo (opcional)
5. Server action: cancel-appointment-public.ts
   ├─ Valida managementToken (busca agendamento)
   ├─ Valida prazo mínimo configurável
   ├─ Chama cancelAppointmentCore({ cancelledBy: 'client' })
   ├─ Envia sendGlobalMessage({ type: 'client_cancelled', recipients: [profissional] })
   └─ Invalida managementToken
6. Cliente vê tela de confirmação
7. Profissional recebe WhatsApp: "O cliente X cancelou o agendamento de..."
```

### F-08 — Cliente reagenda pelo link público

```
1. Cliente acessa: /agendamento/gerenciar/{managementToken}
2. Cliente clica "Reagendar" → exibe calendário com horários disponíveis
3. Cliente seleciona nova data/hora → confirma
4. Server action: reschedule-appointment-public.ts
   ├─ Valida managementToken (busca agendamento)
   ├─ Valida prazo mínimo configurável
   ├─ Valida conflitos (F-01) via rescheduleAppointmentCore
   ├─ Chama rescheduleAppointmentCore({ performedBy: 'client' })
   ├─ Envia sendGlobalMessage({ type: 'client_rescheduled', recipients: [profissional] })
   ├─ Envia rota existente (BASE_N8N) com type: 'reschedule' para notificar cliente
   └─ Gera novo managementToken para o agendamento reagendado
5. Cliente vê confirmação com novo horário
6. Profissional recebe WhatsApp: "O cliente X reagendou de DD/MM HH:MM → DD/MM HH:MM"
```

### F-07 — Profissional informa indisponibilidade

```
1. Profissional acessa calendário → clica "Informar indisponibilidade"
2. Modal: seleciona período (date range) + motivo
3. Sistema lista agendamentos afetados no período
4. Profissional visualiza lista + preview da mensagem
5. Profissional confirma envio
6. Server action: notify-unavailability.ts
   ├─ Busca todos agendamentos confirmados no período
   ├─ Para cada: chama cancelAppointmentCore({ cancelledBy: 'professional' })
   ├─ Cria StopDay para o período (se não existir)
   ├─ Envia sendGlobalMessage({
   │     type: 'unavailability',
   │     recipients: [todos os clientes afetados],
   │     message: template preenchido
   │   })
   └─ Revalida cache do calendário
7. Cada cliente recebe WhatsApp: "Olá {nome}, infelizmente preciso cancelar..."
```

### F-07 — Profissional envia mensagem individual

```
1. Profissional abre detalhe do agendamento → clica "Enviar WhatsApp"
2. Modal: seleciona template ou escreve mensagem
3. Profissional confirma envio
4. Server action: send-whatsapp-message.ts
   ├─ Valida sessão JWT
   ├─ Busca dados do agendamento e cliente
   ├─ Envia sendGlobalMessage({
   │     type: 'custom_individual',
   │     recipients: [cliente],
   │     message: mensagem
   │   })
   └─ Retorna sucesso
5. Cliente recebe WhatsApp com a mensagem
```

---

## Segurança

| Aspecto | Implementação |
|---|---|
| **Autenticação** | Server actions do painel (F-07) usam JWT via `getUserFromToken` |
| **Token público** | F-08 usa `managementToken` (crypto.randomBytes(32)) — sem JWT |
| **Rate limit** | Rota pública `/agendamento/gerenciar/[token]` deve ter rate limit |
| **Anti-brute-force** | Token de 64 chars hex = 2^256 possibilidades (inviável brute force) |
| **Auth Global** | Header `x-global-auth` com valor de `GLOBAL_WEBHOOK_SECRET` — token fixo enviado em toda requisição |
| **Secret Isolado** | `GLOBAL_WEBHOOK_SECRET` dedicado, separado do `WEBHOOK_SECRET`/`WEBHOOK_AUTH_TOKEN` da rota de agendamentos |
| **Rejeição N8N** | Se `x-global-auth` ausente ou valor diferente, N8N descarta a mensagem |
| **Payload padronizado** | 22 campos fixos, todos strings, `""` para não aplicáveis — sem objetos aninhados |
| **Validação** | Payload validado com Zod antes de enviar ao N8N |
| **Propriedade** | F-07 valida que o agendamento pertence ao userId da sessão |
| **Prazo mínimo** | F-08 valida prazo mínimo configurável antes de cancelar/reagendar |
| **Token único** | managementToken invalidado após cancelamento (uso único) |

---

## Checklist de acompanhamento

### Fase 1 — Infraestrutura

- [x] `GLOBAL_N8N` configurado no `.env` e `.env.local`
- [x] `GLOBAL_WEBHOOK_SECRET` gerado e configurado no `.env` e `.env.local`
- [x] `lib/global-webhook-hmac.ts` criado (gera e verifica HMAC-SHA256 com secret dedicado)
- [x] Testes para `lib/global-webhook-hmac.ts` passando (14 testes)
- [x] `ENVIRONMENT.md` atualizado com documentação das novas variáveis
- [x] `lib/global-messaging.ts` criado — payload padronizado 22 campos + auth `x-global-auth`
- [x] Testes para `lib/global-messaging.ts` passando (21 testes)
- [x] `GLOBAL_MESSAGING_PAYLOAD.md` criado (documentação completa do payload)
- [ ] Testes passando para a infraestrutura base completa

### Fase 1.5 — F-03 (Lembretes automáticos)

- [ ] Modelo `ReminderLog` no Prisma (migração aplicada)
- [ ] API route `/api/cron/reminders` funcionando
- [ ] Lembrete 7 dias antes funcionando
- [ ] Lembrete 24h antes funcionando
- [ ] Lembrete 2h antes funcionando
- [ ] Controle de duplicatas via `ReminderLog` (@@unique)
- [ ] managementLink incluído nos lembretes (integração F-08)
- [ ] Schedule Trigger configurado no N8N (a cada 5 min)
- [ ] Testes completos para a API de lembretes

### Fase 2 — F-08

- [ ] Campo `managementToken` no modelo Prisma (migração aplicada)
- [ ] Token gerado na criação de agendamentos (painel + público)
- [ ] Rota pública `/agendamento/gerenciar/[token]` funcionando
- [ ] Cancel público funcionando (core + notificação ao profissional)
- [ ] Reschedule público funcionando (core + conflitos + notificação)
- [ ] UI responsiva (mobile-first, touch targets 44px)
- [ ] Link de gerenciamento incluído na confirmação WhatsApp/Email
- [ ] managementToken invalidado após cancelamento
- [ ] Rate limit na rota pública
- [ ] Testes completos para F-08

### Fase 3 — F-07

- [ ] Mensagem individual funcionando (template + customizada)
- [ ] Mensagem em massa funcionando
- [ ] Indisponibilidade funcionando (cancelamento em lote + notificação)
- [ ] UI: botão "Enviar WhatsApp" no detalhe do agendamento
- [ ] UI: botão "Informar indisponibilidade" no calendário
- [ ] UI: modal de indisponibilidade (período + afetados + preview)
- [ ] UI: modal de mensagem individual
- [ ] Testes completos para F-07

### Fase 4 — Engajamento (N8N)

- [ ] `post_appointment` configurado no N8N
- [ ] `reengagement` configurado no N8N
- [ ] `birthday` configurado no N8N

---

## Arquivos relacionados (após implementação)

| Arquivo | Descrição | Fase |
|---|---|:---:|
| `lib/global-messaging.ts` | Utilitário de envio de mensagens globais | 1 |
| `app/api/webhook/global/route.ts` | API route proxy para mensagens globais | 1 |
| `app/api/cron/reminders/route.ts` | API route de lembretes automáticos (F-03) | 1.5 |
| `tests/app/api/cron/reminders.spec.ts` | Testes da API de lembretes | 1.5 |
| `app/(public)/agendamento/gerenciar/[token]/page.tsx` | Página pública de autogestão | 2 |
| `app/(public)/agendamento/gerenciar/[token]/_actions/cancel-appointment-public.ts` | Cancel público | 2 |
| `app/(public)/agendamento/gerenciar/[token]/_actions/reschedule-appointment-public.ts` | Reschedule público | 2 |
| `app/(panel)/dashboard/schedule/calendar/_actions/send-whatsapp-message.ts` | Mensagem individual | 3 |
| `app/(panel)/dashboard/schedule/calendar/_actions/send-bulk-whatsapp.ts` | Mensagem em massa | 3 |
| `app/(panel)/dashboard/schedule/calendar/_actions/notify-unavailability.ts` | Indisponibilidade | 3 |
| `tests/lib/global-messaging.spec.ts` | Testes do utilitário | 1 |
| `tests/app/api/webhook/global.spec.ts` | Testes da API route | 1 |
| `tests/app/actions/cancel-appointment-public.spec.ts` | Testes cancel público | 2 |
| `tests/app/actions/reschedule-appointment-public.spec.ts` | Testes reschedule público | 2 |
| `tests/app/actions/send-whatsapp-message.spec.ts` | Testes mensagem individual | 3 |
| `tests/app/actions/notify-unavailability.spec.ts` | Testes indisponibilidade | 3 |
