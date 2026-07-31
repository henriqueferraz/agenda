# 08 — Layout

> Estrutura de layouts e navegação (Django templates + HTMX)  
> Atualizado: 2026-07-31

---

## 1. Layouts raiz

| Layout | Uso |
|---|---|
| `layouts/public.html` | Landing, auth, booking público |
| `layouts/panel.html` | Área logada com sidebar |
| `layouts/upgrade.html` | Tela de bloqueio pós-trial (minimal) |
| `layouts/blank.html` | Páginas sem chrome (raro) |

## 2. Shell do painel

```
┌──────────────────────────────────────────────┐
│ max-w-[1920px] mx-auto                       │
│ ┌────────┬─────────────────────────────────┐ │
│ │Sidebar │ Header (título + user)          │ │
│ │        ├─────────────────────────────────┤ │
│ │ Nav    │ {% block content %}             │ │
│ │ groups │   páginas / partials HTMX       │ │
│ │        │ {% endblock %}                  │ │
│ └────────┴─────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Grupos da sidebar (espelho legado)

1. **Principal** — Dashboard  
2. **Configurações** — Atividade, Modelo, Endereço, Horários  
3. **Serviços** — Serviços, Funcionários  
4. **Agendamentos** — Calendário, Feriados, Bloqueios  
5. **Clientes**  
6. **Mensagens**  
7. **Admin** (só `master`)

## 3. Landing (primeiro viewport)

Regras de composição:

- Uma composição clara (não dashboard)
- Marca em evidência
- Um headline, uma frase de apoio, um grupo de CTA
- Visual dominante (carrossel/categorias)
- Sem cards no hero; seções com um propósito cada

## 4. Padrões de página do painel

1. Cabeçalho: título + ação primária (`flex-col` → `sm:flex-row`)
2. Conteúdo: tabela/lista + empty state
3. Mutações: modal/drawer ou página; resposta HTMX atualiza lista
4. Confirmações destrutivas: dialog acessível

## 5. Partials HTMX

Exemplos:

- `_appointment_day_list.html`
- `_service_table.html`
- `_form_errors.html`
- `_toast_region.html`

Toda partial deve ser renderizável isoladamente (mesmo contexto mínimo).

## 6. Acessibilidade de layout

- Landmarks: `header`, `nav`, `main`
- Skip link para conteúdo
- Foco visível
- Sidebar colapsável em mobile com `aria-expanded`

## 7. Relacionados

- [09-design.md](./09-design.md)
- [03-estrutura.md](./03-estrutura.md)
