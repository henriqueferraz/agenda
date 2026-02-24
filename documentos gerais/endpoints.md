# 📋 API e Server Actions - Agenda System

**Última atualização**: 24/02/2026  
**Versão**: 0.9.0 (beta)

## 🔗 Visão Geral

Este documento contém todas as operações disponíveis no sistema Agenda, incluindo Server Actions, funções utilitárias, estruturas de dados e exemplos de uso.

## 🏗️ Arquitetura da API

### Abordagem Atual
- **Server Actions**: Next.js Server Actions (não REST tradicional)
- **Autenticação**: JWT + cookies httpOnly
- **Validação**: Zod schemas para type safety
- **Database**: Prisma ORM com PostgreSQL
- **Formatação**: Utilitários automáticos (CPF, CNPJ, telefone)

### Server Actions vs REST API
O projeto utiliza **Server Actions** do Next.js ao invés de uma API REST tradicional:
- ✅ **Server Components**: Chamadas diretas em componentes React
- ✅ **Type Safety**: TypeScript end-to-end
- ✅ **Autenticação**: Tokens JWT via cookies
- ✅ **Performance**: Sem overhead de HTTP
- 🔄 **Planejado**: Endpoints REST para integrações futuras

---

## 🔐 1. Autenticação - JWT + Bcrypt

### 1.1 POST /api/auth/register
**Descrição**: Registro com nome, email e senha + envio de OTP, com rate limiting por IP.

### 1.2 POST /api/auth/verify-otp
**Descrição**: Verifica o código enviado por email, com rate limiting por IP.

### 1.3 POST /api/auth/resend-otp
**Descrição**: Reenvia OTP com cooldown e resposta genérica para reduzir enumeração de contas.

### 1.4 POST /api/auth/login
**Descrição**: Login com email/senha. Gera access + refresh token em cookies httpOnly.

### 1.5 POST /api/auth/refresh
**Descrição**: Rotaciona refresh token e emite novo access token, com rate limiting por IP.

### 1.6 POST /api/auth/logout
**Descrição**: Revoga refresh token e limpa cookies, com rate limiting por IP.

### 1.7 POST /api/auth/forgot-password
**Descrição**: Envia link de redefinição de senha por email (resposta genérica) com rate limiting por IP.

### 1.8 POST /api/auth/reset-password
**Descrição**: Redefine a senha usando token válido, com rate limiting por IP.

### 1.9 POST /api/auth/change-password
**Descrição**: Altera senha com autenticação ativa.

### 1.10 GET /api/auth/me
**Descrição**: Retorna o usuário autenticado.

---

## 📬 1.11 Contato - Formulário Público

### 1.11 POST /api/contact
**Descrição**: Recebe mensagens do formulário de contato da página inicial e envia email para o responsável com cópia.

**Payload**:
```json
{
  "name": "Seu nome",
  "email": "seu@email.com",
  "message": "Sua mensagem"
}
```

**Respostas**:
- **200**: Mensagem enviada com sucesso
- **400**: Dados inválidos
- **500**: Erro interno ao enviar mensagem

---

## 🖼️ 1.12 Upload de Logo da Empresa

### 1.12.1 POST /api/upload/logo

**Descrição**: Faz upload do logo da empresa. Aceita PNG e JPG com tamanho máximo de 1 MB. Salva em `public/uploads/logos/` com nome único e atualiza `user.logo`.

**Autenticação**: Obrigatória (JWT)

**Content-Type**: `multipart/form-data`

**Payload**: FormData com campo `file` (arquivo PNG ou JPG)

**Validações**:
- Tipo MIME: `image/png` ou `image/jpeg`
- Tamanho máximo: 1 MB (1.048.576 bytes)
- Extensão: `.png`, `.jpg`, `.jpeg`
- Remove logo anterior automaticamente se existir

**Resposta de Sucesso (200)**:
```json
{
  "url": "/uploads/logos/usr_abc123-uuid.png"
}
```

**Respostas de Erro**:
- **400**: Nenhum arquivo enviado / Formato inválido / Arquivo muito grande
- **401**: Usuário não autenticado
- **500**: Erro interno

### 1.12.2 DELETE /api/upload/logo

**Descrição**: Remove o logo da empresa do filesystem e limpa `user.logo` no banco.

**Autenticação**: Obrigatória (JWT)

**Resposta de Sucesso (200)**:
```json
{
  "data": "Logo removido com sucesso."
}
```

**Respostas de Erro**:
- **401**: Usuário não autenticado
- **404**: Nenhum logo para remover
- **500**: Erro interno

---

## 👤 2. Usuários - Server Actions

**Arquitetura**: As operações são realizadas via **Server Actions** do Next.js, garantindo type safety, validação automática e execução no servidor sem overhead de HTTP.

**Características**:
- ✅ **Type Safe**: TypeScript end-to-end
- ✅ **Validação**: Zod schemas integrados
- ✅ **Autenticação**: Sessões automáticas
- ✅ **Database**: Prisma ORM direto
- ✅ **Revalidação**: Cache automático

### 2.1 Atualizar Modelo do Usuário (Pessoa Física/Jurídica)

**Ação**: `updateModel`

**Localização**: `app/(panel)/dashboard/configurations/model/_actions/update-model.ts`

#### Parâmetros (Pessoa Física)
```typescript
{
  trade_name?: string; // Nome fantasia (opcional, max 100 chars)
  name: string;        // Nome completo (obrigatório)
  cpf?: string;        // CPF formatado (opcional)
  phone: string;       // Telefone formatado (obrigatório)
}
```

#### Parâmetros (Pessoa Jurídica)
```typescript
{
  trade_name?: string; // Nome fantasia (opcional, max 100 chars)
  name: string;        // Nome da empresa (obrigatório)
  cnpj?: string;       // CNPJ formatado (opcional)
  phone: string;       // Telefone formatado (obrigatório)
}
```

#### Exemplo - Pessoa Física
```typescript
const result = await updateModel({
  trade_name: "Barbearia do João",
  name: "João Silva",
  cpf: "123.456.789-00",
  phone: "(11) 99999-9999"
});
```

#### Resposta de Sucesso
```typescript
{
  data: "Dados atualizados com sucesso."
}
```

#### Resposta de Erro
```typescript
{
  error: "CPF inválido. Informe um CPF válido ou deixe em branco."
}
```

### 2.2 Atualizar Atividade Profissional

**Ação**: `updateActivity`

**Localização**: `app/(panel)/dashboard/configurations/activity/_actions/update-activity.ts`

#### Funcionalidades
- ✅ **Validação obrigatória**: Campo não pode ser vazio
- ✅ **Lista permitida**: Apenas 5 atividades autorizadas
- ✅ **Server-side validation**: Validação robusta no backend
- ✅ **Revalidação de cache**: Cache Next.js atualizado automaticamente
- ✅ **Logging detalhado**: Auditoria completa das operações

#### Parâmetros
```typescript
{
  activity: string;  // Valores permitidos: "Barbearia" | "Cabelereiro" | "Manicure" | "Maquiagem" | "Petshop"
}
```

#### Validações Implementadas
```typescript
// Schema Zod com validações
const formSchema = z.object({
  activity: z.string()
    .min(1, "A atividade é obrigatória.")
    .max(50, "Atividade muito longa.")
    .refine((value) => {
      const allowed = ["Barbearia", "Cabelereiro", "Manicure", "Maquiagem", "Petshop"];
      return allowed.includes(value);
    }, "Atividade inválida.")
});
```

#### Exemplo Completo
```typescript
// Em componente React
import { updateActivity } from "@/app/(panel)/dashboard/configurations/activity/_actions/update-activity";
import { toast } from "sonner";

async function handleUpdateActivity(activity: string) {
  try {
    const result = await updateActivity({ activity });

    if (result.error) {
      toast.error(result.error);
      console.error("Erro na atualização:", result.error);
    } else {
      toast.success(result.data);
      // Redirecionar ou atualizar UI
    }
  } catch (error) {
    toast.error("Erro interno do servidor");
    console.error("Erro inesperado:", error);
  }
}

// Uso
await handleUpdateActivity("Barbearia");
```

#### Resposta de Sucesso
```typescript
{
  data: "Atividade atualizada com sucesso."
}
```

#### Respostas de Erro
```typescript
// Campo vazio
{ error: "A atividade é obrigatória." }

// Atividade não permitida
{ error: "Atividade inválida." }

// Campo muito longo
{ error: "Atividade muito longa." }

// Usuário não autenticado
{ error: "Usuário não autenticado. Faça login novamente." }
```

### 2.3 Atualizar Endereço Comercial

**Ação**: `updateAddress`

**Localização**: `app/(panel)/dashboard/configurations/address/_actions/update-address.ts`

#### Funcionalidades
- ✅ **Busca automática por CEP**: Integração ViaCEP + BrasilAPI
- ✅ **Validação completa**: CEP, endereço, UF brasileira válida
- ✅ **Persistência dual**: Tabela Address + referência no User
- ✅ **Upsert automático**: Create ou Update baseado na existência
- ✅ **Transações atômicas**: ACID compliance
- ✅ **Revalidação de cache**: Next.js cache purging
- ✅ **Logging detalhado**: Auditoria completa das operações

#### Parâmetros
```typescript
{
  zip_code: string;       // CEP no formato 00000-000
  street: string;         // Logradouro (rua, avenida)
  number: string;         // Número do endereço
  complement?: string;    // Complemento (opcional)
  neighborhood: string;   // Bairro
  city: string;           // Cidade
  state: string;          // UF (SP, RJ, MG, etc.)
  country: string;        // País
}
```

#### Validações Implementadas
```typescript
const formSchema = z.object({
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato 00000-000"),
  street: z.string().min(3, "Logradouro mínimo 3 caracteres").max(100),
  number: z.string().min(1, "Número obrigatório").max(20),
  complement: z.string().max(50).optional(),
  neighborhood: z.string().min(2).max(50),
  city: z.string().min(2).max(50),
  state: z.string().length(2).regex(/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/i),
  country: z.string().min(2).max(50)
});
```

#### Exemplo Completo
```typescript
// Em componente React
import { updateAddress } from "@/app/(panel)/dashboard/configurations/address/_actions/update-address";
import { toast } from "sonner";

async function handleUpdateAddress(addressData: FormAddressData) {
  try {
    const result = await updateAddress(addressData);

    if (result.error) {
      toast.error(result.error);
      console.error("Erro no endereço:", result.error);
    } else {
      toast.success(result.data);
      // Redirecionar ou atualizar UI
    }
  } catch (error) {
    toast.error("Erro interno do servidor");
    console.error("Erro inesperado:", error);
  }
}

// Uso
await handleUpdateAddress({
  zip_code: "12345-678",
  street: "Rua das Flores",
  number: "123",
  complement: "Apto 45",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  country: "Brasil"
});
```

#### Resposta de Sucesso
```typescript
{
  data: "Endereço atualizado com sucesso."
}
```

#### Respostas de Erro
```typescript
// CEP inválido
{ error: "CEP deve estar no formato 00000-000." }

// Estado inválido
{ error: "Estado deve ser uma UF válida (ex: SP, RJ, MG)." }

// Campo obrigatório vazio
{ error: "Logradouro deve ter pelo menos 3 caracteres." }

// Usuário não autenticado
{ error: "Usuário não autenticado." }

// Erro interno
{ error: "Erro ao atualizar o endereço." }
```

---

### 2.4 Atualizar Horários de Funcionamento

**Ação**: `updateTimes`

**Localização**: `app/(panel)/dashboard/configurations/time/_actions/update-times.ts`

#### Funcionalidades
- ✅ **Horários por dia**: Configuração independente para cada dia da semana
- ✅ **Validação de formato**: Horários no padrão HH:MM obrigatório
- ✅ **Limpeza automática**: Ordenação e remoção de duplicatas
- ✅ **Flexibilidade**: Dias podem ficar fechados (arrays vazios)
- ✅ **Transações atômicas**: ACID compliance
- ✅ **Revalidação de cache**: Next.js cache purging
- ✅ **Logging detalhado**: Auditoria completa das operações

#### Parâmetros
```typescript
{
  mon_times: string[];  // Segunda-feira: ["08:00", "09:00", "10:00"]
  tue_times: string[];  // Terça-feira: ["08:00", "09:00"]
  wed_times: string[];  // Quarta-feira: [] (fechado)
  thu_times: string[];  // Quinta-feira: ["14:00", "15:00"]
  fri_times: string[];  // Sexta-feira: ["08:00", "09:00"]
  sat_times: string[];  // Sábado: ["10:00"]
  sun_times: string[];  // Domingo: [] (fechado)
}
```

#### Validações Implementadas
```typescript
const formSchema = z.object({
  mon_times: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido")).optional(),
  tue_times: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido")).optional(),
  // ... validação para todos os dias
});
```

