# WEBHOOK_PAYLOAD — Contrato BASE_N8N (agendamentos)

> **Única fonte** do schema enviado a `BASE_N8N`  
> Política: [13-integracoes-n8n.md](./13-integracoes-n8n.md) · Env: [10-configuracoes.md](./10-configuracoes.md)  
> Atualizado: 2026-07-31

---

## Fluxo (alvo Django)

```
Painel / booking público → Django service → POST BASE_N8N → WhatsApp / Email
```

Sem proxy HTTP interno na v1 (o legado Next.js usava `/api/webhook/appointment` em parte dos `create`).

### Segurança outbound

1. Header `x-webhook-auth` = `WEBHOOK_AUTH_TOKEN`
2. Assinatura HMAC-SHA256 do body → `x-webhook-signature` (`WEBHOOK_SECRET`)

---

## Payload enviado ao N8N

O webhook recebe um **array** contendo um objeto por serviço agendado. Cada chamada envia **1 serviço** (se o cliente agendou 3 serviços, são 3 chamadas com 5s de intervalo entre cada).

```json
[
  {
    "headers": {},
    "params": {},
    "query": {},
    "body": {
      "type": "create",
      "name": "João da Silva",
      "email": "joao@email.com",
      "phone": "5511999998888",
      "token_called": "abc123-token-da-empresa",
      "reason": "",
      "oldDate": "",
      "oldTime": "",
      "newDate": "",
      "newTime": "",
      "appointments": [
        {
          "date": "2026-02-20",
          "time": "14:00",
          "services": [
            {
              "id": "clx1abc...",
              "name": "Corte Masculino",
              "price": 5000,
              "duration": 30,
              "employee": {
                "id": "clx2def...",
                "name": "Carlos"
              }
            }
          ]
        }
      ]
    },
    "webhookUrl": "",
    "executionMode": "production"
  }
]
```

---

## Campos do `body`

Todos os campos são **sempre enviados** em todos os tipos de evento. Campos sem informação vão como string vazia `""`.

| Campo | Tipo | Descrição | Preenchido em |
|---|---|---|---|
| `type` | `'create' \| 'cancel' \| 'reschedule' \| 'edit'` | Tipo do evento | Sempre |
| `name` | `string` | Nome do cliente | Sempre |
| `email` | `string` | Email do cliente | Sempre |
| `phone` | `string` | Telefone formatado (ex: `5511999998888`) | Sempre |
| `token_called` | `string \| null` | Token da empresa (identifica a empresa no n8n) | Sempre |
| `reason` | `string` | Motivo da ação — cancelamento, reagendamento ou edição (`""` se não aplicável) | `cancel`, `reschedule`, `edit` |
| `oldDate` | `string` | Data original antes da alteração — YYYY-MM-DD ou `""` | `reschedule`, `edit` |
| `oldTime` | `string` | Horário original antes da alteração — HH:mm ou `""` | `reschedule`, `edit` |
| `newDate` | `string` | Nova data após a alteração — YYYY-MM-DD ou `""` | `reschedule`, `edit` |
| `newTime` | `string` | Novo horário após a alteração — HH:mm ou `""` | `reschedule`, `edit` |

---

## Campos de `appointments[0]`

| Campo | Tipo | Descrição |
|---|---|---|
| `date` | `string` (YYYY-MM-DD) | Data do agendamento |
| `time` | `string` (HH:mm) | Horário do agendamento |

---

## Campos de `appointments[0].services[0]`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | ID do serviço |
| `name` | `string` | Nome do serviço (ex: "Corte Masculino") |
| `price` | `number` | Preço em centavos (5000 = R$50,00) |
| `duration` | `number` | Duração em minutos |
| `employee.id` | `string` | ID do funcionário |
| `employee.name` | `string` | Nome do funcionário |

---

## Tipos de evento (`type`)

| type | Quando | Campos preenchidos | Exemplo de uso | Status |
|---|---|---|---|:---:|
| `create` | Novo agendamento criado | Todos os base (demais `""`) | Confirmação WhatsApp/Email | Implementado |
| `cancel` | Agendamento cancelado (F-02) | `reason` (demais `""`) | Aviso de cancelamento | Implementado |
| `reschedule` | Agendamento reagendado (F-02) | `reason`, `oldDate`, `oldTime`, `newDate`, `newTime` (demais `""`) | Aviso de novo horário | Implementado |
| `edit` | Agendamento editado (F-02) | `reason`, `oldDate`, `oldTime`, `newDate`, `newTime` (demais `""`) | Aviso de alteração | Implementado |

---

## Exemplos de payload por tipo

### Criar agendamento (`type: 'create'`)

