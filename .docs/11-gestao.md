# 11 — Gestão (Painel Operacional)

> Regras e comportamentos da área logada  
> Atualizado: 2026-07-31

---

## 1. Papéis

| Role | Acesso |
|---|---|
| `enterprise` | Próprio tenant (dados do negócio) |
| `master` | Admin da plataforma + bypass trial |

## 2. Dashboard

Widgets obrigatórios:

1. KPIs: agendamentos (período), clientes, receita estimada
2. Alerta de novos agendamentos
3. Agenda do dia (lista detalhada; cancelados visualmente distintos)
4. Tarefas/reminders (CRUD inline HTMX)
5. Ações rápidas + URL de booking (copiar)

## 3. Configurações do negócio

Ordem sugerida de onboarding:

1. Atividade  
2. Modelo (PF/PJ) + logo + fantasia  
3. Endereço  
4. Horários da empresa  
5. Serviços  
6. Funcionários (+ vínculo e horários)  

## 4. Catálogo

### Serviços
- Criar/editar/desativar
- Preço UI em R$; persistência em centavos
- Duração UI h+min → minutos
- Bloquear exclusão se houver futuros

### Funcionários
- CRUD + status ativo/inativo
- Horários por dia
- Multi-serviço
- Soft delete com checagem de futuros

## 5. Agenda

| Ação | Comportamento |
|---|---|
| Criar | Valida disponibilidade completa |
| Editar | Serviço/funcionário/data/hora + history |
| Cancelar | Motivo opcional + webhook cancel |
| Reagendar | Nova data/hora excluindo self no conflito |
| Feriados | StopDay; bloqueia o dia |
| Bloqueios | Slot por funcionário |

UI: calendário mensal → detalhe do dia → dialogs de ação.

## 6. Clientes

- Lista pesquisável
- Detalhe com histórico de appointments
- Validação CPF/telefone/e-mail
- Unicidade no tenant

## 7. Mensagens

- Toggles 7d/24h/2h + canal
- Envio individual / em massa / aviso de indisponibilidade → GLOBAL_N8N
- Histórico MessageLog

## 8. Upgrade / trial

- Se `trial_ends_at <= now` e role enterprise → só upgrade + contato
- Exibir resumo de uso (appointments, clients, services)

## 9. Master admin

- Listar usuários
- Reset de senha controlado
- Sem vazar dados sensíveis em UI

## 10. Feedback UX

- Loading states em botões HTMX (`hx-disabled-elt`, indicators)
- Toasts de sucesso/erro
- Empty states com CTA
- Confirmação em ações destrutivas

## 11. Relacionados

- [05-funcionalidades.md](./05-funcionalidades.md)
- [06-regras-de-negocio.md](./06-regras-de-negocio.md)
- [07-rotas.md](./07-rotas.md)