#### Processamento dos Dados
```typescript
// Limpeza e ordenação automática
function cleanTimes(times: string[]): string[] {
  if (!times || times.length === 0) return [];

  // Remove duplicatas
  const uniqueTimes = Array.from(new Set(times));

  // Ordena cronologicamente
  return uniqueTimes.sort((a, b) => {
    const [aHours, aMinutes] = a.split(":").map(Number);
    const [bHours, bMinutes] = b.split(":").map(Number);

    if (aHours !== bHours) return aHours - bHours;
    return aMinutes - bMinutes;
  });
}
```

#### Exemplo Completo
```typescript
// Em componente React
import { updateTimes } from "@/app/(panel)/dashboard/configurations/time/_actions/update-times";
import { toast } from "sonner";

async function handleUpdateTimes(timesData) {
  try {
    const result = await updateTimes({
      mon_times: ["08:00", "09:00", "10:00", "14:00", "15:00"],
      tue_times: ["08:00", "09:00"],
      wed_times: [], // fechado
      thu_times: ["14:00", "15:00"],
      fri_times: ["08:00", "09:00"],
      sat_times: ["10:00"],
      sun_times: [] // fechado
    });

    if (result.error) {
      toast.error(result.error);
      console.error("Erro nos horários:", result.error);
    } else {
      toast.success(result.data);
      // Redirecionar ou atualizar UI
    }
  } catch (error) {
    toast.error("Erro interno do servidor");
    console.error("Erro inesperado:", error);
  }
}
```

#### Resposta de Sucesso
```typescript
{
  data: "Horários atualizados com sucesso."
}
```

#### Respostas de Erro
```typescript
// Horário inválido
{ error: "Horário deve estar no formato HH:MM" }

// Usuário não autenticado
{ error: "Usuário não autenticado." }

// Erro interno
{ error: "Erro interno do servidor. Tente novamente." }
```

#### Campos no Banco de Dados
```sql
-- Tabela User - Campos de horário
mon_times: String[]  -- ARRAY['08:00', '09:00', '10:00']
tue_times: String[]  -- ARRAY['08:00', '09:00']
wed_times: String[]  -- ARRAY[]::text[] (fechado)
thu_times: String[]  -- ARRAY['14:00', '15:00']
fri_times: String[]  -- ARRAY['08:00', '09:00']
sat_times: String[]  -- ARRAY['10:00']
sun_times: String[]  -- ARRAY[]::text[] (fechado)
```

---

## 📅 3. Agendamentos - Server Actions

### 3.1 Criar Agendamento

**Ação**: `createAppointment`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_actions/create-appointment.ts`

#### Funcionalidades
- ✅ **Múltiplos serviços**: Permite criar vários agendamentos de uma vez
- ✅ **Validação completa**: Data, horário, serviço, funcionário
- ✅ **Verificação de conflitos**: Funcionário não pode ter dois agendamentos no mesmo horário
- ✅ **Verificação de feriados**: Impede agendamentos em dias de feriado
- ✅ **Timezone**: Todas as datas no timezone America/Sao_Paulo
- ✅ **Webhook**: Envio automático para N8N após confirmação (uma mensagem por serviço, intervalo de 5s)
- ✅ **Revalidação de cache**: Next.js cache purging

#### Parâmetros
```typescript
{
  name: string;              // Nome do cliente (2-100 caracteres)
  email: string;             // Email do cliente (formato válido, máximo 255 caracteres)
  phone: string;             // Telefone (10-15 caracteres)
  appointmentDate: Date;     // Data do agendamento
  time: string;              // Horário (HH:MM)
  userId: string;            // ID do usuário (empresa)
  serviceId: string;         // ID do serviço
  employeeId: string;        // ID do funcionário
}
```

#### Validações Implementadas
```typescript
const createAppointmentSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(10).max(15),
  appointmentDate: z.date(),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  userId: z.string().min(1),
  serviceId: z.string().min(1),
  employeeId: z.string().min(1)
});
```

#### Regras de Negócio
- **Data passada**: Não permite agendamentos em datas/horários passados
- **Feriados**: Não permite agendamentos em dias de feriado
- **Conflitos**: Funcionário não pode ter dois agendamentos no mesmo horário
- **Disponibilidade**: Serviço e funcionário devem estar ativos
- **Capacidade**: Funcionário deve poder realizar o serviço solicitado

#### Exemplo Completo
```typescript
import { createAppointment } from "@/app/(panel)/dashboard/schedule/calendar/_actions/create-appointment";

const result = await createAppointment({
  name: "João Silva",
  email: "joao@example.com",
  phone: "(11) 99999-9999",
  appointmentDate: new Date("2024-01-15"),
  time: "14:00",
  userId: "usr_123",
  serviceId: "srv_456",
  employeeId: "emp_789"
});

if (result.success) {
  console.log("Agendamento criado:", result.data);
} else {
  console.error("Erro:", result.error);
}
```

#### Resposta de Sucesso
```typescript
{
  success: true,
  message: "Agendamento criado com sucesso!",
  data: { ... } // Dados do agendamento criado
}
```

#### Respostas de Erro
```typescript
// Não autenticado
{ success: false, error: "Não autenticado. Faça login para continuar." }

// Dados inválidos
{ success: false, error: "Dados inválidos: Nome deve ter pelo menos 2 caracteres" }

// Serviço não encontrado
{ success: false, error: "Serviço não encontrado ou inativo." }

// Conflito de horário
{ success: false, error: "Funcionário já possui agendamento neste horário." }

// Feriado
{ success: false, error: "Não é possível agendar em dias de feriado." }
```

### 3.2 Criar Agendamento Público

**Ação**: `createPublicAppointment`

**Localização**: `app/(public)/agendamento/[token]/_actions/create-public-appointment.ts`

#### Funcionalidades
- ✅ **Acesso sem autenticação**: Agendamento via página pública com token da empresa
- ✅ **Validação de token**: Verifica se o token existe e corresponde a uma empresa ativa
- ✅ **Validação de propriedade**: Serviço e funcionário devem pertencer à empresa do token
- ✅ **Validação de disponibilidade**: Serviço ativo, funcionário ativo e habilitado para o serviço
- ✅ **Validação de data/hora**: Impede agendamento em data/hora passada ou feriado
- ✅ **Detecção de conflitos**: Verifica sobreposição de horários com agendamentos existentes
- ✅ **Revalidação de cache**: Purge automático da página pública após criação

#### Interface de Entrada
```typescript
interface CreatePublicAppointmentData {
  name: string;          // Nome do cliente (2-100 caracteres)
  email: string;         // Email do cliente
  phone: string;         // Telefone (10-15 caracteres)
  appointmentDate: Date; // Data do agendamento
  time: string;          // Horário (HH:MM)
  token: string;         // Token único da empresa
  serviceId: string;     // ID do serviço
  employeeId: string;    // ID do funcionário
}
```

#### Exemplo de Uso
```typescript
import { createPublicAppointment } from '@/app/(public)/agendamento/[token]/_actions/create-public-appointment'

const result = await createPublicAppointment({
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '47999999999',
  appointmentDate: new Date(),
  time: '10:00',
  token: 'joao-abc123',
  serviceId: 'svc_123',
  employeeId: 'emp_123',
})
```

#### Respostas
```typescript
// Sucesso
{ success: true, data: { id, name, email, phone, appointmentDate, time, service, employee } }

// Erros possíveis
{ success: false, error: "Token inválido. Empresa não encontrada." }
{ success: false, error: "Serviço não encontrado ou inativo." }
{ success: false, error: "Funcionário não encontrado ou inativo." }
{ success: false, error: "Este funcionário não realiza este serviço." }
{ success: false, error: "Não é possível agendar em data/hora passada." }
{ success: false, error: "Não é possível agendar neste dia. Motivo: ..." }
{ success: false, error: "Este horário já está ocupado. Por favor, escolha outro horário." }
```

### 3.3 Cancelar Agendamento (F-02)

**Ação**: `cancelAppointment`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_actions/cancel-appointment.ts`

#### Funcionalidades
- ✅ **Autenticação**: JWT via getUserFromToken
- ✅ **Validação Zod**: appointmentId obrigatório, reason opcional (max 500 chars)
- ✅ **Core compartilhado**: Delega para cancelAppointmentCore
- ✅ **Histórico**: Registra cancelamento no AppointmentHistory
- ✅ **Revalidação de cache**: Next.js cache purging

#### Parâmetros
```typescript
{
  appointmentId: string;  // ID do agendamento (obrigatório)
  reason?: string;        // Motivo do cancelamento (max 500 chars, opcional)
}
```

#### Retorno
```typescript
{ success: true, message: "Agendamento cancelado com sucesso." }
{ success: false, error: "Agendamento não encontrado." }
{ success: false, error: "Este agendamento já foi cancelado." }
```

### 3.4 Reagendar Agendamento (F-02)

**Ação**: `rescheduleAppointment`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_actions/reschedule-appointment.ts`

#### Funcionalidades
- ✅ **Autenticação**: JWT via getUserFromToken
- ✅ **Validação Zod**: appointmentId, newDate, newTime (HH:MM)
- ✅ **Validação F-01**: Conflito de funcionário e cliente (exclui o próprio agendamento)
- ✅ **Validação de feriados**: Impede reagendamento em dias de feriado
- ✅ **Core compartilhado**: Delega para rescheduleAppointmentCore
- ✅ **Histórico**: Registra reagendamento no AppointmentHistory com data/hora anterior

#### Parâmetros
```typescript
{
  appointmentId: string;  // ID do agendamento (obrigatório)
  newDate: Date;          // Nova data
  newTime: string;        // Novo horário (HH:MM)
}
```

#### Retorno
```typescript
{ success: true, message: "Agendamento reagendado com sucesso." }
{ success: false, error: "Não é possível reagendar um agendamento cancelado." }
{ success: false, error: "Este funcionário já tem um agendamento neste horário." }
```

### 3.5 Editar Agendamento (F-02)

**Ação**: `updateAppointment`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_actions/update-appointment.ts`

#### Funcionalidades
- ✅ **Autenticação**: JWT via getUserFromToken
- ✅ **Validação Zod**: appointmentId obrigatório, campos opcionais
- ✅ **Validação F-01**: Conflito de funcionário e cliente quando data/hora/funcionário mudam
- ✅ **Validação de serviço**: Verifica existência e que pertence ao userId
- ✅ **Validação de funcionário**: Verifica existência, status ativo e vínculo com serviço
- ✅ **Core compartilhado**: Delega para updateAppointmentCore
- ✅ **Histórico**: Registra edição no AppointmentHistory com changes {from, to}

#### Parâmetros
```typescript
{
  appointmentId: string;      // ID do agendamento (obrigatório)
  serviceId?: string;         // Novo serviço (opcional)
  employeeId?: string;        // Novo funcionário (opcional)
  appointmentDate?: Date;     // Nova data (opcional)
  time?: string;              // Novo horário HH:MM (opcional)
}
```

#### Retorno
```typescript
{ success: true, message: "Agendamento atualizado com sucesso." }
{ success: false, error: "Nenhuma alteração detectada." }
{ success: false, error: "Serviço não encontrado ou inativo." }
{ success: false, error: "Este funcionário não realiza o serviço selecionado." }
```

---

## 🎉 4. Feriados - Server Actions

### 4.1 Criar Feriado

**Ação**: `createStopDay`

**Localização**: `app/(panel)/dashboard/schedule/stopday/_actions/create-stopday.ts`

#### Funcionalidades
- ✅ **Validação de data**: Data normalizada para início do dia
- ✅ **Verificação de duplicatas**: Não permite criar feriado para data que já possui feriado
- ✅ **Timezone**: Todas as datas no timezone America/Sao_Paulo
- ✅ **Revalidação de cache**: Next.js cache purging

#### Parâmetros
```typescript
{
  date: Date;           // Data do feriado
  motivation: string;    // Motivo do feriado (3-500 caracteres)
  userId: string;       // ID do usuário (empresa)
}
```

#### Exemplo
```typescript
import { createStopDay } from "@/app/(panel)/dashboard/schedule/stopday/_actions/create-stopday";

const result = await createStopDay({
  date: new Date("2024-01-15"),
  motivation: "Feriado Nacional",
  userId: "usr_123"
});
```

### 4.2 Atualizar Feriado

**Ação**: `updateStopDay`

**Localização**: `app/(panel)/dashboard/schedule/stopday/_actions/update-stopday.ts`

#### Parâmetros
```typescript
{
  id: string;           // ID do feriado
  date?: Date;          // Nova data (opcional)
  motivation?: string;  // Novo motivo (opcional, 3-500 caracteres)
  userId: string;      // ID do usuário (empresa)
}
```

### 4.3 Deletar Feriado

**Ação**: `deleteStopDay`

**Localização**: `app/(panel)/dashboard/schedule/stopday/_actions/delete-stopday.ts`

#### Parâmetros
```typescript
{
  id: string;      // ID do feriado
  userId: string;  // ID do usuário (empresa)
}
```

### 4.4 Consultas de Feriados

#### Buscar Feriado por Data
**Função**: `getStopDayByDate`

**Localização**: `app/(panel)/dashboard/schedule/stopday/_data-access/get-stopday-by-date.ts`