```json
{
  "type": "create",
  "name": "Maria Souza",
  "email": "maria@email.com",
  "phone": "5511988887777",
  "token_called": "empresa-token-123",
  "reason": "",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "appointments": [
    {
      "date": "2026-02-20",
      "time": "10:00",
      "services": [
        {
          "id": "svc_001",
          "name": "Escova Progressiva",
          "price": 15000,
          "duration": 120,
          "employee": {
            "id": "emp_001",
            "name": "Ana"
          }
        }
      ]
    }
  ]
}
```

### Cancelar agendamento (`type: 'cancel'`)

```json
{
  "type": "cancel",
  "name": "Maria Souza",
  "email": "maria@email.com",
  "phone": "5511988887777",
  "token_called": "empresa-token-123",
  "reason": "Profissional indisponível",
  "oldDate": "",
  "oldTime": "",
  "newDate": "",
  "newTime": "",
  "appointments": [
    {
      "date": "2026-02-20",
      "time": "10:00",
      "services": [
        {
          "id": "svc_001",
          "name": "Escova Progressiva",
          "price": 15000,
          "duration": 120,
          "employee": {
            "id": "emp_001",
            "name": "Ana"
          }
        }
      ]
    }
  ]
}
```

### Reagendar agendamento (`type: 'reschedule'`)

```json
{
  "type": "reschedule",
  "name": "Maria Souza",
  "email": "maria@email.com",
  "phone": "5511988887777",
  "token_called": "empresa-token-123",
  "reason": "Cliente solicitou novo horário",
  "oldDate": "2026-02-20",
  "oldTime": "10:00",
  "newDate": "2026-02-22",
  "newTime": "14:00",
  "appointments": [
    {
      "date": "2026-02-22",
      "time": "14:00",
      "services": [
        {
          "id": "svc_001",
          "name": "Escova Progressiva",
          "price": 15000,
          "duration": 120,
          "employee": {
            "id": "emp_001",
            "name": "Ana"
          }
        }
      ]
    }
  ]
}
```

### Editar agendamento (`type: 'edit'`)

```json
{
  "type": "edit",
  "name": "Maria Souza",
  "email": "maria@email.com",
  "phone": "5511988887777",
  "token_called": "empresa-token-123",
  "reason": "Troca de profissional solicitada pelo cliente",
  "oldDate": "2026-02-20",
  "oldTime": "10:00",
  "newDate": "2026-02-20",
  "newTime": "11:00",
  "appointments": [
    {
      "date": "2026-02-20",
      "time": "11:00",
      "services": [
        {
          "id": "svc_002",
          "name": "Corte Feminino",
          "price": 8000,
          "duration": 45,
          "employee": {
            "id": "emp_002",
            "name": "Carlos"
          }
        }
      ]
    }
  ]
}
```

---

## O que NAO é enviado

- ID do agendamento no banco (`appointmentId`)
- ID do usuário/empresa (`userId`)
- Dados internos (timestamps do banco, `createdAt`, `updatedAt`)
- Status do agendamento (`AppointmentStatus`)
- Histórico de alterações (`AppointmentHistory`)

---

## Validação do payload (referência de schema)

Contrato tipado legado (Zod). No Django, espelhar os mesmos campos/tipos em serializers ou pydantic/dataclasses.

Arquivo: `app/api/webhook/appointment/route.ts`

```typescript
const webhookPayloadSchema = z.array(
  z.object({
    headers: z.record(z.string(), z.unknown()).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    query: z.record(z.string(), z.unknown()).optional(),
    body: z.object({
      type: z.enum(['create', 'cancel', 'reschedule', 'edit']).default('create'),
      name: z.string().min(1).max(255),
      email: z.string().email(),
      phone: z.string().min(1).max(30),
      token_called: z.string().nullable(),
    reason: z.string().max(500),
      oldDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
      oldTime: z.string().regex(/^(([0-1]\d|2[0-3]):[0-5]\d)?$/),
      newDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
      newTime: z.string().regex(/^(([0-1]\d|2[0-3]):[0-5]\d)?$/),
      appointments: z.array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          time: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/),
          services: z.array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              price: z.number(),
              duration: z.number(),
              employee: z.object({
                id: z.string().min(1),
                name: z.string().min(1),
              }),
            }),
          ),
        }),
      ),
    }),
    webhookUrl: z.string().optional(),
    executionMode: z.string().optional(),
  }),
)
```

---

## Headers enviados ao N8N

| Header | Valor | Quando | Finalidade |
|---|---|---|---|
| `Content-Type` | `application/json` | Sempre | Tipo do payload |
| `x-webhook-auth` | `WEBHOOK_AUTH_TOKEN` | Quando configurado | Identifica origem |
| `x-webhook-signature` | HMAC-SHA256 do body | Quando `WEBHOOK_SECRET` configurado | Integridade |

### Configuração no N8N

```
Header: x-webhook-auth
Valor esperado: (mesmo valor do WEBHOOK_AUTH_TOKEN no .env)
```

Se ausente ou diferente, rejeitar. Env vars: [10-configuracoes.md](./10-configuracoes.md).
