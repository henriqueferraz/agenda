# 12 — Autenticação e Segurança

> Controles de acesso, validação e hardening  
> Atualizado: 2026-07-31

---

## 1. Autenticação (v1 — decisão fechada)

- Django Authentication (`AbstractUser` ou custom User)
- **Sessão** em cookie `HttpOnly` + `Secure` + `SameSite=Lax` (Lax permite links de e-mail/booking; Strict só se não houver fluxo cross-site necessário)
- **Rotação de sessão no login** — regenerar session key após autenticação (anti session fixation)
- CSRF obrigatório em mutações (incluindo headers HTMX)
- Logout invalida sessão server-side
- **Sem JWT / RefreshToken na v1**

### Fluxos

1. **Register** → cria user não verificado → OTP e-mail → verify → libera login  
2. **Login** → rate limit + lockout → **nova sessão** → painel  
3. **Forgot/Reset** → token **hasheado**, TTL curto, single-use  
4. **Change password** → exige senha atual + invalida outras sessões se possível  
5. **Contato (landing)** → e-mail via SMTP (`CONTACT_EMAIL_TO`), com rate limit  

### Anti-enumeração de contas

Respostas **genéricas** (mesmo status/mensagem) em:

- register (e-mail já existente)
- forgot password
- resend OTP

Texto típico: “Se o e-mail existir, enviamos as instruções.” Sem revelar se a conta existe.

### Política de senha (v1)

- Comprimento mínimo **≥ 12**
- Validadores Django (`UserAttributeSimilarityValidator`, `CommonPasswordValidator`, `NumericPasswordValidator`)
- Opcional: checagem de senha vazada (ex.: Have I Been Pwned / pacote equivalente)
- Hash: **Argon2** preferencial (ou PBKDF2 Django)

---

## 2. Autorização

| Camada | Regra |
|---|---|
| Login required | `@login_required` / mixin em `/dashboard/**` |
| Ownership | object-level: `obj.user_id == request.user.id` |
| Role | `master` para rotas admin |
| Trial | middleware em `accounts`: `trial_ends_at` + plano ≠ pago → upgrade |

Nunca autorizar com ID enviado pelo cliente sem checar sessão.

**Testes negativos multi-tenant (obrigatórios no CI):** usuário A não lê nem muta Service/Employee/Appointment/Client de B.

---

## 3. Tokens e superfície pública

Maior risco do produto: booking + autogestão + cron **sem login**.

| Token | Armazenamento | Regras |
|---|---|---|
| `management_token` | **Em claro** (lookup por URL) | Alta entropia (`secrets`); único; comparação timing-safe; rate limit em cancel/reagendar |
| `token_called` / código curto `/a/<code>` | conforme modelo | Não enumerável (espaço grande); sem listagem pública |
| OTP / reset | **Hasheado** | TTL + tentativas + single-use |

1. Não aceitar tokens curtos/previsíveis.  
2. Rate limit agressivo nas rotas `/agendamento/gerenciar/**` e booking público.  
3. Erros opacos (“link inválido ou expirado”) — sem detalhar o motivo interno.  

---

## 4. Validação de entrada

- Django Forms / ModelForms + validators custom (CPF, CNPJ, phone, HH:MM)
- Preferir validação server-side sempre; client-side só UX
- Rejeitar payloads inesperados (extra fields)
- Queries via ORM; SQL raw só parametrizado e excepcional

---

## 5. Rate limiting

Aplicar em:

- login / register / OTP / reset
- booking público
- autogestão por `management_token`
- contato
- cron (token compartilhado)

Persistência: cache Redis ou tabela (como legado `IpRateLimit` / `LoginAttempt`).

---

## 6. Segredos, proxy e criptografia

- `DJANGO_SECRET_KEY` forte e distinta por ambiente
- Tokens OTP/reset: `secrets.token_*` + hash em storage
- Webhooks / cron: HMAC-SHA256 + auth header; **comparação timing-safe** dos secrets
- Cron: preferir allowlist de IP do host agendador, além do token
- Atrás de reverse proxy: configurar `SECURE_PROXY_SSL_HEADER` e IPs confiáveis — senão HTTPS/IP do cliente ficam errados
- Headers de IP: preferir `X-Real-IP` (ou hop do proxy conhecido) sobre primeiro hop não confiável de `X-Forwarded-For`