#### Buscar Todos os Feriados
**Função**: `getAllStopDays`

**Localização**: `app/(panel)/dashboard/schedule/stopday/_data-access/get-all-stopdays.ts`

#### Buscar Feriados do Mês
**Função**: `getMonthStopDays`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-month-stopdays.ts`

---

## 💼 5. Serviços - Server Actions

### 5.1 Criar Serviço

**Ação**: `createService`

**Localização**: `app/(panel)/dashboard/services/service/_actions/create-service.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: Nome, preço e duração validados
- ✅ **Autenticação**: Verifica sessão do usuário
- ✅ **Criação no banco**: Status ativo por padrão
- ✅ **Revalidação de cache**: `/dashboard/services/service`

#### Parâmetros
```typescript
{
  name: string;      // Nome do serviço (2-100 caracteres, alfanumérico)
  price: number;     // Preço em centavos (1-1000000, inteiro)
  duration: number;  // Duração em minutos (1-480, inteiro)
}
```

#### Retorno
```typescript
// Sucesso
{ success: true, data: Service, message?: string }

// Erro
{ success: false, error: string }
```

### 5.2 Atualizar Serviço

**Ação**: `updateService`

**Localização**: `app/(panel)/dashboard/services/service/_actions/update-service.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: Todos os campos validados
- ✅ **Verificação de propriedade**: Serviço deve pertencer ao usuário
- ✅ **Atualização atômica**: Prisma ORM
- ✅ **Revalidação de cache**: `/dashboard/services/service`

#### Parâmetros
```typescript
{
  id: string;        // ID do serviço (obrigatório)
  name: string;      // Nome do serviço (2-100 caracteres, alfanumérico)
  price: number;     // Preço em centavos (1-1000000, inteiro)
  duration: number;  // Duração em minutos (1-480, inteiro)
}
```

#### Retorno
```typescript
// Sucesso
{ success: true, data: Service, message?: string }

// Erro
{ success: false, error: string }
```

### 5.3 Deletar Serviço

**Ação**: `deleteService`

**Localização**: `app/(panel)/dashboard/services/service/_actions/delete-service.ts`

#### Funcionalidades
- ✅ **Validação manual**: ID obrigatório e não vazio
- ✅ **Verificação de propriedade**: Serviço deve pertencer ao usuário
- ✅ **Exclusão no banco**: Prisma ORM
- ✅ **Revalidação de cache**: `/dashboard/services/service`

#### Parâmetros
```typescript
serviceId: string  // ID do serviço a ser deletado
```

#### Retorno
```typescript
// Sucesso
{ success: true, message?: string }

// Erro
{ success: false, error: string }
```

---

## 👥 6. Funcionários - Server Actions

### 6.1 Criar Funcionário

**Ação**: `createEmployee`

**Localização**: `app/(panel)/dashboard/services/employee/_actions/create-employee.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: Nome, email, telefone, função e serviços
- ✅ **Email único**: Verifica conflito de email por empresa
- ✅ **Associação de serviços**: Relação many-to-many automática
- ✅ **Status ativo**: Padrão ao criar
- ✅ **Revalidação de cache**: `/dashboard/services/employee`

#### Parâmetros
```typescript
{
  name: string;         // Nome (2-100 caracteres)
  email: string;        // Email válido (max 255)
  phone: string;        // Telefone (10-15 caracteres)
  function: string;     // Função/cargo (2-100 caracteres)
  serviceIds?: string[]; // IDs dos serviços associados (opcional)
}
```

#### Retorno
```typescript
// Sucesso
{ success: true, data: Employee, message?: string }

// Erro
{ success: false, error: string }
```

### 6.2 Atualizar Funcionário

**Ação**: `updateEmployee`

**Localização**: `app/(panel)/dashboard/services/employee/_actions/update-employee.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: Todos os campos validados
- ✅ **Verificação de propriedade**: Funcionário deve pertencer ao usuário
- ✅ **Conflito de email**: Verifica unicidade excluindo o próprio
- ✅ **Recriação de vínculos**: Remove e recria relações com serviços
- ✅ **Revalidação de cache**: `/dashboard/services/employee`

#### Parâmetros
```typescript
{
  id: string;           // ID do funcionário (obrigatório)
  name: string;         // Nome (2-100 caracteres)
  email: string;        // Email válido (max 255)
  phone: string;        // Telefone (10-15 caracteres)
  function: string;     // Função/cargo (2-100 caracteres)
  serviceIds?: string[]; // IDs dos serviços associados
}
```

#### Retorno
```typescript
// Sucesso
{ success: true, data: Employee, message?: string }

// Erro
{ success: false, error: string }
```

### 6.3 Deletar Funcionário

**Ação**: `deleteEmployee`

**Localização**: `app/(panel)/dashboard/services/employee/_actions/delete-employee.ts`

#### Funcionalidades
- ✅ **Validação manual**: ID obrigatório e não vazio
- ✅ **Verificação de propriedade**: Funcionário deve pertencer ao usuário
- ✅ **Exclusão no banco**: Prisma ORM
- ✅ **Revalidação de cache**: `/dashboard/services/employee`

#### Parâmetros
```typescript
employeeId: string  // ID do funcionário a ser deletado
```

#### Retorno
```typescript
// Sucesso
{ success: true, message?: string }

// Erro
{ success: false, error: string }
```

### 6.4 Atualizar Horários do Funcionário

**Ação**: `updateEmployeeTimes`

**Localização**: `app/(panel)/dashboard/services/employee/_actions/update-employee-times.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: Horários no formato HH:MM por dia da semana
- ✅ **Remoção de duplicatas**: Horários duplicados são removidos automaticamente
- ✅ **Ordenação cronológica**: Horários são ordenados automaticamente
- ✅ **Verificação de propriedade**: Funcionário deve pertencer ao usuário
- ✅ **Revalidação de cache**: `/dashboard/services/employee`

#### Parâmetros
```typescript
{
  employeeId: string;     // ID do funcionário (obrigatório)
  mon_times?: string[];   // Horários segunda (HH:MM)
  tue_times?: string[];   // Horários terça (HH:MM)
  wed_times?: string[];   // Horários quarta (HH:MM)
  thu_times?: string[];   // Horários quinta (HH:MM)
  fri_times?: string[];   // Horários sexta (HH:MM)
  sat_times?: string[];   // Horários sábado (HH:MM)
  sun_times?: string[];   // Horários domingo (HH:MM)
}
```

#### Retorno
```typescript
// Sucesso
{ success: true, message?: string }

// Erro
{ success: false, error: string }
```

---

## 🔗 7. Webhooks - API Routes

### 7.1 Webhook de Agendamento (N8N)

**Rota**: `POST /api/webhook/appointment`

**Localização**: `app/api/webhook/appointment/route.ts`

#### Funcionalidades
- ✅ **Proxy server-side**: Evita problemas de CORS
- ✅ **Validação de configuração**: Verifica se URL do N8N está configurada
- ✅ **Logging detalhado**: Registra todas as operações
- ✅ **Tratamento de erros**: Respostas estruturadas
- ✅ **Múltiplas mensagens**: Envia uma mensagem por serviço agendado
- ✅ **Intervalo entre mensagens**: 5 segundos entre cada envio
- ✅ **Informações completas**: Data formatada, descrição, horário e colaborador

#### Comportamento
- **Uma mensagem por serviço**: Se o cliente criar 3 serviços, serão enviadas 3 mensagens separadas
- **Intervalo de 5 segundos**: Aguarda 5 segundos entre cada mensagem
- **Ordenação**: Mensagens ordenadas por data e depois por horário
- **Timezone correto**: Todas as datas no timezone America/Sao_Paulo

#### Estrutura do Payload
```typescript
Array<{
  headers: {};               // Headers HTTP (vazio)
  params: {};                 // Parâmetros (vazio)
  query: {};                  // Query params (vazio)
  body: {
    type: 'create' | 'cancel' | 'reschedule' | 'edit';  // Tipo da ação (F-02, default: 'create')
    name: string;             // Nome do cliente
    email: string;             // Email do cliente
    phone: string;             // Telefone formatado (ex: "(47) 98423-6676")
    token_called: string | null; // Token da empresa
    cancelReason?: string;    // Motivo do cancelamento (F-02, max 500 chars)
    oldDate?: string;         // Data anterior ao reagendamento (YYYY-MM-DD, F-02)
    oldTime?: string;         // Horário anterior ao reagendamento (HH:MM, F-02)
    appointments: Array<{     // Array com um agendamento por mensagem
      date: string;            // Data do agendamento (YYYY-MM-DD)
      time: string;            // Horário (HH:MM)
      services: Array<{       // Array com um serviço
        id: string;
        name: string;
        price: number;        // Preço em centavos
        duration: number;     // Duração em minutos
        employee: {
          id: string;
          name: string;       // Nome do colaborador
        };
      }>;
    }>;
  };
  webhookUrl: string;          // URL do webhook N8N
  executionMode: string;      // Modo de execução ("production")
}>
```

#### Exemplo de Fluxo
Se um cliente criar 3 serviços:
1. **Mensagem 1** (envio imediato): Primeiro serviço
2. **Aguarda 5 segundos**
3. **Mensagem 2**: Segundo serviço
4. **Aguarda 5 segundos**
5. **Mensagem 3**: Terceiro serviço

#### Exemplo de Payload
```json
[
  {
    "headers": {},
    "params": {},
    "query": {},
    "body": {
      "name": "Carlos Henrique Ferraz Cabral",
      "email": "henriqueferraz@ofnet.com.br",
      "phone": "(47) 98423-6676",
      "appointments": [
        {
          "date": "2026-01-14",
          "time": "10:30",
          "services": [
            {
              "id": "cmk06pisn0006o1ui4glxw89r",
              "name": "Pintura dos cabelos",
              "price": 4500,
              "duration": 60,
              "employee": {
                "id": "emp_1767557912357_ueybwopqm",
                "name": "Henrique Ferraz"
              }
            }
          ]
        }
      ]
    },
    "webhookUrl": "https://n8n.hferraz.com.br/webhook/agenda",
    "executionMode": "production"
  }
]
```

#### Variáveis de Ambiente
- **NEXT_PUBLIC_BASE_N8N**: URL base do webhook N8N (obrigatório)

#### Exemplo de Uso
```typescript
// O webhook é chamado automaticamente após criar agendamentos
// Uma mensagem é enviada por serviço com intervalo de 5 segundos

// Exemplo de payload enviado (uma mensagem por serviço):
const payload = [
  {
    headers: {},
    params: {},
    query: {},
    body: {
      name: "Carlos Henrique Ferraz Cabral",
      email: "henriqueferraz@ofnet.com.br",
      phone: "(47) 98423-6676",
      appointments: [
        {
          date: "2026-01-14",
          time: "10:30",
          services: [
            {
              id: "cmk06pisn0006o1ui4glxw89r",
              name: "Pintura dos cabelos",
              price: 4500,
              duration: 60,
              employee: {
                id: "emp_1767557912357_ueybwopqm",
                name: "Henrique Ferraz"
              }
            }
          ]
        }
      ]
    },
    webhookUrl: "https://n8n.hferraz.com.br/webhook/agenda",
    executionMode: "production"
  }
];

// Se houver 3 serviços, serão enviadas 3 mensagens:
// - Mensagem 1: Serviço 1 (envio imediato)
// - Aguarda 5 segundos
// - Mensagem 2: Serviço 2
// - Aguarda 5 segundos
// - Mensagem 3: Serviço 3
```

#### Resposta de Sucesso (200)
```json
{
  "success": true,
  "data": { ... }  // Resposta do N8N
}
```

#### Respostas de Erro
```json
// URL não configurada (500)
{
  "error": "Webhook URL não configurada"
}

// Erro no N8N (status do N8N)
{
  "error": "Webhook retornou status 500",
  "details": "..."
}
```

---

## 🔍 8. Consultas de Dados (Data Access)

### 8.1 Obter Informações do Usuário

**Função**: `getInfoUser`

**Localização**: `app/(panel)/dashboard/configurations/model/_data-access/get-info-user.ts`

#### Parâmetros
```typescript
{
  userId: string;  // ID do usuário (obrigatório)
}
```

