# API Endpoints - Projeto Agenda

Atualizado conforme as rotas HTTP existentes em `app/api`.

## Autenticacao

- POST `/api/auth/register` - Registro de usuario com envio de OTP.
- POST `/api/auth/verify-otp` - Valida o codigo OTP enviado por email.
- POST `/api/auth/resend-otp` - Reenvia OTP com cooldown.
- POST `/api/auth/login` - Autentica usuario e cria tokens em cookies.
- POST `/api/auth/refresh` - Rotaciona refresh token e emite novo access token.
- POST `/api/auth/logout` - Revoga tokens e limpa cookies.
- POST `/api/auth/forgot-password` - Envia link de redefinicao por email.
- POST `/api/auth/reset-password` - Redefine senha usando token valido.
- POST `/api/auth/change-password` - Altera senha com sessao ativa.
- GET `/api/auth/me` - Retorna dados do usuario autenticado.

## Contato

- POST `/api/contact` - Recebe mensagem do formulario publico e envia email.

## Webhooks

- POST `/api/webhook/appointment` - Repassa payload para webhook N8N.
