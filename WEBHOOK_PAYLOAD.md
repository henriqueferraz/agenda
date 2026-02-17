# Webhook — Payload de Agendamento (N8N → WhatsApp/Email)

> **Atualizado:** 17/02/2026 | **Rota:** `POST /api/webhook/appointment`
> **Origem:** Painel do profissional + Agendamento público

---

## Fluxo

```
Cliente/Profissional → Next.js (API Route) → N8N (webhook) → WhatsApp / Email
```

### Camadas de segurança

1. **Autenticação JWT** via cookie (painel) — agendamento público usa mesma rota
2. **Anti-replay:** header `x-webhook-timestamp` (5 min) + `x-webhook-nonce` (único)
3. **Token de identificação:** header `x-webhook-auth` com `WEBHOOK_AUTH_TOKEN` — permite ao N8N verificar que a requisição veio do sistema de agendamento
4. **Assinatura HMAC-SHA256** no envio ao N8N (header `x-webhook-signature`) — verifica integridade do payload

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

| Campo | Tipo | Descrição | Quando presente |
|---|---|---|---|
| `type` | `'create' \| 'cancel' \| 'reschedule' \| 'edit'` | Tipo do evento | Sempre (default: `'create'`) |
| `name` | `string` | Nome do cliente | Sempre |
| `email` | `string` | Email do cliente | Sempre |
| `phone` | `string` | Telefone formatado (ex: `5511999998888`) | Sempre |
| `token_called` | `string \| null` | Token da empresa (identifica a empresa no n8n) | Sempre |
| `cancelReason` | `string` | Motivo do cancelamento | Apenas em `type: 'cancel'` |
| `changeReason` | `string` | Motivo da alteração informado pelo profissional | Em `type: 'reschedule'` e `type: 'edit'` |
| `oldDate` | `string` (YYYY-MM-DD) | Data original antes da alteração | Em `type: 'reschedule'` e `type: 'edit'` |
| `oldTime` | `string` (HH:mm) | Horário original antes da alteração | Em `type: 'reschedule'` e `type: 'edit'` |
| `newDate` | `string` (YYYY-MM-DD) | Nova data do agendamento após a alteração | Em `type: 'reschedule'` e `type: 'edit'` |
| `newTime` | `string` (HH:mm) | Novo horário do agendamento após a alteração | Em `type: 'reschedule'` e `type: 'edit'` |

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

| type | Quando | Campos extras | Exemplo de uso | Status |
|---|---|---|---|:---:|
| `create` | Novo agendamento criado | — | Confirmação WhatsApp/Email | Implementado |
| `cancel` | Agendamento cancelado (F-02) | `cancelReason` | Aviso de cancelamento | Implementado |
| `reschedule` | Agendamento reagendado (F-02) | `changeReason`, `oldDate`, `oldTime`, `newDate`, `newTime` | Aviso de novo horário com motivo | Implementado |
| `edit` | Agendamento editado (F-02) | `changeReason`, `oldDate`, `oldTime`, `newDate`, `newTime` | Aviso de alteração com motivo | Implementado |

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
  "cancelReason": "Profissional indisponível",
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
  "changeReason": "Cliente solicitou novo horário",
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
  "changeReason": "Troca de profissional solicitada pelo cliente",
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

## Validação do payload (Zod schema)

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
      cancelReason: z.string().max(500).optional(),
      changeReason: z.string().max(500).optional(),
      oldDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      oldTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/).optional(),
      newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      newTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/).optional(),
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

## Arquivos relacionados

| Arquivo | Descrição |
|---|---|
| `app/api/webhook/appointment/route.ts` | API route — proxy autenticado para o N8N (usado por `create`) |
| `lib/webhook-notify.ts` | Utilitário server-side — envia notificações diretamente ao N8N (usado por `cancel`, `reschedule`, `edit`) |
| `app/(panel)/dashboard/schedule/calendar/_components/appointment-modal.tsx` | Modal do painel — monta e envia payload `create` |
| `app/(public)/agendamento/[token]/_components/public-appointment-modal.tsx` | Modal público — monta e envia payload `create` |
| `app/(panel)/dashboard/schedule/calendar/_actions/cancel-appointment.ts` | Server action — cancela e notifica via `webhook-notify` |
| `app/(panel)/dashboard/schedule/calendar/_actions/reschedule-appointment.ts` | Server action — reagenda e notifica via `webhook-notify` |
| `app/(panel)/dashboard/schedule/calendar/_actions/update-appointment.ts` | Server action — edita e notifica via `webhook-notify` |
| `app/(panel)/dashboard/schedule/calendar/_components/_data-access/get-user-token-for-webhook.ts` | Busca `token_called` do usuário (usado por `create`) |
| `lib/webhook-hmac.ts` | Assinatura HMAC-SHA256 |
| `lib/webhook-nonce.ts` | Validação anti-replay (timestamp + nonce, apenas `create`) |

---

## Headers enviados ao N8N

| Header | Valor | Quando | Finalidade |
|---|---|---|---|
| `Content-Type` | `application/json` | Sempre | Tipo do payload |
| `x-webhook-auth` | `WEBHOOK_AUTH_TOKEN` (.env) | Quando configurado | Identifica que a requisição veio do sistema de agendamento |
| `x-webhook-signature` | HMAC-SHA256 do body | Quando `WEBHOOK_SECRET` configurado | Verifica integridade do payload |

### Configuração no N8N

No workflow do N8N, adicione uma condição no nó de entrada (webhook) para verificar o header:

```
Header: x-webhook-auth
Valor esperado: (mesmo valor do WEBHOOK_AUTH_TOKEN no .env)
```

Se o header não estiver presente ou o valor não corresponder, o N8N deve rejeitar a requisição.

---

## Variáveis de ambiente necessárias

Adicionar no `.env.local`:

```env
# URL do webhook N8N (obrigatório para enviar notificações)
BASE_N8N="https://seu-n8n.com/webhook/appointments"

# Token de autenticação — enviado como header x-webhook-auth
# O N8N verifica este valor para confirmar a origem da requisição
# Gerar com: openssl rand -hex 32
WEBHOOK_AUTH_TOKEN="335a70da16de811d2fc18ff9f5572ce8702c20a391a47a4248276de905b7768a"

# Chave HMAC-SHA256 — assina o body do payload (header x-webhook-signature)
# Permite ao N8N verificar que o conteúdo não foi adulterado
# Gerar com: openssl rand -hex 32
WEBHOOK_SECRET="sua-chave-hmac-hex-de-64-caracteres"
```

| Variável | Obrigatória | Descrição |
|---|:---:|---|
| `BASE_N8N` | Sim | URL do webhook N8N para onde os payloads são enviados |
| `WEBHOOK_AUTH_TOKEN` | Recomendado | Token de identificação da origem (header `x-webhook-auth`) |
| `WEBHOOK_SECRET` | Recomendado | Chave para assinatura HMAC-SHA256 (header `x-webhook-signature`) |