#### Resposta de Sucesso
```typescript
{
  id: "usr_123456789",
  name: "João Silva",
  email: "usuario@exemplo.com",
  emailVerified: null,
  image: "https://...",
  activity: "Barbearia",
  cpf: "123.456.789-00",
  cnpj: null,
  address: "Rua das Flores, 123",
  phone: "(11) 99999-9999",
  status: true,
  stripe_customer_id: "cus_123456789",
  times: ["09:00", "10:00", "11:00"],
  subscription: {
    id: "sub_123456789",
    status: "active",
    plan: "PROFESSIONAL",
    priceId: "price_123456789",
    userId: "usr_123456789",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

#### Resposta de Erro
```typescript
null
```

### 8.2 Obter Informações da Atividade

**Função**: `getInfoActivity`

**Localização**: `app/(panel)/dashboard/configurations/activity/_data-access/get-info-activity.ts`

#### Funcionalidades
- ✅ **Busca otimizada**: Query única com JOIN para assinatura
- ✅ **Type safety**: Retorno totalmente tipado com Prisma
- ✅ **Tratamento de erros**: Logging detalhado e graceful failure
- ✅ **Performance**: Índices otimizados e cache preparado
- ✅ **Segurança**: Validação de entrada e sanitização

#### Parâmetros
```typescript
{
  userId: string;  // ID único do usuário (obrigatório, formato CUID)
}
```

#### Resposta de Sucesso
```typescript
{
  id: "usr_123456789",
  name: "João Silva",
  email: "usuario@exemplo.com",
  emailVerified: null,
  image: "https://lh3.googleusercontent.com/...",
  activity: "Barbearia",  // Campo principal consultado
  cpf: null,
  cnpj: null,
  address: null,
  phone: null,
  status: true,
  stripe_customer_id: null,
  times: [],
  subscription: {         // Relacionamento incluído
    id: "sub_123456789",
    status: "active",
    plan: "PROFESSIONAL",
    priceId: "price_123456789",
    userId: "usr_123456789",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

#### Resposta de Erro
```typescript
null  // Retornado em caso de erro ou usuário não encontrado
```

#### Exemplo de Uso
```typescript
// Em Server Component
import { getInfoActivity } from "@/app/(panel)/dashboard/configurations/activity/_data-access/get-info-activity";

export default async function ActivityPage() {
  const user = await getInfoActivity({ userId: "usr_123456789" });

  if (!user) {
    return <div>Usuário não encontrado</div>;
  }

  return (
    <div>
      <h1>Atividade: {user.activity || "Não definida"}</h1>
      <p>Plano: {user.subscription?.plan}</p>
    </div>
  );
}
```

### 8.3 Obter Informações de Endereço

**Função**: `getInfoAddress`

**Localização**: `app/(panel)/dashboard/configurations/address/_data-access/get-info-address.ts`

#### Funcionalidades
- ✅ **Busca completa**: Usuário + endereço comercial + assinatura
- ✅ **Relacionamentos incluídos**: Address e Subscription via JOIN
- ✅ **Type safety**: Retorno totalmente tipado com Prisma
- ✅ **Tratamento de erros**: Logging detalhado e graceful failure
- ✅ **Performance**: Consulta única com JOIN otimizado
- ✅ **Flexibilidade**: Suporte a usuários sem endereço cadastrado

#### Parâmetros
```typescript
{
  userId: string;  // ID único do usuário (obrigatório)
}
```

#### Resposta de Sucesso
```typescript
{
  id: "usr_123456789",
  name: "João Silva",
  email: "usuario@exemplo.com",
  emailVerified: null,
  image: "https://lh3.googleusercontent.com/...",
  activity: "Barbearia",
  cpf: null,
  cnpj: null,
  address: "12345-678",  // Referência ao CEP (campo legacy)
  phone: null,
  status: true,
  stripe_customer_id: null,
  times: [],
  Address: {              // Relacionamento completo
    id: "addr_123456789",
    zip_code: "12345-678",
    street: "Rua das Flores",
    number: "123",
    complement: "Apto 45",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
    UserId: "usr_123456789",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  subscription: {
    id: "sub_123456789",
    status: "active",
    plan: "PROFESSIONAL",
    priceId: "price_123456789",
    userId: "usr_123456789",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

#### Resposta de Erro
```typescript
null  // Retornado em caso de erro ou usuário não encontrado
```

#### Exemplo de Uso
```typescript
// Em Server Component
import { getInfoAddress } from "@/app/(panel)/dashboard/configurations/address/_data-access/get-info-address";

export default async function AddressPage() {
  const user = await getInfoAddress({ userId: "usr_123456789" });

  if (!user) {
    return <div>Usuário não encontrado</div>;
  }

  return (
    <div>
      <h1>Endereço</h1>
      {user.Address ? (
        <div>
          <p>{user.Address.street}, {user.Address.number}</p>
          <p>{user.Address.neighborhood} - {user.Address.city}/{user.Address.state}</p>
          <p>CEP: {user.Address.zip_code}</p>
        </div>
      ) : (
        <p>Nenhum endereço cadastrado</p>
      )}
    </div>
  );
}
```

### 8.4 Obter Horários de Funcionamento

**Função**: `getInfoTimes`

**Localização**: `app/(panel)/dashboard/configurations/time/_data-access/get-info-times.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
User | null  // Horários por dia da semana + dados de assinatura
```

### 8.5 Obter Horários da Empresa

**Função**: `getCompanyTimes`

**Localização**: `app/(panel)/dashboard/services/employee/_data-access/get-company-times.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
{ mon_times: string[], tue_times: string[], ..., sun_times: string[] } | null
```

### 8.6 Obter Dados do Calendário

**Função**: `getCalendarData`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-calendar-data.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
{ companyTimes: object, employees: Employee[], services: Service[] } | null
```

### 8.7 Obter Informações do Calendário

**Função**: `getInfoCalendar`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-info-calendar.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
User[]  // Usuário com agendamentos, funcionários e serviços
```

### 8.8 Obter Agendamentos do Dia

**Função**: `getDayAppointments`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-day-appointments.ts`

#### Parâmetros
```typescript
{ userId: string, date: Date }
```

#### Retorno
```typescript
Appointment[]  // Agendamentos do dia em America/Sao_Paulo
```

### 8.9 Obter Datas com Agendamentos

**Função**: `getAppointmentDates`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-appointment-dates.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
Date[]  // Datas únicas com agendamentos a partir de hoje
```

### 8.10 Obter Agendamentos do Mês

**Função**: `getMonthAppointments`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-month-appointments.ts`

#### Parâmetros
```typescript
{ userId: string, year: number, month: number }  // month: 0-11
```

#### Retorno
```typescript
number[]  // Dias (1-31) do mês que possuem agendamentos
```

### 8.11 Obter Próximo Agendamento

**Função**: `getNextAppointmentDate`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-next-appointment-date.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
Date | null  // Data do próximo agendamento ou null
```

### 8.12 Obter Agendamento por ID (F-02)

**Função**: `getAppointmentById`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_data-access/get-appointment-by-id.ts`

#### Funcionalidades
- ✅ **Autenticação**: JWT via getUserFromToken
- ✅ **Propriedade**: Valida que o agendamento pertence ao userId
- ✅ **Dados completos**: Inclui serviço, funcionário e histórico de alterações
- ✅ **Ordenação**: Histórico ordenado por data decrescente

#### Parâmetros
```typescript
{ appointmentId: string, userId: string }
```

#### Retorno
```typescript
Appointment & { service: Service, employee: Employee, history: AppointmentHistory[] } | null
```

### 8.13 Obter Feriado Específico

**Função**: `getStopDay`

**Localização**: `app/(panel)/dashboard/schedule/stopday/_data-access/get-stopday.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
StopDay[]  // Todos os feriados do usuário
```

### 8.13 Obter Agendamentos para Data (StopDay)

**Função**: `getAppointmentsForDate`

**Localização**: `app/(panel)/dashboard/schedule/stopday/_data-access/get-appointments-for-date.ts`

#### Parâmetros
```typescript
{ userId: string, date: Date }
```

#### Retorno
```typescript
AppointmentInfo[]  // Agendamentos da data com serviço e funcionário, ordenados por horário
```

### 8.14 Obter Empresa por Token (Público)

**Função**: `getCompanyByToken`

**Localização**: `app/(public)/agendamento/[token]/_data-access/get-company-by-token.ts`

#### Parâmetros
```typescript
{ token: string }
```

#### Retorno
```typescript
{ id: string, be_called: string, token_called: string, mon_times: string[], ... } | null
```

### 8.15 Obter Todos os Bloqueios de Horário

**Função**: `getAllBlockedTimes`

**Localização**: `app/(panel)/dashboard/schedule/blocked-time/_data-access/get-all-blocked-times.ts`

#### Parâmetros
```typescript
{ userId: string }
```

#### Retorno
```typescript
BlockedTimeWithEmployee[]  // Array com id, date, time, motivation, employeeId, createdAt, updatedAt, employee: { id, name }
```

### 8.16 Obter Bloqueios de Funcionário por Data

**Função**: `getBlockedTimesForEmployeeDate`

**Localização**: `app/(panel)/dashboard/schedule/blocked-time/_data-access/get-blocked-times-for-employee-date.ts`

#### Parâmetros
```typescript
{ employeeId: string, date: Date, userId: string }
```

#### Retorno
```typescript
BlockedTimeSlot[]  // Array com id, time, motivation
```

---

## 🛠️ 9. Utilitários (Utils)

### 9.1 Formatação e Validação de CPF

**Módulo**: `utils/formatCPF.ts`
**Algoritmo**: Validação oficial dos dígitos verificadores

#### Funções Disponíveis

**formatCPF(cpf: string)**
```typescript
formatCPF("12345678909")
// Retorno:
{
  formatted: "123.456.789-09",
  isValid: true
}
```

**isCPFValid(cpf: string)**
```typescript
isCPFValid("123.456.789-09") // true
isCPFValid("11111111111")    // false (repetido)
```

**Outras funções**:
- `unformatCPF()`: Remove formatação
- `maskCPF()`: Aplica máscara XXX.XXX.XXX-XX
- `generateValidCPF()`: Gera CPF válido para testes

#### Validações Implementadas
- ✅ Comprimento exato (11 dígitos)
- ✅ Dígitos não repetidos (111.111.111-11)
- ✅ Algoritmo oficial dos dígitos verificadores
- ✅ Formatação automática durante digitação

### 9.2 Formatação e Validação de CNPJ

**Módulo**: `utils/formatCNPJ.ts`

#### Funções Disponíveis

**formatCNPJ(cnpj: string)**
```typescript
formatCNPJ("11222333000181")
// Retorno:
{
  formatted: "11.222.333/0001-81",
  isValid: true
}
```

**isCNPJValid(cnpj: string)**
```typescript
isCNPJValid("11.222.333/0001-81") // true
```

**unformatCNPJ(cnpj: string)**
```typescript
unformatCNPJ("11.222.333/0001-81") // "11222333000181"
```

**maskCNPJ(cnpj: string)**
```typescript
maskCNPJ("11222333000181") // "11.222.333/0001-81"
```

**generateValidCNPJ()**
```typescript
generateValidCNPJ() // "28.221.502/5311-08" (CNPJ válido aleatório)
```

### 9.3 Formatação de Telefone

**Módulo**: `utils/formatPhone.ts`

#### Função Disponível

**formatPhone(phone: string)**
```typescript
formatPhone("11999999999") // "(11) 99999-9999"
formatPhone("1199999999")  // "(11) 9999-9999"
```

### 9.4 Hook de Formulário - Atividade

**Módulo**: `app/(panel)/dashboard/configurations/activity/_components/form-activity.tsx`

#### Função: `useFormActivity`

Hook personalizado React Hook Form para gerenciamento do formulário de seleção de atividade profissional.

##### Configuração
- **Resolver**: Zod com validações robustas
- **Modo**: `onBlur` para validação em tempo real
- **Default Values**: Baseado na atividade atual do usuário

##### Validações Implementadas
```typescript
const formSchema = z.object({
  activity: z.string()
    .min(1, "Selecione uma atividade.")
    .refine((value) => {
      const allowed = ["Barbearia", "Cabelereiro", "Manicure", "Maquiagem", "Petshop"];
      return allowed.includes(value);
    }, "Atividade inválida.")
});
```

##### Exemplo de Uso
```typescript
import { useFormActivity } from "@/app/(panel)/dashboard/configurations/activity/_components/form-activity";

function ActivityForm({ user }: { user: User }) {
  const form = useFormActivity({
    activity: user.activity  // Valor inicial
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos do formulário */}
      </form>
    </Form>
  );
}
```

### 9.5 Hook de Formulário - Endereço

**Módulo**: `app/(panel)/dashboard/configurations/address/_components/form-address.tsx`

#### Função: `useFormAddress`

Hook personalizado React Hook Form para gerenciamento completo do formulário de endereço comercial.

##### Configuração
- **Resolver**: Zod com validações robustas para endereço brasileiro
- **Modo**: `onBlur` para validação em tempo real
- **Default Values**: Baseado nos dados atuais do usuário
- **Formatação**: CEP automática e estado maiúsculo

##### Validações Implementadas
```typescript
const formSchema = z.object({
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().min(3).max(100),
  number: z.string().min(1).max(20),
  complement: z.string().max(50).optional(),
  neighborhood: z.string().min(2).max(50),
  city: z.string().min(2).max(50),
  state: z.string().length(2).regex(/^(AC|AL|...)$/i, "UF inválida"),
  country: z.string().min(2).max(50)
});
```

##### Exemplo de Uso
```typescript
import { useFormAddress } from "@/app/(panel)/dashboard/configurations/address/_components/form-address";

function AddressForm({ user }: { user: UserWithAddress }) {
  const form = useFormAddress({
    zip_code: user.Address?.zip_code || user.address || "",
    street: user.Address?.street || "",
    number: user.Address?.number || "",
    complement: user.Address?.complement || "",
    neighborhood: user.Address?.neighborhood || "",
    city: user.Address?.city || "",
    state: user.Address?.state || "",
    country: user.Address?.country || "Brasil"
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos do formulário de endereço */}
      </form>
    </Form>
  );
}
```

### 9.6 Hook de Formulário - Pessoa Física

**Módulo**: `app/(panel)/dashboard/configurations/model/_components/form-fisica.tsx`

#### Função: `useFormFisica`

Hook personalizado React Hook Form para gerenciamento do formulário de pessoa física com validação CPF opcional.

##### Configuração
- **Resolver**: Zod com validações específicas PF
- **Modo**: `onBlur` para validação em tempo real
- **Default Values**: Baseado nos dados atuais do usuário
- **CPF**: Opcional mas validado quando informado

##### Exemplo de Uso
```typescript
import { useFormFisica } from "@/app/(panel)/dashboard/configurations/model/_components/form-fisica";

function PessoaFisicaForm({ user }: { user: User }) {
  const form = useFormFisica({
    tradeName: user.trade_name,
    name: user.name,
    cpf: user.cpf,
    phone: user.phone
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos do formulário PF */}
      </form>
    </Form>
  );
}
```

### 9.7 Hook de Formulário - Pessoa Jurídica

**Módulo**: `app/(panel)/dashboard/configurations/model/_components/form-juridica.tsx`

#### Função: `useFormJuridica`

Hook personalizado React Hook Form para gerenciamento do formulário de pessoa jurídica com validação CNPJ opcional.

##### Configuração
- **Resolver**: Zod com validações específicas PJ
- **Modo**: `onBlur` para validação em tempo real
- **Default Values**: Baseado nos dados atuais da empresa
- **CNPJ**: Opcional mas validado quando informado

##### Exemplo de Uso
```typescript
import { useFormJuridica } from "@/app/(panel)/dashboard/configurations/model/_components/form-juridica";

function PessoaJuridicaForm({ user }: { user: User }) {
  const form = useFormJuridica({
    tradeName: user.trade_name,
    name: user.name,
    cnpj: user.cnpj,
    phone: user.phone
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos do formulário PJ */}
      </form>
    </Form>
  );
}
```

### 9.8 Hook de Formulário - Horários

**Módulo**: `app/(panel)/dashboard/configurations/time/_components/form-times.tsx`

#### Função: `useFormTimes`

Hook personalizado React Hook Form para gerenciamento de horários por dia da semana.

##### Configuração
- **Resolver**: Zod com validações específicas para horários
- **Modo**: `onChange` para validação em tempo real
- **Default Values**: Baseado nos horários atuais do usuário
- **Validação**: Formato HH:MM obrigatório para todos os horários

##### Utilitários Incluídos
```typescript
// Formatação de horário
formatTime("8:0")    // "08:00"
formatTime("14:5")   // "14:05"

// Validação de horário
isValidTime("08:00")  // true
isValidTime("25:00")  // false

// Ordenação de horários
sortTimes(["14:00", "08:00"])  // ["08:00", "14:00"]

// Remoção de duplicatas
removeDuplicateTimes(["08:00", "08:00", "09:00"])  // ["08:00", "09:00"]
```

##### Exemplo de Uso
```typescript
import { useFormTimes } from "@/app/(panel)/dashboard/configurations/time/_components/form-times";

function TimesForm({ user }: { user: UserWithTimes }) {
  const form = useFormTimes({
    mon_times: user.mon_times,
    tue_times: user.tue_times,
    // ... outros dias
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos de horários por dia */}
      </form>
    </Form>
  );
}
```

### 9.9 Utilitários Gerais

**Módulo**: `lib/utils.ts`

#### Funções de Formatação
```typescript
cn("bg-red-500", "text-white")        // Combina classes Tailwind
formatCurrency(1500)                 // "R$ 15,00"
formatDate(new Date(), {time: true}) // "15/01/2025 14:30"
capitalize("joão silva")            // "João Silva"
slugify("Serviço Especial")          // "servico-especial"
truncate("Texto muito longo", 15)   // "Texto muito lo..."
```

#### Validações e Helpers
```typescript
isValidEmail("user@email.com")       // true
generateId("appointment")            // "appointment_1736934567890_123"
normalizeString("João André")        // "Joao Andre"
```

---

## 📊 10. Estrutura de Dados (Schemas)

### 10.1 User (Usuário)
```typescript
interface User {
  id: string;                    // CUID único
  name?: string;                 // Nome completo
  email: string;                 // Email único
  emailVerified?: Date;          // Data de verificação
  password_hash?: string;        // Hash da senha (bcrypt)
  image?: string;                // URL da imagem do perfil
  activity?: string;             // Atividade profissional
  cpf?: string;                  // CPF (Pessoa Física)
  cnpj?: string;                 // CNPJ (Pessoa Jurídica)
  trade_name?: string;           // Nome fantasia da empresa
  logo?: string;                 // URL relativa do logo da empresa (/uploads/logos/...)
  address?: string;              // Endereço comercial (referência legacy)
  phone?: string;                // Telefone formatado
  be_called?: string;            // Nome público para agendamento (único)
  token_called?: string;         // Token único para página pública de agendamento
  status: boolean;               // Status ativo/inativo
  stripe_customer_id?: string;   // ID do cliente no Stripe
  mon_times: string[];           // Horários segunda-feira
  tue_times: string[];           // Horários terça-feira
  wed_times: string[];           // Horários quarta-feira
  thu_times: string[];           // Horários quinta-feira
  fri_times: string[];           // Horários sexta-feira
  sat_times: string[];           // Horários sábado
  sun_times: string[];           // Horários domingo
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de atualização
  // Relacionamentos
  Address?: Address;             // Endereço comercial (1:1)
  services: Service[];           // Serviços (1:N)
  employees: Employee[];         // Funcionários (1:N)
  appointments: Appointment[];   // Agendamentos (1:N)
  reminders: Reminder[];         // Lembretes (1:N)
  stopDays: StopDay[];           // Feriados (1:N)
  subscription?: Subscription;   // Assinatura (1:1)
  refreshTokens: RefreshToken[]; // Tokens de refresh (1:N)
  emailOtps: EmailOtp[];         // Códigos OTP (1:N)
  resetTokens: PasswordResetToken[]; // Tokens de reset de senha (1:N)
  securityLogs: SecurityLog[];   // Logs de segurança (1:N)
}
```

### 10.2 Service (Serviço)
```typescript
interface Service {
  id: string;           // CUID único
  name: string;         // Nome do serviço
  price: number;        // Preço em centavos
  duration: number;     // Duração em minutos
  status: boolean;      // Status ativo/inativo
  UserId: string;       // ID do usuário proprietário
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### 10.3 Appointment (Agendamento)
```typescript
interface Appointment {
  id: string;              // CUID único
  name: string;            // Nome do cliente
  email: string;           // Email do cliente (não único)
  phone: string;           // Telefone do cliente
  appointmentDate: Date;   // Data do agendamento (timezone America/Sao_Paulo)
  time: string;            // Horário do agendamento (HH:MM)
  status: AppointmentStatus; // Status: 'confirmed' | 'cancelled' (F-02)
  cancelReason: string?;   // Motivo do cancelamento (F-02, max 500 chars)
  cancelledAt: DateTime?;  // Data/hora do cancelamento (F-02)
  cancelledBy: string?;    // Quem cancelou: 'professional' | 'client' | 'system' (F-02)
  userId: string;          // ID do usuário (empresa)
  serviceId: string;       // ID do serviço
  employeeId: string;      // ID do funcionário
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Data de atualização
  service: Service;        // Relacionamento com serviço
  employee: Employee;      // Relacionamento com funcionário
  history: AppointmentHistory[]; // Histórico de alterações (F-02)
}
```

### 10.3.1 AppointmentHistory (Histórico de Agendamento — F-02)
```typescript
interface AppointmentHistory {
  id: string;              // CUID único
  appointmentId: string;   // ID do agendamento
  action: string;          // 'created' | 'cancelled' | 'rescheduled' | 'edited'
  performedBy: string;     // 'professional' | 'client' | 'system'
  changes: Json?;          // { campo: { from: valorAnterior, to: valorNovo } }
  reason: string?;         // Motivo (para cancelamento)
  createdAt: Date;         // Data do registro
  appointment: Appointment; // Relacionamento com agendamento
}
```

### 10.4 StopDay (Feriado)
```typescript
interface StopDay {
  id: string;           // CUID único
  date: Date;          // Data do feriado (timezone America/Sao_Paulo)
  motivation: string;  // Motivo do feriado (3-500 caracteres)
  UserId: string;      // ID do usuário (empresa)
  createdAt: Date;     // Data de criação
  updatedAt: Date;     // Data de atualização
}
```

### 10.5 Employee (Funcionário)
```typescript
interface Employee {
  id: string;          // CUID único
  name: string;        // Nome do funcionário
  email: string;       // Email único
  phone: string;       // Telefone
  function: string;     // Função/cargo
  status: boolean;      // Ativo/inativo
  UserId: string;      // ID do usuário (empresa)
  mon_times: string[]; // Horários segunda-feira
  tue_times: string[]; // Horários terça-feira
  wed_times: string[]; // Horários quarta-feira
  thu_times: string[]; // Horários quinta-feira
  fri_times: string[]; // Horários sexta-feira
  sat_times: string[]; // Horários sábado
  sun_times: string[]; // Horários domingo
  services: EmployeeService[]; // Relacionamento many-to-many com serviços
  appointments: Appointment[]; // Agendamentos vinculados (1:N)
  createdAt: Date;
  updatedAt: Date;
}
```

### 10.6 Subscription (Assinatura)
```typescript
interface Subscription {
  id: string;           // CUID único
  status: string;       // Status da assinatura
  plan: Plans;          // BASIC | PROFESSIONAL
  priceId: string;      // ID do preço no Stripe
  userId: string;       // ID do usuário (único)
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### 10.7 Reminder (Lembrete)
```typescript
interface Reminder {
  id: string;           // CUID único
  description: string;  // Descrição do lembrete
  UserId: string;       // ID do usuário
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### 10.8 Address (Endereço)
```typescript
interface Address {
  id: string;           // ID único (gerado manualmente, sem @default)
  street?: string;      // Logradouro
  number?: string;      // Número
  complement?: string;  // Complemento
  neighborhood?: string; // Bairro
  city?: string;        // Cidade
  state?: string;       // UF (2 caracteres)
  zip_code?: string;    // CEP (00000-000)
  country?: string;     // País
  UserId: string;       // ID do usuário (único, relação 1:1)
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização (manual, sem @updatedAt)
}
```

### 10.9 EmployeeService (Relação Many-to-Many)
```typescript
interface EmployeeService {
  id: string;           // CUID único
  employeeId: string;   // ID do funcionário
  serviceId: string;    // ID do serviço
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
  // Constraint: @@unique([employeeId, serviceId])
}
```

### 10.10 RefreshToken (Token de Refresh)
```typescript
interface RefreshToken {
  id: string;           // CUID único
  userId: string;       // ID do usuário
  tokenHash: string;    // Hash do refresh token
  expiresAt: Date;      // Data de expiração
  revokedAt?: Date;     // Data de revogação (null = ativo)
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### 10.11 LoginAttempt (Tentativa de Login)
```typescript
interface LoginAttempt {
  id: string;           // CUID único
  email: string;        // Email da tentativa
  count: number;        // Contador de tentativas (default: 0)
  lastAttempt: Date;    // Última tentativa
  lockedUntil?: Date;   // Bloqueado até (null = desbloqueado)
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### 10.12 IpRateLimit (Rate Limit por IP)
```typescript
interface IpRateLimit {
  id: string;           // CUID único
  ip: string;           // Endereço IP (único)
  count: number;        // Contador de requisições (default: 0)
  firstAttemptAt: Date; // Primeira tentativa
  blockedUntil?: Date;  // Bloqueado até (null = desbloqueado)
  updatedAt: Date;      // Data de atualização
}
```

### 10.13 EmailOtp (OTP por Email)
```typescript
interface EmailOtp {
  id: string;           // CUID único
  email: string;        // Email de destino
  codeHash: string;     // Hash do código OTP
  expiresAt: Date;      // Data de expiração
  usedAt?: Date;        // Data de uso (null = não usado)
  attempts: number;     // Tentativas de verificação (default: 0)
  lockedUntil?: Date;   // Bloqueado até
  lastSentAt: Date;     // Último envio
  userId?: string;      // ID do usuário (opcional)
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### 10.14 PasswordResetToken (Token de Reset de Senha)
```typescript
interface PasswordResetToken {
  id: string;           // CUID único
  email: string;        // Email do usuário
  tokenHash: string;    // Hash do token de reset
  expiresAt: Date;      // Data de expiração
  usedAt?: Date;        // Data de uso (null = não usado)
  userId?: string;      // ID do usuário (opcional)
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### 10.15 SecurityLog (Log de Segurança)
```typescript
interface SecurityLog {
  id: string;           // CUID único
  userId?: string;      // ID do usuário (opcional)
  email?: string;       // Email associado
  ip?: string;          // Endereço IP
  action: string;       // Ação realizada (login, logout, etc.)
  metadata?: object;    // Metadados adicionais (JSON)
  createdAt: Date;      // Data de criação
}
```

### 10.16 Plans (Enum de Planos)
```typescript
enum Plans {
  FREE       // Plano gratuito (padrão)
  STARTER    // Plano inicial
  PRO        // Plano profissional
  ENTERPRISE // Plano empresarial
}
```
> Utilizado no campo `plan` do modelo `Subscription`.

---

## 📊 11. Dashboard - Data Access

### 11.1 Estatísticas do Dashboard

**Função**: `getInfoDashboard`

**Localização**: `app/(panel)/dashboard/dashboard/_data-access/get-info-dashboard.ts`

#### Funcionalidades
- ✅ **Estatísticas em tempo real**: Agendamentos, clientes, receita
- ✅ **Comparações**: Hoje vs ontem, mês atual vs mês passado
- ✅ **Cálculo de disponibilidade**: Horários livres para hoje
- ✅ **Timezone**: Todas as datas no timezone America/Sao_Paulo

#### Parâmetros
```typescript
{
  userId: string;  // ID do usuário (empresa)
}
```

#### Estrutura de Retorno
```typescript
{
  appointmentsToday: number;           // Agendamentos de hoje
  appointmentsYesterday: number;        // Agendamentos de ontem
  uniqueClients: number;                // Total de clientes únicos
  uniqueClientsThisMonth: number;       // Novos clientes do mês
  availableSlotsToday: number;          // Horários livres hoje
  monthlyRevenue: number;              // Receita do mês atual
  monthlyRevenueLastMonth: number;      // Receita do mês passado
}
```

#### Exemplo
```typescript
import { getInfoDashboard } from "@/app/(panel)/dashboard/dashboard/_data-access/get-info-dashboard";

const stats = await getInfoDashboard({ userId: "usr_123" });
console.log(stats.appointmentsToday); // 5
console.log(stats.monthlyRevenue); // 2450.00
```

### 11.2 Novos Agendamentos

**Função**: `getNewAppointments`

**Localização**: `app/(panel)/dashboard/dashboard/_data-access/get-new-appointments.ts`

#### Funcionalidades
- ✅ **Busca agendamentos recentes**: Últimas 30 horas
- ✅ **Filtro de agendamentos futuros**: Apenas agendamentos que ainda não ocorreram
- ✅ **Informações completas**: Inclui serviço e funcionário
- ✅ **Ordenação**: Mais recentes primeiro

#### Parâmetros
```typescript
{
  userId: string;  // ID do usuário (empresa)
}
```

#### Estrutura de Retorno
```typescript
Array<{
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentDate: Date;
  time: string;
  service: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    name: string;
  };
  createdAt: Date;
}>
```

#### Exemplo
```typescript
import { getNewAppointments } from "@/app/(panel)/dashboard/dashboard/_data-access/get-new-appointments";

const appointments = await getNewAppointments({ userId: "usr_123" });
console.log(appointments.length); // 3
console.log(appointments[0].service.name); // "Corte de Cabelo"
```

### 11.3 Lista de Lembretes (Tarefas)

**Função**: `getReminders`

**Localização**: `app/(panel)/dashboard/dashboard/_data-access/get-reminders.ts`

#### Funcionalidades
- ✅ **Busca todos os lembretes**: Do usuário logado
- ✅ **Ordenação**: Por data de criação (mais antigos primeiro)
- ✅ **Type-safe**: Retorno tipado

#### Parâmetros
```typescript
{
  userId: string;  // ID do usuário (empresa)
}
```

#### Estrutura de Retorno
```typescript
Array<{
  id: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### Exemplo
```typescript
import { getReminders } from "@/app/(panel)/dashboard/dashboard/_data-access/get-reminders";

const reminders = await getReminders({ userId: "usr_123" });
console.log(reminders.length); // 5
console.log(reminders[0].description); // "Ligar para cliente João"
```

### 11.4 Token do Usuário

**Função**: `getUserToken`

**Localização**: `app/(panel)/dashboard/dashboard/_data-access/get-user-token.ts`

#### Funcionalidades
- ✅ **Busca token público**: Obtém o `token_called` do usuário para montar a URL pública de agendamento
- ✅ **Server Action**: Executado no servidor com `'use server'`

#### Parâmetros
```typescript
{
  userId: string;  // ID do usuário (empresa)
}
```

#### Retorno
```typescript
string | null  // Token único ou null se não encontrado
```

### 11.4.1 Métricas de Compartilhamento do Link Público

**Função**: `getBookingLinkShareStats`

**Localização**: `app/(panel)/dashboard/dashboard/_data-access/get-booking-link-share-stats.ts`

#### Funcionalidades
- ✅ **Agregação por canal**: WhatsApp, Instagram, Facebook, TikTok e cópia
- ✅ **Janela de 30 dias**: consulta os eventos recentes para leitura no dashboard
- ✅ **Validação de sessão**: só retorna dados quando `session.id === userId`

#### Parâmetros
```typescript
{
  userId: string;  // ID do usuário (empresa)
}
```

#### Estrutura de Retorno
```typescript
{
  total: number;
  whatsapp: number;
  instagram: number;
  facebook: number;
  tiktok: number;
  copy: number;
}
```

#### Exemplo
```typescript
import { getBookingLinkShareStats } from "@/app/(panel)/dashboard/dashboard/_data-access/get-booking-link-share-stats";

const stats = await getBookingLinkShareStats({ userId: "usr_123" });
console.log(stats.total); // 42
```

### 11.5 Token do Usuário para Webhook

**Função**: `getUserTokenForWebhook`

**Localização**: `app/(panel)/dashboard/schedule/calendar/_components/_data-access/get-user-token-for-webhook.ts`

#### Funcionalidades
- ✅ **Busca token para webhook**: Obtém o `token_called` para incluir no payload do webhook
- ✅ **Server Action**: Executado no servidor com `'use server'`

#### Parâmetros
```typescript
userId: string  // ID do usuário (empresa)
```

#### Retorno
```typescript
string | null  // Token único ou null se não encontrado
```

### 11.6 Componentes do Dashboard

| Componente | Localização | Props | Descrição |
|---|---|---|---|
| `DailyScheduleCard` | `dashboard/_components/daily-schedule-card.tsx` | `userId: string` | Card com agenda do dia (agendamentos, serviços, horários, preços) |
| `NewAppointmentAlert` | `dashboard/_components/new-appointment-alert.tsx` | `userId: string` | Alerta de novos agendamentos (verifica a cada 30min, persiste no localStorage) |
| `PublicBookingUrlCard` | `dashboard/_components/public-booking-url-card.tsx` | `userId: string` | Card com URL pública de agendamento (copiar com um clique) |
| `TasksList` | `dashboard/_components/tasks-list.tsx` | `userId: string` | Lista de tarefas/lembretes com CRUD (criar, editar, deletar) |

---

## 📋 11.7 Dashboard - Server Actions (Tarefas/Lembretes)

### 11.7.1 Criar Lembrete

**Função**: `createReminder`

**Localização**: `app/(panel)/dashboard/dashboard/_actions/create-reminder.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: Descrição obrigatória (1-500 caracteres)
- ✅ **Criação no banco**: Prisma ORM
- ✅ **Tratamento de erros**: Retorno type-safe

#### Parâmetros
```typescript
{
  description: string;  // Descrição da tarefa (1-500 caracteres)
  userId: string;       // ID do usuário
}
```

#### Retorno
```typescript
{
  success: boolean;
  message: string;
  data?: {
    id: string;
    description: string;
    createdAt: Date;
  };
}
```

#### Exemplo
```typescript
import { createReminder } from "@/app/(panel)/dashboard/dashboard/_actions/create-reminder";

const result = await createReminder({
  description: "Ligar para cliente João",
  userId: "usr_123"
});

if (result.success) {
  console.log("Lembrete criado:", result.data?.id);
} else {
  console.error("Erro:", result.message);
}
```

### 11.7.2 Atualizar Lembrete

**Função**: `updateReminder`

**Localização**: `app/(panel)/dashboard/dashboard/_actions/update-reminder.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: Descrição obrigatória (1-500 caracteres)
- ✅ **Verificação de propriedade**: Garante que o lembrete pertence ao usuário
- ✅ **Atualização no banco**: Prisma ORM
- ✅ **Tratamento de erros**: Retorno type-safe

#### Parâmetros
```typescript
{
  id: string;          // ID do lembrete
  description: string;  // Nova descrição (1-500 caracteres)
  userId: string;       // ID do usuário
}
```

#### Retorno
```typescript
{
  success: boolean;
  message: string;
  data?: {
    id: string;
    description: string;
    updatedAt: Date;
  };
}
```

#### Exemplo
```typescript
import { updateReminder } from "@/app/(panel)/dashboard/dashboard/_actions/update-reminder";

const result = await updateReminder({
  id: "rem_123",
  description: "Ligar para cliente João - atualizado",
  userId: "usr_123"
});

if (result.success) {
  console.log("Lembrete atualizado:", result.data?.id);
} else {
  console.error("Erro:", result.message);
}
```

### 11.7.3 Deletar Lembrete

**Função**: `deleteReminder`

**Localização**: `app/(panel)/dashboard/dashboard/_actions/delete-reminder.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: ID obrigatório
- ✅ **Verificação de propriedade**: Garante que o lembrete pertence ao usuário
- ✅ **Exclusão no banco**: Prisma ORM
- ✅ **Tratamento de erros**: Retorno type-safe

#### Parâmetros
```typescript
{
  id: string;     // ID do lembrete
  userId: string;  // ID do usuário
}
```

#### Retorno
```typescript
{
  success: boolean;
  message: string;
}
```

#### Exemplo
```typescript
import { deleteReminder } from "@/app/(panel)/dashboard/dashboard/_actions/delete-reminder";

const result = await deleteReminder({
  id: "rem_123",
  userId: "usr_123"
});

if (result.success) {
  console.log("Lembrete deletado com sucesso");
} else {
  console.error("Erro:", result.message);
}
```

### 11.7.4 Tracking de Compartilhamento do Link Público

**Função**: `trackBookingLinkShare`

**Localização**: `app/(panel)/dashboard/dashboard/_actions/track-booking-link-share.ts`

#### Funcionalidades
- ✅ **Validação com Zod**: fonte permitida (`whatsapp`, `instagram`, `facebook`, `tiktok`, `copy`)
- ✅ **Auditoria persistente**: grava evento no `SecurityLog` com action `BOOKING_LINK_SHARE`
- ✅ **Sessão obrigatória**: usa `getUserFromToken()` para obter `userId` no servidor

#### Parâmetros
```typescript
{
  source: "whatsapp" | "instagram" | "facebook" | "tiktok" | "copy";
}
```

#### Retorno
```typescript
{
  success: boolean;
  message: string;
}
```

#### Exemplo
```typescript
import { trackBookingLinkShare } from "@/app/(panel)/dashboard/dashboard/_actions/track-booking-link-share";

await trackBookingLinkShare({ source: "whatsapp" });
```

---

## 🔒 12. Segurança e Autenticação

### 12.1 Middleware de Autenticação
- Todas as rotas em `/dashboard` requerem autenticação
- Validação automática via JWT (cookies httpOnly)
- Redirecionamento automático para login se não autenticado

### 12.2 Módulos de Segurança (`lib/`)

| Arquivo | Responsabilidade |
|---|---|
| `auth.ts` | `getUserFromToken()` (Server Components) e `getUserFromRequest()` (API Routes) |
| `auth-cookies.ts` | Set/clear de cookies httpOnly para access e refresh tokens |
| `jwt.ts` | Geração (`signAccessToken`, `signRefreshToken`) e verificação (`verifyAccessToken`, `verifyRefreshToken`) de tokens JWT |
| `password.ts` | Hashing (`hashPassword`) e verificação (`verifyPassword`) de senhas com bcrypt |
| `password-policy.ts` | Validação de política de senhas (comprimento mínimo, complexidade, caracteres especiais) |
| `tokens.ts` | Geração e validação de tokens genéricos (OTP, reset de senha) |
| `rate-limit.ts` | Rate limiting por IP (`IpRateLimit`) e por email (`LoginAttempt`) |
| `security-log.ts` | Registro de ações de segurança no modelo `SecurityLog` (login, logout, tentativas falhas) |
| `email.ts` | Envio de emails transacionais via SMTP/Mailtrap (OTP, reset de senha, contato) |

### 12.3 Validações de Segurança
- **Input Sanitization**: Todos os inputs são sanitizados
- **SQL Injection Protection**: Prisma ORM previne injeções SQL
- **XSS Protection**: Next.js sanitiza automaticamente
- **CSRF Protection**: Cookies httpOnly + SameSite=Lax

### 12.4 Headers de Segurança
```json
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=()"
}
```

---

## 🚀 13. Plano de Expansão da API

### 13.1 Endpoints Planejados

#### Serviços (CRUD completo)
```
GET    /api/services           # Listar serviços do usuário
POST   /api/services           # Criar novo serviço
GET    /api/services/:id       # Obter serviço específico
PUT    /api/services/:id       # Atualizar serviço
DELETE /api/services/:id       # Deletar serviço
```

#### Agendamentos (CRUD completo)
```
GET    /api/appointments       # Listar agendamentos
POST   /api/appointments       # Criar agendamento
GET    /api/appointments/:id   # Obter agendamento
PUT    /api/appointments/:id   # Atualizar agendamento
DELETE /api/appointments/:id   # Cancelar agendamento
```

#### Lembretes (CRUD completo)
```
GET    /api/reminders          # Listar lembretes
POST   /api/reminders          # Criar lembrete
GET    /api/reminders/:id      # Obter lembrete
PUT    /api/reminders/:id      # Atualizar lembrete
DELETE /api/reminders/:id      # Deletar lembrete
```

#### Assinaturas
```
GET    /api/subscription       # Obter assinatura atual
POST   /api/subscription       # Criar/atualizar assinatura
GET    /api/plans             # Listar planos disponíveis
POST   /api/webhooks/stripe    # Webhooks do Stripe
```

### 13.2 Autenticação de API
```json
{
  "Authorization": "Bearer <nextauth_token>",
  "Content-Type": "application/json"
}
```

### 13.3 Filtros e Paginação
```json
{
  "page": 1,
  "limit": 20,
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "filters": {
    "status": "active",
    "dateFrom": "2025-01-01",
    "dateTo": "2025-01-31"
  }
}
```

---

## 📝 14. Exemplos de Integração

### 14.1 Buscar Serviços Disponíveis
```javascript
const response = await fetch('/api/services', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const services = await response.json();
```

### 14.2 Criar Novo Agendamento
```javascript
const appointmentData = {
  name: "Maria Silva",
  email: "maria@email.com",
  phone: "(11) 99999-9999",
  appointmentDate: "2025-01-15T10:00:00Z",
  time: "10:00",
  serviceId: "srv_123456789"
};

const response = await fetch('/api/appointments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(appointmentData)
});
```

### 14.3 Validar CPF em Tempo Real
```javascript
import { formatCPF } from '@/utils/formatCPF';

const validateCPF = (cpfInput) => {
  const result = formatCPF(cpfInput);
  return {
    isValid: result.isValid,
    formatted: result.formatted,
    error: result.isValid ? null : 'CPF inválido'
  };
};
```

---

## 📈 15. Status e Próximos Passos

### ✅ **Implementado**
- **Server Actions**: Sistema completo de ações do servidor
- **Módulo Activity**: Configuração completa de atividade profissional
- **Módulo Model**: Sistema completo PF/PJ com validações CPF/CNPJ oficiais
- **Módulo Address**: Sistema completo de endereço comercial com busca por CEP
- **Módulo Times**: Sistema completo de horários por dia da semana
- **Módulo Employee**: CRUD completo de funcionários com relacionamento many-to-many
- **Módulo Service**: CRUD completo de serviços com formatação de preço e duração
- **Módulo Calendar**: Sistema completo de agendamentos com calendário mensal e agenda diária
- **Módulo StopDay**: Gestão de feriados com verificação de agendamentos
- **Módulo Dashboard**: Estatísticas em tempo real, notificações e agenda diária
- **Módulo Reminders**: CRUD completo de tarefas/lembretes
- **Webhook N8N**: Integração com webhook para envio de dados de agendamentos
- **Agendamento Público**: Página pública de agendamento via token
- **Validações**: CPF, CNPJ, telefone, endereço, formulários Zod
- **Utilitários**: Formatação automática e validações
- **Autenticação**: JWT + bcrypt + OTP
- **Database**: Prisma ORM com PostgreSQL
- **UI/UX**: Componentes responsivos e acessíveis

### 🔄 **Planejado para próximas versões**
- **Integração Stripe**: Pagamentos online
- **Notificações**: Email/SMS automáticos
- **Relatórios avançados**: Dashboard analítico com métricas detalhadas
- **Exportação de dados**: CSV/PDF
- **REST API**: Endpoints públicos para integrações externas
- **Mobile App**: Aplicativo mobile complementar

### 9.10 Data Access Layer - Funcionários

**Módulo**: `app/(panel)/dashboard/services/employee/_data-access/get-info-employee.ts`

#### Função: `getInfoEmployee`

Função server-side para buscar lista completa de funcionários associados a um usuário.

##### Funcionalidades
- ✅ **Busca por usuário**: Lista todos os funcionários de um usuário específico
- ✅ **Relacionamento serviço**: Inclui dados do serviço associado quando existir
- ✅ **Ordenação automática**: Funcionários ordenados alfabeticamente por nome
- ✅ **Tratamento de erros**: Logging detalhado e retorno gracioso
- ✅ **Type safety**: Retorno totalmente tipado com tipos Prisma

##### Parâmetros
```typescript
interface GetInfoEmployeeProps {
  userId: string; // ID único do usuário
}
```

##### Retorno
```typescript
type EmployeeWithService = {
  id: string;
  name: string;
  email: string;
  phone: string;
  function: string;
  status: boolean;
  mon_times: string[];
  tue_times: string[];
  // ... outros dias
  createdAt: Date;
  updatedAt: Date;
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
    status: boolean;
  };
}[]
```

##### Exemplo de Uso
```typescript
// Em server component
import { getInfoEmployee } from "@/app/(panel)/dashboard/services/employee/_data-access/get-info-employee";

const employees = await getInfoEmployee({ userId: "usr_123" });
console.log(`Encontrados ${employees.length} funcionários`);
```

### 9.11 Componente - Tabela de Funcionários

**Módulo**: `app/(panel)/dashboard/services/employee/_components/model-employee.tsx`

#### Componente: `ModelEmployee`

Componente React cliente que renderiza uma tabela organizada de funcionários em um card.

##### Funcionalidades
- ✅ **Tabela responsiva**: Layout adaptável desktop/mobile
- ✅ **Estados visuais**: Funcionários ativos/inativos com badges coloridos
- ✅ **Estado vazio**: Mensagem clara quando não há funcionários
- ✅ **Relacionamento serviços**: Mostra serviço associado quando existir
- ✅ **Formatação automática**: Telefone formatado automaticamente
- ✅ **Dados organizados**: Nome, email, telefone, função, serviço, status

##### Props
```typescript
interface ModelEmployeeProps {
  employees: EmployeeWithService[]; // Lista de funcionários
}
```

##### Estrutura Visual
```typescript
// Desktop - Tabela completa
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Telefone</TableHead>
      <TableHead>Função</TableHead>
      <TableHead>Serviço</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* Linhas de funcionários */}
  </TableBody>
</Table>

// Estado vazio
<div className="text-center py-8">
  <p>Não há funcionários cadastrados</p>
</div>
```

##### Estados dos Funcionários
```typescript
// Ativo
<Badge variant="default" className="bg-green-100 text-green-800">
  Ativo
</Badge>

// Inativo
<Badge variant="destructive">
  Inativo
</Badge>
```

##### Exemplo de Uso
```typescript
import { ModelEmployee } from "@/app/(panel)/dashboard/services/employee/_components/model-employee";

function EmployeePage({ employees }: { employees: EmployeeWithService[] }) {
  return (
    <div className="container mx-auto p-4">
      <ModelEmployee employees={employees} />
    </div>
  );
}
```

##### Dependências
- **Componentes UI**: `Card`, `Table`, `Badge`
- **Utils**: `formatPhone` para formatação de telefone
- **Types**: `EmployeeWithService` do Prisma

### 9.12 Página - Configuração de Funcionários

**Página**: `app/(panel)/dashboard/services/employee/page.tsx`

Página principal do módulo de funcionários com tabela completa e navegação integrada.

##### Funcionalidades
- ✅ **Autenticação obrigatória**: Redirecionamento automático se não autenticado
- ✅ **Carregamento de dados**: Lista completa de funcionários do usuário
- ✅ **Navegação breadcrumb**: Contexto de navegação claro
- ✅ **Layout responsivo**: Sidebar integrada e design adaptável
- ✅ **Tratamento de erros**: Estados de erro tratados graciosamente

##### Rota
```
GET /dashboard/services/employee
```

##### Fluxo de Renderização
```typescript
// 1. Verificação de autenticação
const user = await getUserFromToken();
if (!user) redirect("/");

// 2. Carregamento de funcionários
const employees = await getInfoEmployee({ userId: user.id });

// 3. Renderização da página
<SidebarInset>
  <header>{/* Breadcrumb */}</header>
  <div className="container">
    <ModelEmployee employees={employees} />
  </div>
</SidebarInset>
```

##### Tratamento de Estados
```typescript
// Usuário não autenticado
if (!session) redirect("/");

// Dados não encontrados
if (!employees) redirect("/");

// Estado vazio tratado pelo componente
<ModelEmployee employees={[]} /> // "Não há funcionários cadastrados"
```

### 9.13 Server Action - Criação de Funcionários

**Módulo**: `app/(panel)/dashboard/services/employee/_actions/create-employee.ts`

#### Função: `createEmployee`

Server action Next.js para criação segura de funcionários no banco de dados.

##### Funcionalidades
- ✅ **Criação completa**: Funcionário com todos os campos obrigatórios e opcionais
- ✅ **Validação robusta**: Schema Zod com regras específicas por campo
- ✅ **Autenticação obrigatória**: Verificação de sessão ativa
- ✅ **Verificação de conflitos**: Email único e serviço válido
- ✅ **Revalidação de cache**: Cache atualizado automaticamente
- ✅ **Logs detalhados**: Auditoria completa das operações
- ✅ **Tratamento de erros**: Mensagens específicas por tipo de erro

##### Parâmetros
```typescript
interface CreateEmployeeData {
  name: string;        // Nome completo (2-100 chars, letras)
  email: string;       // Email único e válido
  phone: string;       // Telefone formatado (10-15 chars)
  function: string;    // Função/cargo (2-100 chars, letras)
  serviceId?: string;  // ID do serviço opcional
}
```

##### Validações Implementadas
```typescript
const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  email: z.string().email().max(255),
  phone: z.string().min(10).max(15).regex(/^[\d\s\-\+\(\)]+$/),
  function: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  serviceId: z.string().optional()
});
```

##### Processo de Criação
```typescript
// 1. Verificação de autenticação
const user = await getUserFromToken();
if (!user?.id) redirect("/");

