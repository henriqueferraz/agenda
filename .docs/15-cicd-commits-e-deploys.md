# 15 — CI/CD, Commits e Deploys

> Conventional Commits + pipelines + promoção segura  
> Atualizado: 2026-07-31

---

## 1. Conventional Commits (obrigatório)

Formato:

```
<type>(<scope>): <descrição curta no imperativo>

[corpo opcional]

[footer opcional]
```

### Types permitidos

| type | Quando |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `docs` | só documentação |
| `style` | formatação sem mudança de semântica |
| `refactor` | refatoração sem feat/fix |
| `perf` | performance |
| `test` | testes |
| `build` | build/deps |
| `ci` | pipelines |
| `chore` | manutenção diversa |
| `revert` | revert |

### Scopes sugeridos

`accounts`, `scheduling`, `catalog`, `clients`, `messaging`, `dashboard`, `billing`, `public`, `core`, `ci`, `docs`

### Exemplos

```
feat(scheduling): add employee blocked time validation
fix(accounts): prevent OTP resend before cooldown
test(public): cover conflict on public booking
docs(architecture): describe HTMX partial contract
```

### Regras

- Subject ≤ 72 chars, sem ponto final
- Imperativo (“add”, não “added”)
- Breaking change: `!` após type/scope ou footer `BREAKING CHANGE:`
- Commitlint no CI + husky/pre-commit (commit-msg hook)

## 2. Branching

Modelo recomendado: **trunk-based** ou GitHub Flow

- `main` protegida
- PRs obrigatórias
- Sem force-push em `main`
- Releases via tag semver (`v1.0.0`)

## 3. Pipeline CI (a cada PR)

Jobs mínimos:

1. **Lint** — ruff / black / isort (ou ruff format)
2. **Types** — mypy ou pyright (apps críticos)
3. **Migrations check** — `manage.py makemigrations --check`
4. **Tests** — pytest + coverage ≥ 80%
5. **E2E smoke** — opcional em PR / obrigatório em `main`
6. **Security** — pip-audit / safety; gitleaks secrets  
7. **Commitlint** — validar mensagens do PR  

> **v1:** audit + secret scan básicos bastam.  
> **Pós-v1 (SEC-03):** fail em CVE alta/crítica, SAST (bandit/semgrep) em apps críticos, Dependabot — ver [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md) §10.3.

## 4. Pipeline CD

### Staging
- Deploy automático em merge/`main` ou tag `staging`
- Migrate + collectstatic
- Healthcheck `/healthz`
- Smoke e2e pós-deploy

### Production
- Deploy só via tag/release aprovada
- `migrate` antes de trocar traffic (ou job init)
- Rollback plan (imagem anterior)
- Backup DB antes de migrate destrutiva

## 5. Ambientes

| Env | DEBUG | Dados |
|---|---|---|
| local | true | docker-compose |
| staging | false | DB isolado |
| production | false | DB prod + secrets vault |

Secrets: GitHub Actions secrets / provedor — nunca no repo.

## 6. Pre-commit local

```yaml
# exemplos
- ruff
- ruff-format
- end-of-file-fixer
- trailing-whitespace
- commitizen / commitlint
```

## 7. Definition of Done (DoD)

Uma mudança só está pronta se:

- [ ] Código + testes com **cobertura global ≥ 80%** no CI
- [ ] Integração cobrindo F4 se a mudança tocar lembretes/cron/n8n
- [ ] Docs `.docs` atualizadas se regra/rota mudou
- [ ] Commit conventional
- [ ] CI verde
- [ ] Sem secrets no diff

## 8. Relacionados

- [14-testes.md](./14-testes.md)
- [16-boas-praticas.md](./16-boas-praticas.md)
- [10-configuracoes.md](./10-configuracoes.md)