---

## 7. Headers e superfície de ataque

- HTTPS only em produção + HSTS
- `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS=DENY`
- **Content-Security-Policy** adequada ao HTMX (evitar `unsafe-inline` amplo; nonces/hashes quando possível)
- **Referrer-Policy** restritiva (ex.: `same-origin` ou `strict-origin-when-cross-origin`)
- Sem expor `DEBUG` em produção
- Admin Django desabilitado em prod ou IP-restricted + 2FA
- Sanitizar HTML se houver conteúdo rico

### Upload de logo

- MIME/tamanho: PNG/JPG ≤ 1MB
- Validar **conteúdo real** (não só extensão)
- Strip de metadata / re-encode quando viável
- Storage em object storage (URLs controladas); sem servir upload arbitrário do disco local em produção

---

## 8. Auditoria

Registrar em `SecurityLog` (ou equivalente):

- login success/fail
- reset password
- lockouts
- ações master sensíveis

Sem PII excessiva / sem secrets.

---

## 9. Checklist de segurança PR

- [ ] Ownership verificado
- [ ] CSRF ok
- [ ] Rate limit em endpoint público novo (incl. gestão por token)
- [ ] Tokens públicos com entropia adequada + compare timing-safe
- [ ] Sem secret em template/JS
- [ ] Erros genéricos ao cliente (anti-enumeração onde couber)
- [ ] Testes de authz negativos (cross-tenant)
- [ ] Upload validado por conteúdo (se aplicável)

---

## 10. Pós-v1 (não bloqueia lançamento)

Itens de endurecimento e produto de segurança **após** a paridade v1. Detalhar em issues/PRs próprias; não atrasar o soft launch.

### 10.1 2FA (TOTP)

- Disponibilizar TOTP para `enterprise` (opt-in na v1.x)
- **Obrigatório** para role `master` (admin da plataforma)
- Backup codes de uso único; recovery só via canal controlado
- Rate limit + lockout também no desafio 2FA

### 10.2 Ciclo de vida do `management_link`

- TTL configurável (ex.: até a data do appointment ou N dias)
- Revogação ao cancelar / reagendar / emitir novo token
- Opcional: single-use para ações destrutivas (cancelar)
- Mensagem opaca se expirado/revogado

### 10.3 Scans no CI (além do mínimo v1)

O pipeline v1 já prevê audit básico ([15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md)). Pós-v1:

- Dependency scan em toda PR + fail em CVEs altas/críticas
- Secret scan (gitleaks/trufflehog) bloqueante
- SAST leve (ex.: bandit / semgrep) nos apps `accounts`, `public_booking`, `messaging`
- Alertas em dependabot/renovação de deps

### 10.4 Proteção do booking público

- Bot/WAF ou challenge (Turnstile/hCaptcha) em picos / IPs abusivos
- Rate limit por IP **e** por `token_called`
- Monitorar padrões de enumeração de códigos curtos `/a/<code>`

### 10.5 Resiliência dos webhooks n8n

- Padrão **outbox**: persistir evento → worker envia → marca enviado
- Retry com backoff + teto; dead-letter / alerta operacional
- Idempotência no receptor (n8n) quando possível
- Ver [13-integracoes-n8n.md](./13-integracoes-n8n.md)

### 10.6 Outros (backlog segurança)

- Sessões concurrent limit / “sair de todos os dispositivos”
- Permissões granulares por funcionário (ligado a AC-11)
- Criptografia at-rest de campos PII sensíveis além do hash de secrets
- Bug bounty / pentest externo antes de escala comercial

---

## 11. Relacionados

- [05-funcionalidades.md](./05-funcionalidades.md) — backlog de produto
- [06-regras-de-negocio.md](./06-regras-de-negocio.md)
- [10-configuracoes.md](./10-configuracoes.md)
- [13-integracoes-n8n.md](./13-integracoes-n8n.md)
- [14-testes.md](./14-testes.md)
- [15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md)