// 2. Validação de dados
const validatedData = createEmployeeSchema.parse(data);

// 3. Verificações de conflito
const existingEmployee = await prisma.employee.findUnique({
  where: { email: validatedData.email }
});

// 4. Criação no banco
const employee = await prisma.employee.create({
  data: {
    id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: validatedData.name,
    email: validatedData.email,
    phone: validatedData.phone,
    function: validatedData.function,
    status: true,
    UserId: user.id,
    ServiceId: validatedData.serviceId || null,
    updatedAt: new Date()
  }
});

// 5. Revalidação de cache
revalidatePath("/dashboard/services/employee");
```

##### Resposta de Sucesso
```typescript
{
  success: true,
  data: {
    id: "emp_123456789",
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999",
    function: "Barbeiro",
    status: true,
    createdAt: "2025-01-04T10:30:00Z"
  },
  message: "Funcionário João Silva criado com sucesso!"
}
```

##### Tratamento de Erros
```typescript
// Erro de validação
{
  success: false,
  error: "Dados inválidos: Nome deve ter pelo menos 2 caracteres"
}

// Email já existe
{
  success: false,
  error: "Este email já está cadastrado para outro funcionário"
}

// Serviço não encontrado
{
  success: false,
  error: "Serviço selecionado não encontrado"
}
```

### 9.14 Modal - Criação de Funcionário

**Módulo**: `app/(panel)/dashboard/services/employee/_components/modal_employee.tsx`

#### Componente: `ModalEmployee`

Modal interativo para criação de funcionários com formulário completo e validações.

##### Funcionalidades
- ✅ **Formulário completo**: Todos os campos obrigatórios e opcionais
- ✅ **Validação em tempo real**: Feedback imediato com mensagens específicas
- ✅ **Seleção de serviços**: Dropdown com serviços disponíveis do usuário
- ✅ **Formatação automática**: Telefone formatado durante digitação
- ✅ **Estados visuais**: Loading, sucesso, erro
- ✅ **Acessibilidade**: Labels, placeholders, navegação por teclado
- ✅ **Responsividade**: Layout adaptável desktop/mobile
- ✅ **Integração toast**: Feedback visual de operações

##### Props do Componente
```typescript
interface ModalEmployeeProps {
  open: boolean;                    // Controle de abertura
  onOpenChange: (open: boolean) => void; // Callback de mudança
  services?: Array<{                // Serviços para dropdown
    id: string;
    name: string;
    price: number;
  }>;
}
```

##### Estrutura do Formulário
```typescript
// Campos obrigatórios
<FormField name="name">
  <Input placeholder="Digite o nome completo" />
