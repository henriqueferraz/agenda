# Agenda - Sistema de Agendamento para Serviços

## 📋 Visão Geral

O **Agenda** é um sistema completo de agendamento online desenvolvido com Next.js 16, TypeScript, Prisma e PostgreSQL. O sistema permite que profissionais de serviços (barbearias, salões, pet shops, etc.) gerenciem seus agendamentos, clientes e serviços de forma eficiente.

## 📋 Atualização

Data da última atualização: 20/02/2026
Versão: 0.9.0 (beta)

## 🏗️ Arquitetura

### Tecnologias Principais
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, Radix UI (Themes)
- **Backend**: Next.js API Routes (Server Actions)
- **Banco de Dados**: PostgreSQL com Prisma ORM v7
- **Autenticação**: JWT + bcrypt + cookies httpOnly + OTP de email
- **Formulários**: React Hook Form + Zod
- **Pagamentos**: Stripe (planejado)
- **Deploy**: Vercel

## 📁 Estrutura do Projeto

### Diretórios Principais
```
├── app/                    # Next.js App Router
│   ├── (panel)/           # Área logada (Dashboard)
│   ├── (public)/          # Área pública
│   └── api/               # API Routes
├── components/            # Componentes React reutilizáveis
├── lib/                   # Utilitários e configurações
├── prisma/                # Schema e migrations do banco
├── utils/                 # Utilitários específicos
└── hooks/                 # Hooks customizados
```

## 🔧 Funcionalidades

### ✅ **Implementado**

#### 1. Sistema de Autenticação
- **Login**: Email e senha com JWT (access + refresh)
- **Registro**: Nome + email + senha com verificação via OTP
- **Sessões**: Cookies httpOnly com rotação de refresh token
- **Proteção**: Guard em páginas e server actions

#### 2. Gestão de Usuários
- **Perfil**: Edição completa de dados pessoais
- **Modelo de negócio**: Seleção entre Pessoa Física ou Jurídica
- **Nome Fantasia**: Campo opcional para nome comercial da empresa (disponível para PF e PJ)
- **Logo da Empresa**: Upload de logo em PNG ou JPG (max 1 MB) com preview e remoção
- **Documentos**: CPF/CNPJ com validação algorítmica (campos opcionais)
- **Telefone**: Formatação automática brasileira
- **Atividade**: Seleção de categoria profissional (Barbearia, Cabelereiro, etc.)

#### 3. Configurações do Sistema
- **Atividade**: ✅ Seleção de categoria profissional (Barbearia, Cabelereiro, Manicure, Maquiagem, Petshop)
- **Modelo Jurídico**: ✅ Sistema completo PF/PJ com validações CPF/CNPJ oficiais
- **Endereço**: ✅ Sistema completo com busca automática por CEP (ViaCEP/BrasilAPI)
- **Horários**: ✅ Configuração completa de horários por dia da semana
- **Funcionários**: ✅ Lista completa de funcionários com status e serviços + CRUD completo
- **Horários**: Interface preparada para configuração de disponibilidade
- **Serviços**: Interface preparada para gestão de serviços oferecidos
- **Dashboard**: Interface com estatísticas e cards informativos

#### 4. Validações e Formatação
- **CPF**: Validação algorítmica oficial + formatação automática
- **CNPJ**: Validação algorítmica oficial + formatação automática
- **Telefone**: Formatação brasileira (fixo/celular)
- **Formulários**: Validação Zod com mensagens personalizadas

#### 5. Design System
- **Tailwind CSS v4**: Framework CSS utilitário
- **Radix UI**: Componentes acessíveis e consistentes
- **Responsivo**: Interface adaptável para desktop e mobile
- **Tema**: Sistema de temas claro/escuro preparado

#### 6. Configurações Detalhadas (Implementado)

##### Sistema de Atividade Profissional
- **Seleção obrigatória** de categoria profissional
- **5 categorias disponíveis**: Barbearia, Cabelereiro, Manicure, Maquiagem, Petshop
- **Validação server-side** com lista permitida
- **Persistência automática** no perfil do usuário
- **Interface responsiva** com dropdown acessível

