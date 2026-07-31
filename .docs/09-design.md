# 09 — Design System

> Diretrizes visuais e responsivas para a UI Django/HTMX  
> Atualizado: 2026-07-31

---

## 1. Princípios

1. **Mobile-first**
2. **Consistência** de espaçamento, tipografia e componentes
3. **Acessibilidade** (WCAG 2.1 AA como meta)
4. **Uma composição** por viewport de marketing
5. Evitar looks genéricos “AI purple / cream serif / newspaper”

## 2. Breakpoints

| Token | Largura | Uso |
|---|---|---|
| base | 320px+ | celular |
| sm | 640px+ | celular grande |
| md | 768px+ | tablet |
| lg | 1024px+ | desktop |
| xl | 1280px+ | desktop grande |
| 2xl | 1536px+ | Full HD |

Container raiz do painel: **`max-width: 1920px`** centralizado.

## 3. Tipografia

Textos grandes sempre com escala responsiva:

| Desktop | Classes alvo |
|---|---|
| 5xl | 2xl → 3xl → 4xl → 5xl |
| 4xl | 2xl → 3xl → 4xl |
| 3xl | xl → 2xl → 3xl |
| 2xl | xl → 2xl |

Preferir fontes expressivas (não Inter/Roboto/Arial default) definidas via CSS variables no tema.

## 4. Espaçamento

| Contexto | Padrão |
|---|---|
| Seção | py progressivo (10 → 16 → 20) |
| Card/container | p 3 → 4 → 6 |
| Gaps de grid | 4 → 6 → 8 |

## 5. Touch targets

Todo controle interativo: **mínimo 44×44px**.

## 6. Componentes base

Reimplementar equivalentes Shadcn/Radix em templates:

- Button (primary/outline/destructive/icon)
- Input, Label, Select, Textarea, Checkbox, Switch
- Dialog / AlertDialog
- Table + versão cards mobile
- Badge, Card, Tabs, Tooltip
- Toast (via HX-Trigger)

Dialogs: largura `100%` com `max-width: calc(100vw - 2rem)` e breakpoints `sm:max-w-*`.

## 7. Grids

Sempre começar em **1 coluna** no mobile:

`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 …`

## 8. Cores e tema

- CSS variables no `:root` / `[data-theme=dark]`
- Tema claro padrão; dark opcional
- Contraste AA em textos e estados de foco
- Status: confirmed (neutro), cancelled (vermelho + tachado)

## 9. Motion

2–3 animações intencionais (entrada de página, swap HTMX suave, feedback de botão). Sem ruído.

## 10. Stack CSS sugerida

- Tailwind CSS (via django-tailwind ou build pipeline)
- Ou CSS layers + tokens se preferir menos tooling

## 11. Imagens e assets

**Fonte obrigatória:** pasta `public/` do legado (Next.js).

- Categorias, hero, carrossel, avatares e logos sociais → reutilizar esses arquivos  
- No Django: servir via `static/img/` (copiar de `public/`)  
- Não substituir por imagens geradas/baixadas se o asset já existir em `public/`  

Inventário e regra de reuso: [03-estrutura.md](./03-estrutura.md) §7.1.

## 12. Relacionados

- [03-estrutura.md](./03-estrutura.md)
- [08-layout.md](./08-layout.md)
- [16-boas-praticas.md](./16-boas-praticas.md)
