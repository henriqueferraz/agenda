# 16 — Boas Práticas

> Programação, Django, HTMX, operações  
> Atualizado: 2026-07-31

---

## 1. Código

1. Preferir **clareza** a cleverness  
2. Funções pequenas; early return  
3. Tipagem (`typing`) em services públicos  
4. Sem `except:` nu; capturar exceções específicas  
5. Sem lógica de negócio em templates  
6. DRY com services/selectors — não copiar queries  
7. IDs/tokens: `secrets` / UUID — nunca `random.random`  
8. Datas: sempre timezone-aware + helpers SP  
9. **Reuso do legado:** imagens de `public/`; lógica de `utils/*.ts` (já testada) portada para Python — ver [03-estrutura.md](./03-estrutura.md) §7

## 2. Django

1. Fat services, thin views  
2. `select_related` / `prefetch_related` conscientes  
3. Transações (`atomic`) em create+conflict checks  
4. Constraints no banco (unique) + tratamento de IntegrityError  
5. Forms para validação; evitar `request.POST` cru  
6. Permissions object-level explícitas  
7. Admin não substitui painel do produto  

## 3. HTMX

1. Progressive enhancement: form funciona sem JS quando possível  
2. Partials pequenos e focados  
3. Sempre CSRF  
4. Preferir `hx-target` + swap explícito  
5. Indicadores de loading e disabled durante request  
6. Erros 422 com form re-renderizado  

## 4. Segurança

Ver [12-autenticacao-e-seguranca.md](./12-autenticacao-e-seguranca.md). Resumo:

- Ownership + CSRF + rate limit + secrets seguros + erros opacos

## 5. Performance

1. Índices alinhados às queries quentes (agenda por dia/employee)  
2. Paginação em listas  
3. Cache de CEP com TTL curto (opcional)  
4. Evitar N+1 no calendário  

## 6. Observabilidade

1. Logs estruturados (request id)  
2. Não logar PII sensível / tokens  
3. Alertas em falha de cron e taxa de erro 5xx  

## 7. Documentação

### 7.1 Pacote `.docs/` (produto e regras)

1. Toda regra nova → atualizar o `.docs` correspondente  
2. Atualizar [00-SISTEMA.md](./00-SISTEMA.md) se mudar mapa ou decisão fechada  
3. README do repo aponta para `.docs/`  
4. `.docs/` é a fonte do **porquê** e do **o quê** (regras, rotas, contratos n8n)  

### 7.2 Documentação no código

Dois níveis, sem overlap: `.docs/` = produto; código = **como** usar a API interna.

1. **Docstring** só onde agrega — services públicos, selectors, helpers de domínio (disponibilidade, ownership, webhooks) e models com regra não óbvia  
2. **Não** documentar views finas, getters óbvios nem o que o nome da função já diz  
3. Formato enxuto (Google-style light): o que faz, pré/pós-condições relevantes, exceções  

```python
def get_available_slots(...):
    """Retorna slots livres para (employee, date) em America/Sao_Paulo.

    Considera horários empresa ∩ funcionário − StopDay − BlockedTime − confirmed.
    Raises AvailabilityError se a data for feriado.
    """
```

4. **Types** (`typing`) nos services públicos — preferir assinatura clara a prosa longa  
5. **Comentários no corpo:** raros; só o *porquê* (decisão, edge case, restrição de legado) — nunca narrar o óbvio  
6. Regra de negócio crítica: uma linha apontando o doc canônico, sem duplicar a regra  

```python
# Ver .docs/06-regras-de-negocio.md §3 (disponibilidade)
```

7. **Fora da v1:** Sphinx/autodoc obrigatório, documentar 100% das funções, OpenAPI completo (painel é HTML/HTMX)

## 8. Relacionados

- [02-arquitetura.md](./02-arquitetura.md)
- [14-testes.md](./14-testes.md)
- [15-cicd-commits-e-deploys.md](./15-cicd-commits-e-deploys.md)