##### Sistema de Modelo Jurídico
- **Interface com abas**: Separação clara PF vs PJ
- **Nome Fantasia**: Campo opcional disponível em ambas as abas (PF e PJ)
- **Logo da Empresa**: Upload acima das abas (compartilhado PF/PJ), PNG/JPG até 1 MB, armazenamento local em `public/uploads/logos/`
- **Pessoa Física**: CPF obrigatório com validação algorítmica oficial
- **Pessoa Jurídica**: CNPJ obrigatório com validação algorítmica oficial
- **Campos dinâmicos**: Formulários específicos por tipo
- **Formatação automática**: Documentos e telefone em tempo real
- **Validação condicional**: Documentos obrigatórios apenas quando informados
- **Flexibilidade**: Permite mudança entre modelos

##### Sistema de Endereço Comercial
- **Busca automática por CEP**: Integração ViaCEP + BrasilAPI
- **Formatação automática**: CEP (00000-000) e estado maiúsculo
- **Campos obrigatórios**: Rua, número, bairro, cidade, estado, país
- **Campo opcional**: Complemento (apto, sala, andar)
- **Validação de UF**: Lista completa de estados brasileiros
- **Fallback de APIs**: Múltiplas fontes para busca de CEP
- **Responsividade**: Layout adaptável desktop/mobile
- **Persistência**: Dados salvos em tabela Address + referência no User

##### Sistema de Horários de Funcionamento
- **Configuração por dia**: Horários individuais para cada dia da semana
- **Interface visual**: Lista organizada com checkboxes de habilitação
- **Modais de edição**: Configuração detalhada de horários específicos
- **Cópia inteligente**: Replicação de horários entre dias selecionados
- **Validação de formato**: Horários no padrão HH:MM obrigatório
- **Ordenação automática**: Horários sempre salvos em ordem cronológica
- **Estado visual**: Badges indicando status (horários/fechado)
- **Responsividade**: Layout adaptável para desktop e mobile

#### 7. Sistema de Gestão de Funcionários (Implementado)
- **Tabela organizada**: Lista completa de funcionários em formato tabular
- **CRUD completo**: Criação, leitura, atualização e exclusão de funcionários
- **Formulário interativo**: Modal com validações em tempo real e feedback visual
- **Seleção de serviços**: Associação opcional com serviços existentes
- **Horários por dia**: Configuração individual de horários por funcionário
- **Validações robustas**: Email único, telefone formatado, campos obrigatórios
- **Estados de loading**: Feedback durante operações assíncronas
- **Revalidação automática**: Cache atualizado após criação
- **Relacionamento serviços**: Mostra serviço associado quando existir
- **Estados visuais**: Badges para funcionários ativos/inativos
- **Responsividade**: Layout adaptável desktop/mobile

#### 8. Sistema de Gestão de Serviços (Implementado)
- **CRUD completo**: Criação, edição, exclusão e listagem de serviços
- **Formatação de preço**: Exibição em reais (R$), armazenamento em centavos
- **Duração configurável**: Horas e minutos convertidos para minutos totais
- **Tabela responsiva**: Listagem com badges de status ativo/inativo
- **Modal de edição**: Formulário completo com validações em tempo real
- **Relacionamento many-to-many**: Múltiplos funcionários podem realizar múltiplos serviços
- **Validações robustas**: Nome, preço mínimo/máximo, duração mínima/máxima
- **Conversão automática**: Preço convertido de reais para centavos ao salvar

#### 9. Gestão de Agendamentos pelo Profissional (F-02 — Implementado)
- **Cancelamento**: Cancelar agendamento com motivo opcional, registra no AppointmentHistory
- **Reagendamento**: Mover para nova data/hora com validação F-01 (conflitos), exclui o próprio agendamento da verificação
- **Edição**: Alterar serviço, funcionário, data e horário com validações completas
- **Core compartilhado**: `app/_core/appointment-core.ts` com funções reutilizáveis por F-07 e F-08
- **Status**: Enum `AppointmentStatus` (confirmed/cancelled) no modelo Appointment
- **Histórico**: Tabela `AppointmentHistory` registrando todas as alterações (quem, quando, o quê, changes JSON)
- **UI**: Ícones de ação nos cards da agenda diária, modal de detalhes, dialogs de cancelamento/reagendamento/edição
- **Visual diferenciado**: Agendamentos cancelados em vermelho com texto tachado e badge "Cancelado"
- **Webhook**: Campo `type` (create/cancel/reschedule/edit) + campos padronizados (reason, oldDate, oldTime, newDate, newTime)
- **Testes**: 32 novos testes (cancel, reschedule, update, data-access, webhook) — total 470 testes

