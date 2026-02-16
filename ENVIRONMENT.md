# 📝 Configuração de Ambiente - Agenda System

**Última atualização**: 16/02/2026  
**Versão**: 0.9.0 (beta)

## 📋 Visão Geral

Este documento descreve todas as variáveis de ambiente necessárias para configurar o sistema Agenda. As variáveis são organizadas por categoria (obrigatórias, opcionais, produção, desenvolvimento) e incluem exemplos práticos e troubleshooting.

## 🎯 Objetivo

O arquivo `ENVIRONMENT.md` serve como referência completa para:
- ✅ **Configuração inicial**: Setup do ambiente de desenvolvimento
- ✅ **Deploy**: Configuração de variáveis em produção
- ✅ **Integrações**: Configuração de serviços externos (N8N, Stripe, etc.)
- ✅ **Troubleshooting**: Solução de problemas comuns
- ✅ **Segurança**: Boas práticas de gerenciamento de variáveis

## 📋 Como Configurar

1. **Crie um arquivo `.env.local`** na raiz do projeto
2. **Copie as variáveis** abaixo e configure os valores adequados
3. **Nunca commita** o arquivo `.env.local` no repositório

```bash
# Crie o arquivo .env.local manualmente
touch .env.local
# Copie as variáveis listadas abaixo e configure os valores adequados
# Consulte a seção "Exemplo Completo" no final deste documento
```

## 🔧 Variáveis Obrigatórias

### Banco de Dados
```env
# URL de conexão com PostgreSQL
# Formato: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://username:password@localhost:5432/agenda_db"
```

### Autenticação JWT
```env
# Chave secreta para assinar access tokens
# Gere uma chave segura: openssl rand -base64 32
JWT_SECRET="your-super-secret-key-here"

# Chave secreta para assinar refresh tokens
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
```

## 💡 Variáveis Opcionais

### URL Pública
```env
# URL base para links enviados por email (reset de senha)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Stripe (Pagamentos) - ⚠️ Planejado para v1.0
```env
# Chaves do Stripe para processamento de pagamentos
# NOTA: Integração Stripe ainda não implementada. Variáveis reservadas para uso futuro.
# STRIPE_PUBLIC_KEY="pk_test_your-stripe-public-key"
# STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
# STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### Email (Notificações)
```env
# Mailtrap Sending (Produção)
MAILTRAP_API_KEY="sua-chave-mailtrap"
MAILTRAP_SENDER_EMAIL="no-reply@seu-dominio.com"
MAILTRAP_SENDER_NAME="Agenda"

# SMTP (fallback/local)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Agenda <your-email@gmail.com>"
```

### Contato (Formulário do Site)
```env
# Email principal de destino do formulário de contato
# Obrigatório para o funcionamento da rota /api/contact
CONTACT_EMAIL_TO="seu-email@dominio.com"

# Email de cópia (opcional)
# Se configurado, uma cópia do email de contato é enviada para este endereço
CONTACT_EMAIL_CC="copia@dominio.com"
```

## 📊 Variáveis de Produção

### Ambiente
```env
# Ambiente de execução (gerenciado automaticamente pelo Next.js)
NODE_ENV="production"
```

### Monitoramento - ⚠️ Planejado para v1.0
```env
# NOTA: Variáveis reservadas para uso futuro.
# DATABASE_URL_WITH_ACCELERATE="your-accelerate-connection-string"  # Prisma Accelerate
# NEXT_PUBLIC_VERCEL_ANALYTICS="true"                                # Vercel Analytics
# SENTRY_DSN="your-sentry-dsn"                                       # Sentry (erros)
```

## 🌐 Variáveis Públicas

> **⚠️ Importante**: Variáveis com prefixo `NEXT_PUBLIC_*` são expostas ao cliente (frontend).  
> **Nunca** coloque informações sensíveis (chaves secretas, tokens) em variáveis públicas.

### Aplicação
```env
# URL base da aplicação (usado para links absolutos e CORS)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Variáveis reservadas (não utilizadas atualmente no código)
# NEXT_PUBLIC_APP_NAME="Agenda"
# NEXT_PUBLIC_APP_VERSION="0.9.0"
```

### Webhook N8N (Agendamentos)
```env
# URL base para webhook N8N de agendamentos
# Será chamado via POST após a confirmação de um agendamento
# O sistema usa esta URL para enviar dados de agendamentos para automação
# 
# Formato: https://seu-n8n.com/webhook/appointments
# Exemplo: https://n8n.exemplo.com/webhook/agendamentos
#
# ⚠️ Esta variável é OBRIGATÓRIA se você usar a funcionalidade de webhook
# Se não configurada, o sistema continuará funcionando, mas não enviará dados para N8N
NEXT_PUBLIC_BASE_N8N="https://seu-n8n.com/webhook/appointments"
```

#### Estrutura do Payload Enviado
```typescript
{
  name: string;              // Nome do cliente
  email: string;              // Email do cliente
  phone: string;              // Telefone do cliente
  appointmentDate: string;   // Data do agendamento (ISO)
  time: string;               // Horário (HH:MM)
  services: Array<{          // Serviços agendados
    name: string;
    price: number;
    duration: number;
    employee: string;
  }>;
}
```

#### Exemplo de Uso
```typescript
// O sistema automaticamente envia para o webhook após criar agendamento
// Não é necessário fazer nada manualmente
// A URL é obtida de: process.env.NEXT_PUBLIC_BASE_N8N
```

## 🔐 Segurança

### Boas Práticas

