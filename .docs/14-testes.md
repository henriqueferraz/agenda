# 14 — Testes

> Estratégia de qualidade — cobertura mínima **80% global**  
> Atualizado: 2026-07-31

---

## 1. Pirâmide

| Tipo | Ferramenta sugerida | Foco | Local |
|---|---|---|---|
| **Unitário** | pytest | services, validators, timezone, disponibilidade | `apps/<app>/tests/` |
| **Integração** | pytest-django | views/forms/ORM, webhooks mockados, **F4 lembretes** | `tests/integration/` |
| **E2E** | Playwright ou Cypress | fluxos **F1–F3** no browser (HTMX) | `tests/e2e/` |

## 2. Meta de cobertura

- **Gate único de CI: ≥ 80% global** (linhas) — `--cov-fail-under=80`
- Cobertura por pacote tocado: meta de qualidade na PR, **não** falha hard
- Priorizar: `services/`, disponibilidade, auth/authz, booking público, client n8n

## 3. O que testar por camada

### Unitário
- CPF/CNPJ/phone/CEP parsers
- Cálculo de slots + unique parcial (confirmed)
- Detecção de conflito
- Builders de payload n8n
- Políticas de senha / OTP expiry

### Integração (obrigatório incluir F4)
- Login/register/OTP (sessão)
- CRUD serviços/funcionários com ownership + `unique(user_id, email)`
- Criar appointment painel e público
- Cancel/reschedule + history + reuso de slot após cancel
- StopDay / BlockedTime
- Cron reminders idempotente (mock n8n) — **F4**
- Contato via SMTP (mail backend locmem)
- Upload logo (storage fake)
- Trial middleware

### E2E (F1–F3)
1. Register → OTP (bypass em test) → login  
2. Onboarding mínimo → criar serviço/funcionário  
3. Agendar no painel  
4. Agendar pelo link público  
5. Cancelar / reagendar  
6. Contato landing  

> Lembretes (F4) **não** são gate e2e na v1; ficam na integração.

## 4. Convenções

```
apps/<app>/tests/       # unitário
tests/integration/
tests/e2e/
factories/              # factory_boy
conftest.py
```

- Um comportamento por teste; nomes descritivos
- `pytest.mark.django_db` só quando necessário
- Factories em vez de fixtures gigantes
- Time freeze (`freezegun`) para timezone/lembretes
- Sem rede externa real (CEP/n8n/SMTP mockados)

## 5. Comandos

```bash
pytest --cov=apps --cov-report=term-missing --cov-fail-under=80
pytest tests/e2e -m e2e
```

## 6. Gates de PR

1. Testes falharem  
2. Cobertura global `< 80%`  
3. Lint/typecheck falhar  
4. Migrations check falhar  

## 7. Relacionados

- [15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md)
- [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md)
- [06-regras-de-negocio.md](./06-regras-de-negocio.md)