### 🔄 **Em Desenvolvimento**

#### 10. Assinaturas e Pagamentos
- **Planos**: BASIC e PROFESSIONAL (estrutura implementada no schema)
- **Stripe**: Integração de pagamentos (planejado)
- **Webhooks**: Processamento de eventos de pagamento (planejado)
- **Upgrade/Downgrade**: Mudança entre planos (planejado)

## 🎯 Rotas e Páginas

### Área Pública (`app/(public)`)
- **/**: ✅ Landing page completa com:
  - Badge de trial gratuito de 30 dias
  - Carrossel de imagens interativo (5 categorias profissionais, formato webp)
  - Seção Hero com título, descrição e CTA "Testar Grátis por 30 Dias"
  - Seção "Como Funciona" com 3 passos visuais (Cadastre-se, Compartilhe, Gerencie)
  - Destaque de Notificações Automáticas (WhatsApp e Email)
  - 9 funcionalidades principais com cards e imagens ilustrativas
  - 4 benefícios do sistema (Seguro, Rápido, Agendamento sem Login, Fácil)
  - Call to Action final com destaque de 30 dias grátis
  - Formulário de contato com validação e acessibilidade
  - Footer simplificado
  - Autenticação JWT + OTP por email
  - Layout totalmente responsivo com touch targets de 44px
- **API Auth**: `/api/auth/*` - Login, registro, OTP e sessões JWT
- **/login**: ✅ Login com email e senha
- **/register**: ✅ Registro com OTP por email
- **/forgot-password**: ✅ Solicitação de redefinição de senha
- **/reset-password**: ✅ Redefinição de senha via token

### Área Logada (`app/(panel)/dashboard`)
- **/**: ✅ Dashboard completo com:
  - Estatísticas em tempo real (agendamentos, clientes, receita)
  - Card de notificação de novos agendamentos (verificação a cada 30 min)
  - Agenda diária completa com lista detalhada de agendamentos
  - Lista de tarefas/lembretes (CRUD completo)
  - Ações rápidas para funcionalidades principais
- **/configurations/activity**: ✅ Seleção da atividade profissional
  - Formulário com 5 categorias pré-definidas
  - Validação obrigatória e server-side
  - Persistência automática no banco
- **/configurations/model**: ✅ Sistema completo PF/PJ com abas e validações
  - Campos dinâmicos baseados na seleção
  - Validação CPF/CNPJ algorítmica oficial
  - Formatação automática em tempo real
- **/configurations/address**: ✅ Cadastro completo de endereço com busca automática por CEP
- **/configurations/time**: ✅ Configuração completa de horários por dia da semana
- **/services/employee**: ✅ CRUD completo de funcionários
  - Tabela responsiva com listagem
  - Modal de criação/edição
  - Relacionamento many-to-many com serviços
  - Configuração de horários de trabalho por dia da semana
- **/services/service**: ✅ CRUD completo de serviços
  - Tabela responsiva com listagem
  - Modal de criação/edição
  - Formatação de preço (reais/centavos)
  - Configuração de duração (horas/minutos)
- **/schedule/calendar**: ✅ Sistema completo de agendamentos
  - Calendário mensal interativo
  - Agenda diária com agendamentos
  - Modal de criação de agendamentos
  - Verificação de disponibilidade
  - Integração com webhook N8N
  - Validação de feriados
- **/schedule/stopday**: ✅ Sistema de gestão de feriados
  - CRUD completo de feriados
  - Verificação de agendamentos existentes
  - Marcação visual no calendário
  - Bloqueio de agendamentos em feriados