- ✅ **Nunca commita** arquivos `.env*` no repositório
  - Adicione `.env*` ao `.gitignore`
  - Use `.env.example` como template (sem valores reais)
- ✅ **Chaves secretas fortes**: Use geradores seguros para `JWT_SECRET` e `JWT_REFRESH_SECRET`
- ✅ **Permissões de arquivo**: Configure permissões adequadas (600 ou 640)
- ✅ **Ambientes separados**: Use variáveis diferentes para desenvolvimento/produção
- ✅ **Rotação de chaves**: Troque chaves secretas periodicamente
- ✅ **Validação**: Verifique se todas as variáveis obrigatórias estão configuradas

### Checklist de Segurança

Antes de fazer deploy em produção, verifique:

- [ ] Todas as variáveis obrigatórias estão configuradas
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` foram gerados com `openssl rand -base64 32`
- [ ] `DATABASE_URL` usa credenciais fortes
- [ ] Variáveis sensíveis não estão em `NEXT_PUBLIC_*`
- [ ] Arquivo `.env.local` está no `.gitignore`
- [ ] Variáveis de produção são diferentes das de desenvolvimento

## 🐛 Troubleshooting

### Erro: "JWT_SECRET is required"
```bash
# Gere uma chave secreta
openssl rand -base64 32
```
Configure o resultado em `JWT_SECRET` e `JWT_REFRESH_SECRET`

### Erro: "Database connection failed"
- Verifique se o PostgreSQL está rodando
- Confirme a string de conexão `DATABASE_URL`
- Teste a conexão: `psql $DATABASE_URL`

### Erro: "SMTP connection failed"
- Verifique as credenciais SMTP
- Para Gmail, use "App Passwords" ao invés da senha normal
- Verifique se o servidor SMTP está acessível (firewall, porta)

### Erro: "NEXT_PUBLIC_BASE_N8N não está configurado"
- Configure a variável `NEXT_PUBLIC_BASE_N8N` no arquivo `.env.local`
- Verifique se a URL do webhook N8N está correta
- Teste a URL manualmente com uma requisição POST
- Se não usar webhook, o sistema continuará funcionando normalmente

### Erro: "Webhook retornou status XXX"
- Verifique se o webhook N8N está ativo e funcionando
- Confirme que a URL está correta
- Verifique os logs do N8N para mais detalhes
- Erros são tratados internamente e retornados como resposta HTTP

## 📚 Recursos Adicionais

### Documentação Oficial
- [JWT](https://jwt.io/) - Autenticação com tokens
- [Prisma Documentation](https://www.prisma.io/docs) - ORM e banco de dados
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Banco de dados
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) - Variáveis de ambiente

### Guias e Tutoriais
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [N8N Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - Configuração de webhooks

## 🔄 Comandos Úteis

### Verificação e Testes
```bash
# Testar conexão com banco de dados
npx prisma db push

# Verificar variáveis de ambiente (Linux/Mac)
printenv | grep -E "(DATABASE|JWT|SMTP|MAILTRAP|N8N)"

# Verificar variáveis de ambiente (Windows PowerShell)
Get-ChildItem Env: | Where-Object { $_.Name -match "DATABASE|JWT|SMTP|MAILTRAP|N8N" }

# Validar schema do Prisma
npx prisma validate

# Gerar cliente Prisma
npx prisma generate
```

### Limpeza e Reset
```bash
# Limpar cache Next.js
rm -rf .next && npm run build

# Resetar banco de dados (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Aplicar migrações
npx prisma migrate dev
```

### Geração de Chaves
```bash
# Gerar JWT_SECRET
openssl rand -base64 32

# Gerar chave aleatória (alternativa)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📋 Checklist de Configuração

### Desenvolvimento
- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] `DATABASE_URL` configurado e testado
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` gerados e configurados
- [ ] `NEXT_PUBLIC_BASE_URL` configurado (http://localhost:3000)
- [ ] `NEXT_PUBLIC_BASE_N8N` configurado (se usar webhook)
- [ ] SMTP configurado para envio de OTP/reset
- [ ] Teste de conexão com banco bem-sucedido

### Produção
- [ ] Todas as variáveis obrigatórias configuradas
- [ ] `NEXT_PUBLIC_BASE_URL` aponta para URL de produção
- [ ] `DATABASE_URL` usa banco de produção
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` diferentes do desenvolvimento
- [ ] Variáveis sensíveis não expostas no frontend
- [ ] Webhook N8N configurado e testado

## 🎓 Exemplo Completo de `.env.local`

```env
# ============================================
# BANCO DE DADOS (Obrigatório)
# ============================================
DATABASE_URL="postgresql://usuario:senha@localhost:5432/agenda_db"

# ============================================
# AUTENTICAÇÃO (Obrigatório)
# ============================================
JWT_SECRET="sua-chave-secreta-gerada-com-openssl"
JWT_REFRESH_SECRET="sua-chave-refresh-gerada-com-openssl"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# ============================================
# EMAIL (Obrigatório para OTP/Reset)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"
SMTP_FROM="Agenda <seu-email@gmail.com>"

# ============================================
# CONTATO (Obrigatório para formulário de contato)
# ============================================
CONTACT_EMAIL_TO="seu-email@dominio.com"
CONTACT_EMAIL_CC="copia@dominio.com"

# ============================================
# WEBHOOK N8N (Opcional, mas recomendado)
# ============================================
NEXT_PUBLIC_BASE_N8N="https://seu-n8n.com/webhook/appointments"

# ============================================
# APLICAÇÃO (Opcional)
# ============================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
