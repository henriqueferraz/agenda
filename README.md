# 📅 Agenda - Sistema de Agendamento Online

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2.0-green)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)](https://tailwindcss.com/)

Sistema completo de agendamento online para profissionais de serviços (barbearias, salões, pet shops, etc.). Permite gerenciar agendamentos, clientes, serviços e configurações de forma eficiente.

## 🧭 Sumário

- [Atualização](#-atualização)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [Rotas](#-rotas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Documentação](#-documentação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Licença](#-licença)
- [Suporte](#-suporte)

## 📋 Atualização

**Data da última atualização**: 15/01/2025  
**Versão**: 1.0.2 (beta)
**Autor**: Henrique Ferraz (henriqueferraz@ofnet.com.br)
**Site**: www.hferraz.com.br (em desenvolvimento)

## 🚀 Funcionalidades Principais

### ✅ **Implementado**
- 🔐 **Autenticação**: JWT + bcrypt + cookies httpOnly + OTP de email
- 👤 **Perfis**: ✅ Sistema completo PF/PJ com abas e validações oficiais
- 🏢 **Atividades**: ✅ Seleção obrigatória de categoria profissional (5 tipos)
- 📍 **Endereço**: ✅ Cadastro completo com busca automática por CEP
- ⏰ **Horários**: ✅ Configuração completa por dia da semana
- 👥 **Funcionários**: ✅ CRUD completo com relacionamento many-to-many com serviços
- 📋 **Serviços**: ✅ CRUD completo com formatação de preço (reais/centavos) e duração
- ⏰ **Horários de Funcionários**: ✅ Configuração de horários de trabalho por dia da semana
- 📅 **Agendamentos**: ✅ Sistema completo de agendamentos com calendário mensal e agenda diária
- 🎉 **Feriados**: ✅ Sistema de gestão de feriados (dias de parada) com verificação de agendamentos
- 📊 **Dashboard**: ✅ Dashboard com estatísticas em tempo real (agendamentos, clientes, receita)
- 🔔 **Notificações de Agendamentos**: ✅ Card de alerta para novos agendamentos com verificação periódica
- 📅 **Agenda Diária no Dashboard**: ✅ Card completo com lista detalhada de agendamentos do dia
- 📋 **Tarefas/Lembretes**: ✅ Sistema completo de gerenciamento de tarefas (CRUD)
- 🔗 **Webhook N8N**: ✅ Integração com webhook para envio de dados de agendamentos (uma mensagem por serviço, intervalo de 5s)
- 💰 **Assinaturas**: Planos BASIC e PROFESSIONAL estruturados

### 🔄 **Em Desenvolvimento**
- 📱 **Mobile App**: Aplicativo mobile complementar
- 📊 **Dashboard**: Relatórios e estatísticas
- 💳 **Pagamentos**: Integração Stripe
- 📧 **Notificações**: Email/SMS automáticos
- 📅 **Calendário**: Interface visual de agendamentos

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Next.js 16**: React framework com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework CSS utilitário
- **Radix UI**: Componentes acessíveis
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de dados

### **Backend**
- **Next.js API Routes**: Backend integrado
- **JWT + Bcrypt**: Autenticação segura com cookies httpOnly
- **Prisma ORM**: Mapeamento objeto-relacional
- **PostgreSQL**: Banco de dados relacional

### **Infraestrutura**
- **Vercel**: Deploy e hosting
- **Stripe**: Processamento de pagamentos
- **Prisma Accelerate**: Cache de queries

## 📋 Pré-requisitos

- **Node.js**: 18.17.0 ou superior
- **PostgreSQL**: 15 ou superior
- **npm/yarn/pnpm**: Gerenciador de pacotes

## 🚀 Instalação e Execução

### 1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/agenda.git
cd agenda
```

### 2. **Instale as dependências**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. **Configure o banco de dados**
```bash
# Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env.local

# Configure as variáveis no .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/agenda_db"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"
SMTP_FROM="Agenda <seu-email@gmail.com>"
```

### 4. **Execute as migrações do Prisma**
```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma migrate dev
```

### 5. **Execute o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

### 6. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🛣️ Rotas

### **Aplicação (App Router)**

**Área pública (landing e autenticação)**:
- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/agendamento/[token]`

**Área logada (painel)**:
- `/dashboard`
- `/dashboard/dashboard`
- `/dashboard/configurations/activity`
- `/dashboard/configurations/address`
- `/dashboard/configurations/model`
- `/dashboard/configurations/security`
- `/dashboard/configurations/time`
- `/dashboard/schedule/calendar`
- `/dashboard/schedule/stopday`
- `/dashboard/services/employee`
- `/dashboard/services/service`

### **API (Routes)**

**Autenticação**:
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET /api/auth/me`

**Webhooks**:
- `POST /api/webhook/appointment`

**Detalhes completos**: `endpoints.md`

## 📁 Estrutura do Projeto

```
├── app/                    # Next.js App Router
│   ├── (panel)/           # Área logada (Dashboard)
│   ├── (public)/          # Área pública (Landing Page)
│   └── api/               # API Routes
├── components/            # Componentes React reutilizáveis
├── lib/                   # Utilitários e configurações
├── prisma/                # Schema e migrações do banco
├── utils/                 # Utilitários específicos
├── types/                 # Definições de tipos TypeScript
├── hooks/                 # Hooks customizados
└── public/                # Arquivos estáticos
```

## 🗄️ Banco de Dados

### **Modelo de Dados**
```sql
-- Usuários
User {
  id, name, email, activity, cpf, cnpj, phone, address, status
  services[], appointments[], reminders[], subscription
}

-- Serviços
Service {
  id, name, price (centavos), duration (minutos), status, userId
  employees[] (many-to-many via EmployeeService)
}

-- Funcionários
Employee {
  id, name, email, phone, function, status, userId
  services[] (many-to-many via EmployeeService)
  mon_times[], tue_times[], wed_times[], thu_times[], fri_times[], sat_times[], sun_times[]
}

-- Relacionamento Many-to-Many
EmployeeService {
  id, employeeId, serviceId
}

-- Agendamentos
Appointment {
  id, name, email, phone, appointmentDate, time, userId, serviceId
}

-- Assinaturas
Subscription {
  id, status, plan, priceId, userId
}
```

### **Comandos Prisma**
```bash
# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Resetar banco (desenvolvimento)
npx prisma migrate reset

# Visualizar schema
npx prisma studio
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm start           # Servidor de produção

# Qualidade de código
npm run lint        # Verificar linting
npm run type-check  # Verificar tipos TypeScript

# Banco de dados
npm run db:generate # Gerar cliente Prisma
npm run db:migrate  # Executar migrações
npm run db:studio   # Abrir Prisma Studio
npm run db:reset    # Resetar banco de dados
```

## 📚 Documentação

- **[Contexto do Projeto](CONTEXTO_PROJETO.md)**: Visão geral e arquitetura
- **[Endpoints da API](endpoints.md)**: Documentação técnica da API
- **[Schema Prisma](prisma/schema.prisma)**: Modelo de dados
- **[Variáveis de Ambiente](ENVIRONMENT.md)**: Configuração do ambiente

### 📝 Padrão de Documentação

Todos os arquivos do projeto seguem um padrão consistente de documentação JSDoc:
- ✅ **Documentação completa**: Funcionalidades, fluxos, dependências
- ✅ **Tags JSDoc**: `@param`, `@returns`, `@example`, `@see`
- ✅ **Exemplos de código**: Blocos TypeScript/TSX
- ✅ **Estrutura padronizada**: Emojis, seções organizadas, formatação consistente

## 🔒 Variáveis de Ambiente

### **Obrigatórias**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/agenda_db"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Agenda <your-email@gmail.com>"
```

### **Opcionais**
```env
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 🧪 Testes

```bash
# Executar testes
npm run test

# Testes com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e
```

## 🚢 Deploy

### **Vercel (Recomendado)**
1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente
3. Deploy automático será executado

### **Outros provedores**
```bash
# Build de produção
npm run build

# Servidor de produção
npm start
```

## 📝 Licença

Este software é proprietário e licenciado para uso como SaaS recorrente. Veja o arquivo [LICENSE.md](LICENSE.md) para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas, entre em contato:
- **Email**: henriqueferraz@ofnet.com.br
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/agenda/issues)

---

**Agenda** © 2025. Desenvolvido com ❤️ para profissionais de serviços.