</FormField>

<FormField name="email">
  <Input type="email" placeholder="funcionario@email.com" />
</FormField>

<FormField name="phone">
  <Input placeholder="(11) 99999-9999" />
  {/* Formatação automática aplicada */}
</FormField>

<FormField name="function">
  <Input placeholder="Ex: Barbeiro, Manicure, Recepcionista" />
</FormField>

// Campo opcional
<FormField name="serviceId">
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Selecione um serviço (opcional)" />
    </SelectTrigger>
    <SelectContent>
      {services.map(service => (
        <SelectItem key={service.id} value={service.id}>
          {service.name} - R$ {(service.price / 100).toFixed(2)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</FormField>
```

##### Estados do Modal
```typescript
// Aberto - pronto para preenchimento
<ModalEmployee open={true} onOpenChange={setOpen} services={services} />

// Durante submissão
<Button disabled={isLoading}>
  <Loader2 className="animate-spin" />
  Salvando...
</Button>

// Após sucesso
toast.success("Funcionário criado com sucesso!");
onOpenChange(false); // Modal fecha automaticamente
form.reset();        // Formulário limpa
```

##### Exemplo de Integração
```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModalEmployee } from "./modal_employee";

function EmployeePage({ services }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Adicionar Funcionário
      </Button>

      <ModalEmployee
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        services={services}
      />
    </>
  );
}
```

### 9.15 Hook de Formulário - Funcionário

**Módulo**: `app/(panel)/dashboard/services/employee/_components/form-employee.tsx`

#### Hook: `useFormEmployee`

Hook personalizado React Hook Form para gerenciamento completo do formulário de criação de funcionários.

##### Funcionalidades
- ✅ **Campos obrigatórios**: Nome, email, telefone, função
- ✅ **Campo opcional**: Serviço associado
- ✅ **Validação em tempo real**: Feedback imediato de erros
- ✅ **Formatação automática**: Telefone formatado durante digitação
- ✅ **Máscaras de entrada**: Restrições de caracteres por campo
- ✅ **Integração React Hook Form**: Configuração otimizada
- ✅ **Zod validation**: Schema robusto de validação
- ✅ **Configuração avançada**: Modo onChange, critérios all

##### Schema de Validação
```typescript
const employeeSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  email: z.string().email().max(255),
  phone: z.string().min(10).max(15).regex(/^[\d\s\-\+\(\)]+$/),
  function: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  serviceId: z.string().optional()
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
```

##### Valores Iniciais
```typescript
const form = useFormEmployee();
// Valores padrão:
{
  name: "",
  email: "",
  phone: "",
  function: "",
  serviceId: undefined
}
```

##### Exemplo de Uso
```typescript
import { useFormEmployee, EmployeeFormData } from "./form-employee";

function CreateEmployeeForm() {
  const form = useFormEmployee();

  const onSubmit = async (data: EmployeeFormData) => {
    const result = await createEmployee(data);
    if (result.success) {
      toast.success(result.message);
      form.reset();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos do formulário */}
      </form>
    </Form>
  );
}
```

### 9.16 Componente - Gestão de Funcionários

**Módulo**: `app/(panel)/dashboard/services/employee/_components/model-employee.tsx`

#### Componente: `ModelEmployee`

Componente React cliente completo para gestão de funcionários, incluindo tabela de listagem e modal de criação.

##### Funcionalidades
- ✅ **Tabela responsiva**: Layout adaptável desktop/mobile com dados organizados
- ✅ **Estados visuais**: Funcionários ativos/inativos destacados com badges
- ✅ **Modal de criação**: Formulário completo com validações em tempo real
- ✅ **Seleção de serviços**: Dropdown com serviços disponíveis para associação
- ✅ **Estado vazio**: Mensagem clara quando não há funcionários
- ✅ **Relacionamento serviço**: Mostra serviço associado quando existir
- ✅ **Formatação automática**: Telefone formatado automaticamente
- ✅ **Botão de ação**: "Adicionar Funcionário" integrado no header
- ✅ **Feedback visual**: Estados de loading, sucesso e erro
- ✅ **Performance**: Renderização otimizada e revalidação automática

##### Props do Componente
```typescript
interface ModelEmployeeProps {
  employees: EmployeeWithService[];     // Lista de funcionários
  services?: Array<{                    // Serviços para dropdown
    id: string;
    name: string;
    price: number;
  }>;
}
```

##### Estrutura da Interface
```typescript
<ModelEmployee employees={employees} services={services} />

// Renderiza:
// - Card com header contendo título e botão "Adicionar Funcionário"
// - Tabela responsiva com funcionários
// - Modal integrado para criação
```

##### Estados do Componente
```typescript
// Tabela com funcionários
{employees.length > 0 ? (
  <Table>...</Table>
) : (
  <div>Mensagem de estado vazio</div>
)}

// Modal de criação integrado
<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <Form>{/* Formulário completo */}</Form>
</Dialog>
```

##### Exemplo de Uso
```typescript
import { ModelEmployee } from "./model-employee";

function EmployeePage({ employees, services }) {
  return (
    <div className="container">
      <ModelEmployee employees={employees} services={services} />
    </div>
  );
}
```

### 9.17 Página - Funcionários

**Módulo Server**: `app/(panel)/dashboard/services/employee/page.tsx`
**Módulo Cliente**: `app/(panel)/dashboard/services/employee/_components/employee-page-client.tsx`

Página principal do módulo de funcionários com componente integrado de gestão.

##### Funcionalidades
- ✅ **Estado do modal**: Controle de abertura/fechamento
- ✅ **Botão de ação**: "Adicionar Funcionário" no canto superior direito
- ✅ **Layout responsivo**: Sidebar integrada e design adaptável
- ✅ **Navegação breadcrumb**: Contexto de navegação claro
- ✅ **Integração server/client**: Dados do server component
- ✅ **Feedback visual**: Estados de loading e operações

##### Estrutura da Página
```typescript
// Header com breadcrumb e botão
<header className="flex h-16 items-center gap-2">
  <SidebarTrigger />
  <Breadcrumb>...</Breadcrumb>

  {/* Botão no canto superior direito */}
  <div className="ml-auto px-4">
    <Button onClick={() => setIsModalOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Adicionar Funcionário
    </Button>
  </div>
</header>

// Conteúdo principal
<div className="flex items-center justify-center p-8">
  <ModelEmployee employees={employees} />
</div>

// Modal integrado
<ModalEmployee
  open={isModalOpen}
  onOpenChange={setIsModalOpen}
  services={services}
/>
```

##### Props do Componente
```typescript
interface EmployeePageClientProps {
  employees: EmployeeWithService[];     // Lista de funcionários
  services: Array<{                     // Serviços disponíveis
    id: string;
    name: string;
    price: number;
  }>;
}
```

##### Exemplo de Uso
```typescript
// Em server component
const employees = await getInfoEmployee({ userId });
const services = await getUserServices(userId);

return (
  <EmployeePageClient
    employees={employees}
    services={services}
  />
);
```

## 🏠 16. Landing Page - Área Pública

### 16.1 Página Inicial

**Localização**: `app/(public)/page.tsx`

**Descrição**: Landing page completa do sistema Agenda com trial gratuito de 30 dias, apresentando funcionalidades implementadas, notificações automáticas e benefícios do sistema de agendamento online.

#### Estrutura da Página (9 seções)

##### 1. Header Fixo
- Logo e título do sistema
- Botão de login/acesso ao dashboard (condicional via `useAuth`)
- Header sticky com backdrop blur

##### 2. Seção Hero + Carrossel
- Badge de trial: "Teste grátis por 30 dias — todas as funcionalidades!"
- Título principal com destaque
- Descrição mencionando agendamento público e autogestão
- Carrossel de imagens (formato webp) com 5 categorias profissionais
- Rotação automática a cada 4 segundos com indicadores acessíveis
- CTA: "Testar Grátis por 30 Dias" ou "Acessar Dashboard"

##### 3. Como Funciona (3 passos)
1. **Cadastre-se e Configure** — Conta gratuita, serviços, funcionários e horários
2. **Compartilhe seu Link** — Via WhatsApp, redes sociais ou cartão de visitas
3. **Gerencie no Dashboard** — Agendamentos, faturamento, lembretes e notificações

##### 4. Destaque - Notificações Automáticas
- Card com borda verde destacando WhatsApp instantâneo e Email detalhado
- Confirmação, cancelamento e reagendamento automáticos

##### 5. Funcionalidades Principais (9 cards)
Grid 3x3 com imagem + ícone + título + descrição:
1. **Agendamentos Inteligentes** — Calendário mensal e agenda diária
2. **Gestão de Agendamentos** — Editar, cancelar, reagendar com histórico
3. **Validação de Conflitos** — Prevenção automática de sobreposição
4. **Link de Agendamento** — Página pública via link compartilhável
5. **Autogestão pelo Cliente** — Cancelar/reagendar sem login
6. **Gestão de Serviços** — CRUD com preço, duração e profissionais
7. **Gestão de Funcionários** — CRUD com serviços e horários
8. **Dashboard Analítico** — Estatísticas, alertas e tarefas
9. **Horários e Feriados** — Configuração por dia e gestão de folgas

##### 6. Benefícios (4 itens)
- **Seguro e Confiável** — Autenticação robusta com OTP e rate limiting
- **Rápido e Eficiente** — Interface otimizada e carregamento rápido
- **Agendamento sem Login** — Clientes agendam pelo link sem criar conta
- **Fácil de Usar** — Configure e comece a usar em minutos

##### 7. Call to Action Final
- Gradiente primary com destaque
- CTA: "Começar Grátis — 30 Dias sem Compromisso"
- Subtexto: "Sem cartão de crédito. Cancele quando quiser."

##### 8. Formulário de Contato
- Card com campos Nome, Email, Mensagem
- Envio via `POST /api/contact`
- Botão com aria-label e touch target de 44px

##### 9. Footer
- Logo "Agenda"
- Copyright com ano dinâmico

#### Funcionalidades Técnicas
- Imagens webp otimizadas (reducão de ~800KB para ~96KB)
- Touch targets mínimos de 44px em todos os botões
- Padding responsivo (py-16 sm:py-20) em todas as seções
- Acessibilidade: aria-labels, role="tablist", aria-selected no carrossel

#### Dependências
- `useAuth`: Estado de autenticação no cliente
- `next/image`: Otimização de imagens
- Componentes UI: Button, Card, Input, Label, Textarea
- Ícones: Calendar, Sparkles, Link2, UserCog, Scissors, Share2, LayoutDashboard e outros

### 16.2 Server Action - Autenticação

**Localização**: `app/(public)/_actions/login.ts`

**Função**: `handleRegister`

#### Funcionalidades
- ✅ Autenticação via GitHub OAuth
- ✅ Redirecionamento automático para dashboard após login
- ✅ Integração com JWT

#### Parâmetros
```typescript
{
  provider: string;  // "github"
}
```

#### Exemplo
```typescript
import { handleRegister } from "@/app/(public)/_actions/login";

await handleRegister('github');
// Redireciona automaticamente para /dashboard após login
```

---

## 🔒 17. Bloqueios de Horário - Server Actions

### 17.1 Criar Bloqueio de Horário

**Ação**: `createBlockedTime`

**Localização**: `app/(panel)/dashboard/schedule/blocked-time/_actions/create-blocked-time.ts`

#### Funcionalidades
- ✅ **Validação Zod**: date, time (HH:MM), motivation (3-500 chars), employeeId, userId
- ✅ **Verificação de propriedade**: Funcionário pertence ao usuário autenticado
- ✅ **Verificação de duplicatas**: Não permite bloqueio duplicado para mesmo funcionário/data/horário
- ✅ **Verificação de agendamentos**: Bloqueia criação se houver agendamento confirmado no horário
- ✅ **Revalidação de cache**: `/dashboard/schedule/blocked-time`

#### Parâmetros
```typescript
{
  date: Date;           // Data do bloqueio
  time: string;         // Horário no formato HH:MM
  motivation: string;   // Motivo do bloqueio (3-500 caracteres)
  employeeId: string;   // ID do funcionário
  userId: string;       // ID do usuário (empresa)
}
```

### 17.2 Deletar Bloqueio de Horário

**Ação**: `deleteBlockedTime`

**Localização**: `app/(panel)/dashboard/schedule/blocked-time/_actions/delete-blocked-time.ts`

#### Funcionalidades
- ✅ **Autenticação**: Sessão JWT obrigatória
- ✅ **Verificação de propriedade**: Bloqueio pertence ao usuário autenticado
- ✅ **Verificação de existência**: Valida que o bloqueio existe antes de deletar
- ✅ **Revalidação de cache**: `/dashboard/schedule/blocked-time`

#### Parâmetros
```typescript
{
  id: string;      // ID do bloqueio
  userId: string;  // ID do usuário (empresa)
}
```

---

---

**Última atualização**: 20/02/2026
**Arquitetura Atual**: Server Actions + JWT
**Status**: Base sólida implementada, pronto para expansão
**Versão Atual**: 0.9.0 (beta)
