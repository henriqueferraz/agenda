# 03 — Estrutura do Projeto

> Estrutura recomendada para a reescrita Django + HTMX  
> Atualizado: 2026-07-31

---

## 1. Árvore sugerida

```
agenda-django/
├── .docs/                      # Esta documentação
├── .github/workflows/          # CI/CD
├── config/                     # Settings Django (split)
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   ├── production.py
│   │   └── test.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── accounts/
│   ├── organizations/
│   ├── catalog/
│   ├── scheduling/
│   ├── clients/
│   ├── messaging/
│   ├── dashboard/
│   ├── billing/
│   ├── public_booking/
│   └── core/
├── templates/
│   ├── base.html
│   ├── layouts/
│   ├── partials/
│   └── components/
├── static/
│   ├── css/
│   ├── js/                     # HTMX, Alpine mínimo
│   └── img/
├── tests/
│   ├── unit/                   # opcional espelho; preferir unit nos apps
│   ├── integration/            # integração na raiz
│   └── e2e/                    # e2e na raiz
├── locale/                     # pt-BR
├── manage.py
├── pyproject.toml / requirements/
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

### Onde moram os testes (decisão 10C)

| Tipo | Local |
|---|---|
| Unitário | Preferencialmente `apps/<app>/tests/` (perto do domínio) |
| Integração | `tests/integration/` na raiz |
| E2E | `tests/e2e/` na raiz |
## 2. Convenções por app

Cada app Django deve conter, quando aplicável:

```
apps/<nome>/
├── models.py
├── forms.py
├── views/
│   ├── __init__.py
│   └── *.py
├── services/          # casos de uso
├── selectors/         # queries de leitura
├── urls.py
├── admin.py
├── permissions.py
├── tests/
└── templates/<nome>/
```

## 3. Separação de responsabilidades

| Artefato | Pode | Não pode |
|---|---|---|
| **Views** | Orquestrar request/response HTMX | Conter regra de conflito de agenda |
| **Forms** | Validar entrada | Chamar n8n diretamente (preferir service) |
| **Services** | Regras de negócio + side effects | Depender de `HttpRequest` |
| **Selectors** | Queries otimizadas | Mutar dados |
| **Models** | Persistência + invariants simples | HTTP / templates |

## 4. Templates

| Pasta | Uso |
|---|---|
| `templates/layouts/` | Shell do painel, público, auth |
| `templates/partials/` | Fragmentos HTMX |
| `templates/components/` | Botões, cards, tabelas reutilizáveis |

Naming: `_<contexto>_<elemento>.html` para partials (ex.: `_day_appointments.html`).

## 5. Configuração

- Settings split: `base` / `local` / `production` / `test`
- Secrets via env (django-environ ou pydantic-settings)
- Nunca commitar `.env`

## 6. Migrações

- Uma migration por mudança lógica
- Nomes descritivos
- Dados sensíveis de seed só em `fixtures` de dev/test

## 7. Reuso do legado (pasta raiz atual)

A reescrita Django **reaproveita** artefatos já validados do Next.js — não recriar do zero quando já existir equivalente testado.

### 7.1 Imagens — `public/`

Qualquer necessidade de imagem (landing, categorias, avatares, logos sociais):

1. Usar os arquivos em **`public/`** do legado  
2. Copiar para `static/img/` (ou equivalente) no projeto Django  
3. **Não** baixar/gerar assets novos se já houver na pasta  

Inventário atual:

| Caminho | Uso típico |
|---|---|
| `public/barbeiro.png`, `cabelereiro.png`, `manicure.png`, `maquiagem.png`, `petshop.png` | Categorias / hero |
| `public/imagem01.png` … `imagem15.png` | Marketing / carrossel |
| `public/avatars/` | Avatares |
| `public/logos/` | Ícones sociais (WhatsApp, Instagram, Facebook, TikTok) |

Detalhe visual: [09-design.md](./09-design.md).

### 7.2 Utilitários — `utils/` (TypeScript, já testados)

Portar a **lógica** (não o runtime TS) para Python em `apps/core/` (ou app dono do domínio). Fonte: pasta **`utils/`** do legado — funções cobertas por testes e em uso.

| Arquivo legado | Responsabilidade | Destino sugerido Django |
|---|---|---|
| `utils/date-timezone.ts` | America/Sao_Paulo: componentes, início/fim do dia, comparação, format pt-BR | `apps/core/datetime_sp.py` |
| `utils/formatCPF.ts` | Máscara + validação algorítmica CPF | `apps/core/br_docs.py` |
| `utils/formatCNPJ.ts` | Máscara + validação algorítmica CNPJ | `apps/core/br_docs.py` |
| `utils/formatPhone.ts` | Telefone BR (fixo/celular) | `apps/core/br_phone.py` |
| `utils/cep.ts` | ViaCEP → fallback BrasilAPI + format CEP | `apps/organizations/services/cep.py` |

Regras:

1. Manter o mesmo contrato comportamental (entradas/saídas e edge cases dos testes TS)  
2. Reescrever os testes em pytest espelhando os casos do legado  
3. Ver também [06-regras-de-negocio.md](./06-regras-de-negocio.md) (§2 timezone, §6 docs BR)

## 8. Relacionados

- [02-arquitetura.md](./02-arquitetura.md)
- [08-layout.md](./08-layout.md)
- [09-design.md](./09-design.md)
- [10-configuracoes.md](./10-configuracoes.md)
- [06-regras-de-negocio.md](./06-regras-de-negocio.md)