### API Routes (`app/api`)
- **/api/auth/register**: Registro com OTP
- **/api/auth/verify-otp**: Verificação de email
- **/api/auth/resend-otp**: Reenvio de código OTP
- **/api/auth/login**: Login com JWT
- **/api/auth/refresh**: Rotação de refresh token
- **/api/auth/logout**: Logout (revogação)
- **/api/auth/forgot-password**: Solicitação de reset
- **/api/auth/reset-password**: Redefinição de senha
- **/api/auth/change-password**: Alteração de senha (logado)
- **/api/auth/me**: Dados do usuário autenticado
- **/api/webhook/appointment**: ✅ Proxy para webhook N8N de agendamentos
  - Envia uma mensagem por serviço agendado
  - Intervalo de 5 segundos entre mensagens
  - Inclui todas as informações: data formatada, descrição, horário e colaborador

## 🔗 Endpoints da API

### Autenticação
- `POST /api/auth/register`: Registro com email + OTP
- `POST /api/auth/verify-otp`: Verifica código de email
- `POST /api/auth/resend-otp`: Reenvia código OTP
- `POST /api/auth/login`: Login com email/senha
- `POST /api/auth/refresh`: Rotaciona refresh token
- `POST /api/auth/logout`: Revoga tokens e limpa cookies
- `POST /api/auth/forgot-password`: Solicita reset de senha
- `POST /api/auth/reset-password`: Confirma reset
- `POST /api/auth/change-password`: Atualiza senha
- `GET /api/auth/me`: Retorna usuário autenticado

## 📊 Modelo de Dados

### User (Usuário)
```typescript
{
  id: string;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  activity?: string; // Barbearia, Cabelereiro, etc.
  cpf?: string;        // Pessoa Física
  cnpj?: string;       // Pessoa Jurídica
  trade_name?: string; // Nome fantasia da empresa
  logo?: string;       // URL relativa do logo da empresa
  address?: string;
  phone?: string;
  status: boolean;
  stripe_customer_id?: string;
  times: string[];   // Horários disponíveis
  createdAt: Date;
  updatedAt: Date;
}
```

### Service (Serviço)
```typescript
{
  id: string;
  name: string;
  price: number;     // Em centavos
  duration: number;  // Em minutos
  status: boolean;
  UserId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Appointment (Agendamento)
```typescript
{
  id: string;
  name: string;      // Nome do cliente
  email: string;
  phone: string;
  appointmentDate: Date;
  time: string;
  userId: string;
  serviceId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription (Assinatura)
```typescript
{
  id: string;
  status: string;
  plan: Plans;       // BASIC | PROFESSIONAL
  priceId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Reminder (Lembrete/Tarefa)
```typescript
{
  id: string;
  description: string;  // Descrição da tarefa (1-500 caracteres)
  UserId: string;
  createdAt: Date;      // Ordenação: mais antigos primeiro
  updatedAt: Date;
}
```

## 🔧 Utilitários e Helpers

### Formatação e Validação de Dados (`utils/`)
- **`formatCPF.ts`**: Validação algorítmica completa + formatação automática
  - `formatCPF()`: Formatação e validação (XXX.XXX.XXX-XX)
  - `isCPFValid()`: Validação simples
  - `unformatCPF()`: Remove formatação
  - `maskCPF()`: Aplica máscara
  - `generateValidCPF()`: Gera CPF válido para testes

- **`formatCNPJ.ts`**: Validação algorítmica completa + formatação automática
  - `formatCNPJ()`: Formatação e validação (XX.XXX.XXX/XXXX-XX)
  - `isCNPJValid()`: Validação simples
  - `unformatCNPJ()`: Remove formatação
  - `maskCNPJ()`: Aplica máscara
  - `generateValidCNPJ()`: Gera CNPJ válido para testes

- **`formatPhone.ts`**: Formatação automática de telefones brasileiros
  - `formatPhone()`: Formatação (11) 99999-9999 / (11) 3333-4444
  - `unformatPhone()`: Remove formatação
  - `isValidPhone()`: Validação de formato
  - `getPhoneType()`: Identifica fixo/celular

### Utilitários de Data e Timezone (`utils/date-timezone.ts`)
- **`getDateComponentsInSaoPaulo()`**: Extrai componentes de data no timezone America/Sao_Paulo
- **`createDateInSaoPaulo()`**: Cria data a partir de componentes no timezone correto
- **`getNowInSaoPaulo()`**: Data/hora atual no timezone America/Sao_Paulo
- **`startOfDayInSaoPaulo()`**: Início do dia (00:00:00)
- **`endOfDayInSaoPaulo()`**: Fim do dia (23:59:59.999)
- **`compareDatesInSaoPaulo()`**: Compara duas datas normalizadas
- **`isTodayInSaoPaulo()`**: Verifica se é hoje
- **`isPastInSaoPaulo()`**: Verifica se é passado
- **`formatDateInSaoPaulo()`**: Formata data em português brasileiro
- **`formatDateTimeInSaoPaulo()`**: Formata data e hora em português brasileiro

### Utilitários de CEP (`utils/cep.ts`)
- **`searchCep()`**: Busca endereço por CEP (ViaCEP + BrasilAPI como fallback)
- **`formatCepDisplay()`**: Formata CEP para exibição (00000-000)
- **Interfaces**: `AddressData`, `CepResponse`

### Utilitários Gerais (`lib/utils.ts`)
- **`cn()`**: Combinação otimizada de classes Tailwind CSS
- **`formatCurrency()`**: Formatação monetária (R$ X.XXX,XX)
- **`formatDate()`**: Formatação de datas em português brasileiro
- **`capitalize()`**: Capitalização de strings
- **`normalizeString()`**: Remove acentos e caracteres especiais
- **`slugify()`**: Geração de slugs URL-friendly
- **`truncate()`**: Truncamento de strings com ellipsis
- **`isValidEmail()`**: Validação de emails
- **`generateId()`**: Geração de IDs únicos

### Autenticação e Segurança (`lib/`)
- **`auth.ts`**: Helpers de autenticação JWT (cookies httpOnly) - `getUserFromToken()` e `getUserFromRequest()`
- **`auth-cookies.ts`**: Utilitários para gerenciamento de cookies de autenticação (set/clear tokens)
- **`jwt.ts`**: Geração e verificação de tokens JWT (access + refresh)
- **`password.ts`**: Hashing e verificação de senhas com bcrypt
- **`password-policy.ts`**: Validação de política de senhas (comprimento, complexidade)
- **`tokens.ts`**: Geração e validação de tokens genéricos (OTP, reset)
- **`rate-limit.ts`**: Rate limiting de requisições por IP e email
- **`security-log.ts`**: Logging de ações de segurança (login, logout, tentativas)
- **`email.ts`**: Envio de emails transacionais (OTP, reset de senha, contato)
- **`getSession.ts`**: Helper para obter usuário autenticado em Server Components

### Database (`lib/`)
- **`prisma.ts`**: Cliente Prisma com singleton pattern e desconexão graceful
- **Tipos gerados**: User, Service, Appointment, Subscription, Reminder, Address, SecurityLog, etc.

## 🚀 Funcionalidades Planejadas

### Próximas Implementações
1. **Integração Stripe**: Pagamentos online
2. **Sistema de notificações**: Email/SMS automáticos para lembretes
3. **Relatórios avançados**: Dashboard analítico com métricas detalhadas
4. **Exportação de dados**: CSV/PDF
5. **Mobile App**: Aplicativo mobile complementar
6. **API pública**: Endpoints para integrações externas

### Melhorias Futuras
1. **Multi-tenant**: Suporte a múltiplos estabelecimentos
2. **Fidelização**: Sistema de pontos/descontos
3. **Integrações**: WhatsApp, Google Calendar, etc.
4. **Filtros e busca**: Filtros avançados nas tabelas de serviços e funcionários

## 📝 Convenções do Código

### Padrões de Commit
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação/código
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

### Estrutura de Componentes
- Componentes em `/components`
- Páginas em `/app`
- Utilitários em `/lib` e `/utils`
- Tipos em `/types`

### Validações
- CPF/CNPJ com algoritmos oficiais
- Campos obrigatórios validados no frontend
- Sanitização de dados de entrada

## 🔒 Segurança

### Autenticação
- JWT + bcrypt com OTP e refresh token
- Sessões seguras
- Proteção CSRF

### Autorização
- Middleware de autenticação
- Validação de permissões por rota

### Dados
- Sanitização de inputs
- Validação de dados no backend
- Proteção contra SQL injection via Prisma

## 🧪 Testes

### Estratégia de Testes
- Testes unitários para utilitários (CPF, CNPJ, etc.)
- Testes de integração para API routes
- Testes E2E para fluxos críticos
- Cobertura mínima de 80%

### Ferramentas
- Jest para testes unitários
- React Testing Library para componentes
- Playwright/Cypress para E2E

## 📦 Deploy e CI/CD

### Ambiente de Produção
- **Plataforma**: Vercel
- **Banco**: PostgreSQL (Neon/Supabase)
- **CDN**: Vercel Edge Network
- **Monitoramento**: Vercel Analytics

### Pipeline CI/CD
1. **Lint**: ESLint + Prettier
2. **Type Check**: TypeScript
3. **Tests**: Jest
4. **Build**: Next.js
5. **Deploy**: Vercel (automático)

## 🤝 Contribuição

### Processo de Desenvolvimento
1. Criar branch feature/fix
2. Implementar mudanças
3. Adicionar testes
4. Criar PR com descrição detalhada
5. Code review
6. Merge após aprovação

### Requisitos
- TypeScript obrigatório
- ESLint sem erros
- Testes passando
- Documentação atualizada

## 📊 Status do Projeto

### ✅ **Implementado (100%)**
- **Autenticação**: JWT + bcrypt + OTP por email
- **Perfis**: Pessoa Física e Jurídica com validações
- **Formatação**: CPF, CNPJ e telefone brasileiros
- **UI/UX**: Design system completo e responsivo
- **Validações**: Formulários com Zod e mensagens personalizadas
- **Documentação**: JSDoc completa em todos os arquivos
- **Estrutura**: Arquitetura sólida e bem organizada
- **Endereço**: Cadastro completo com busca automática por CEP
- **Horários**: Configuração completa por dia da semana
- **Funcionários**: CRUD completo com relacionamento many-to-many
- **Serviços**: CRUD completo com formatação de preço e duração
- **Horários de Funcionários**: Configuração de horários de trabalho
- **Agendamentos**: Sistema completo com calendário mensal e agenda diária
- **Feriados**: Gestão de dias de parada com verificação de agendamentos
- **Dashboard**: Estatísticas em tempo real (agendamentos, clientes, receita)
- **Notificações de Agendamentos**: Card de alerta para novos agendamentos
- **Agenda Diária**: Card completo com lista detalhada de agendamentos do dia
- **Tarefas/Lembretes**: Sistema completo de gerenciamento de tarefas (CRUD)
- **Webhook N8N**: Integração com webhook para envio de dados de agendamentos
- **Agendamento Público**: Página pública de agendamento via token
- **Gestão de Agendamentos (F-02)**: Editar, cancelar e reagendar agendamentos pelo profissional com core compartilhado, histórico e UI completa
- **CRUD Serviços**: Criação, edição, exclusão e listagem de serviços
- **CRUD Funcionários**: Gestão completa de funcionários com horários por dia
- **Formulário de Contato**: Envio de email via API `/api/contact`

### 🔄 **Planejado**
- **Pagamentos**: Integração Stripe (estrutura no schema pronta)
- **Notificações**: Email/SMS automáticos para lembretes
- **Relatórios avançados**: Dashboard analítico com métricas detalhadas
- **Exportação de dados**: CSV/PDF
- **Mobile App**: Aplicativo mobile complementar
- **Filtros e busca**: Filtros avançados nas tabelas

---

**Status do Projeto**: ✅ **Base sólida implementada, pronto para expansão**
**Versão Atual**: 0.9.0 (beta)
**Arquivos Documentados**: 100% (padrão JSDoc padronizado)
**Última Atualização**: 20/02/2026
