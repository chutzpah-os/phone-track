# PhoneTrack — Avaliação do PRD e Plano de Arquitetura (MVP completo)

> Este documento complementa o `prd.md` (especificação funcional + design). Ele registra a avaliação técnica do PRD, as decisões de arquitetura tomadas para viabilizar a implementação e o plano de construção em fases. Serve como referência viva do projeto — deve ser atualizado se decisões mudarem.

## Contexto

O PRD especifica um sistema que digitaliza a conferência diária de aparelhos de uma loja (hoje feita em caderno físico): Primeira Contagem na abertura, operação normal durante o dia, Contagem Final no fechamento, e um Resumo do Dia calculado automaticamente comparando o esperado com o encontrado — incluindo RBAC (Master/Admin/Staff), bloqueio de contagens não finalizadas e log de auditoria imutável.

Stack definida: **NestJS** (backend), **Next.js** (frontend, mobile-first), **Firebase** (Firestore + Storage + Auth).

Decisões de arquitetura validadas com o Product Owner:
- **Nest como intermediário único**: o Next só fala com a API Nest (exceto login, via SDK client do Firebase Auth). O Nest usa o Firebase Admin SDK para tudo mais. Toda regra de negócio (RBAC, imutabilidade de contagem, bloqueio/pendência, cálculo do resumo) fica centralizada e testável no backend — nunca em Security Rules ou no cliente.
- **Escopo: MVP completo** — os 4 módulos do PRD (Lista de Aparelhos, Contagem, Análise/Auditoria, Relatório/Resumo), RBAC e a lógica de bloqueio/pendência, construídos em fases sequenciais.

## Avaliação do PRD — lacunas encontradas e decisões

O PRD é detalhado no fluxo operacional (contagens, bloqueio, resumo, design visual), mas deixa pontos de arquitetura em aberto. Cada um foi resolvido com uma decisão explícita:

| # | Lacuna no PRD | Decisão |
|---|---|---|
| 1 | Volume de ~1000 aparelhos sem definição de paginação | Resposta única com todos os aparelhos ativos da loja (payload enxuto, ~150–200KB, tráfego trivial); busca/filtro 100% client-side; contadores por categoria sempre vêm prontos do backend (nunca somados no cliente). Virtualização de lista (`@tanstack/react-virtual`) nas telas de contagem. |
| 2 | Upload de fotos: direto ao Storage ou via backend? | Proxy pelo Nest (`multipart/form-data` → compressão com `sharp` → grava no Storage via Admin SDK), mantendo a regra "nada de lógica de negócio fora do backend" e permitindo auditoria centralizada. |
| 3 | "Sistema de caching otimizado" (citado na stack) é vago | Sem Redis: contadores denormalizados e atualizados via transação Firestore; resumo do dia "congelado" na finalização (nunca recalculado em leitura); cache client-side via TanStack Query. Redis só se justificaria com múltiplas lojas/alta concorrência — fora do escopo do MVP. |
| 4 | Bootstrap do primeiro usuário Master (só Master cria usuários) | Script local (`apps/api/scripts/seed-master.ts`), rodado manualmente uma vez com o Admin SDK, fora de qualquer endpoint HTTP público. |
| 5 | Gestão de Lojas/Usuários não tem UI detalhada (só citada nas permissões RBAC) | O design de 4 abas é a visão Staff; adicionamos uma 5ª entrada de navegação condicional a Admin/Master (Análise, Relatórios, Usuários, Lojas), reaproveitando os componentes visuais existentes. |
| 6 | Custom claims do Firebase Auth podem ficar desatualizadas após o Nest mudar papel/loja de um usuário | O guard de autenticação cruza o token com o documento `usuarios/{uid}` no Firestore como fonte de verdade a cada request sensível. |
| 7 | Exclusão de aparelho / desativação de usuário | Soft-delete (`ativo: false`) sempre, para preservar a integridade do histórico de contagens e dos logs de auditoria. |
| 8 | Resolução de pendência (PRD §5.4) — endpoint próprio? | Reaproveita os endpoints de marcar item + finalizar, atuando sobre um `countRecord` antigo; a `data` original é preservada mesmo resolvida tardiamente. |

## Arquitetura

### Monorepo (npm workspaces)

```
phone-track/
├── package.json                  # workspaces root
├── firebase.json                 # emulators: auth, firestore, storage
├── firestore.rules               # deny-all (só o Admin SDK do Nest toca Firestore)
├── storage.rules                 # deny-all
├── firestore.indexes.json
├── packages/shared/src/
│   ├── types/        # Aparelho, CountRecord, CountItem, ResumoDia, AuditLog, Usuario, Loja
│   ├── schemas/       # zod, espelhando os types
│   └── constants/     # enums: Papel, Categoria, StatusPrimeira, StatusFinal
└── apps/
    ├── api/src/                   # NestJS
    │   ├── config/                # firebase-admin.provider.ts
    │   ├── common/guards/         # firebase-auth.guard.ts, roles.guard.ts, loja-access.guard.ts
    │   ├── firestore/             # repositórios
    │   └── modules/{auth,lojas,usuarios,aparelhos,contagens,resumo,auditoria,uploads}/
    └── web/app/                    # Next.js App Router
        ├── (app)/layout.tsx        # BottomNav fixa
        └── components/ui/          # design system
```

`packages/shared` é consumido pelo Nest (DTOs via `nestjs-zod`) e pelo Next (tipos de fetch + `react-hook-form` com `zodResolver`). Sem Turborepo neste momento — 2 apps + 1 lib não justificam a complexidade adicional.

### Firestore — coleções top-level (todas com `lojaId`)

- **`lojas/{lojaId}`**: nome, ativo, `contadoresAparelhos: {lacrado, seminovo, americano, total}` (denormalizado).
- **`usuarios/{uid}`** (doc id = Firebase Auth uid): nome, email, `papel: master|admin|staff`, `lojaIds: string[]`, ativo.
- **`aparelhos/{id}`**: lojaId, nome, marca, modelo, cor?, imei?, descricao?, `categoria: lacrado|seminovo|americano`, fotoUrl?, ativo, criadoPorUid.
  - Índices: `(lojaId, categoria, nome)`, `(lojaId, ativo, nome)`.
- **`countRecords/{lojaId}_{data}_{tipo}`** (ID determinístico → idempotente, impede duas "primeiras contagens" no mesmo dia): lojaId, data (`YYYY-MM-DD`), `tipo: primeira|final`, `finalizada: boolean`, responsáveis, horários, `contadores` denormalizado, fotos, `pendencia: {bloqueada, bloqueadaPorUid?, desbloqueadaPorUid?, ...}`, `dataOriginal`.
  - Subcoleção **`items/{deviceId}`**: status, observacao?, marcadoPorUid, marcadoEm.
  - Índices: `(lojaId, tipo, data desc)`, `(lojaId, finalizada, data desc)`; collection-group `(deviceId, data)` para montar o histórico do aparelho.
- **`dailySummaries/{lojaId}_{data}`**: snapshot congelado na finalização — contadores das duas contagens, movimentações, totalEsperado, `statusFinal: ok|divergencia`, `divergentes: [{deviceId, nome, motivo}]`.
- **`auditLogs/{id}`** (auto-id, sem endpoint de update/delete): lojaId, timestamp, actorUid/nome/papel, `acao` (enum), entidadeTipo/Id, detalhes.
  - Índices: `(lojaId, timestamp desc)`, `(lojaId, acao, timestamp desc)`.

### API Nest

Guards em cadeia: `FirebaseAuthGuard` (verifica Bearer token + cruza com `usuarios/{uid}`) → `RolesGuard` (`@Roles(...)`) → `LojaAccessGuard`.

- **`AuthModule`**: `POST /auth/session` (registra login no audit log + devolve perfil), `GET /auth/me`.
- **`LojasModule` / `UsuariosModule`**: CRUD restrito a Master/Admin; criação de usuário grava no Firebase Auth + custom claims + doc Firestore + audit.
- **`AparelhosModule`**: CRUD sob `/lojas/:lojaId/aparelhos`; `GET /aparelhos/:id` monta ficha + histórico via collection-group query.
- **`ContagensModule`** (inclui `PendenciaService`, puro/testável):
  - `GET .../contagens/status` — etapa esperada do dia + pendências bloqueantes.
  - `POST .../primeira/abrir` — idempotente, valida bloqueio, faz snapshot dos aparelhos ativos como items.
  - `PATCH .../:recordId/itens/:deviceId` — transação: grava item + atualiza contadores do doc pai atomicamente.
  - `POST .../:recordId/finalizar` — transacional e idempotente (retorna 200 sem efeito se já finalizado); valida observação obrigatória em "Outro"; dispara `ResumoCalcService` quando `tipo=final`.
  - `GET/POST .../pendencias`, `POST .../pendencias/:recordId/desbloquear` (Master/Admin).
- **`ResumoModule`**: `GET .../relatorios?de=&ate=`, `GET .../relatorios/:data` (calcula preview sob demanda se o dia ainda não fechou).
- **`AuditoriaModule`**: `AuditoriaService.log(...)` chamado internamente por todos os módulos; único endpoint público é leitura paginada, Master/Admin only.
- **`UploadsModule`**: `POST .../contagens/:recordId/fotos` (multipart → sharp → Storage Admin SDK → audit).

### Autenticação

Firebase Auth (email/senha) roda só no Next via SDK client — única exceção à regra "Next só fala com o Nest". Cada request à API leva `Authorization: Bearer <idToken>`. O Nest valida via `firebase-admin.auth().verifyIdToken` e cruza com `usuarios/{uid}` para papel/lojaIds atualizados. Custom claims (`role`, `lojaIds`) setadas em `admin.auth().setCustomUserClaims` ao criar/editar usuário, como camada rápida — não como única fonte de verdade.

### Frontend Next.js

App Router, mobile-first. Layout `(app)/layout.tsx` com `BottomNav` fixa (4 abas Staff: Lista/Manhã/Fechamento/Resumo + 5ª aba condicional Admin/Master). Ficha do aparelho é bottom sheet controlada por query param (deep-link sem navegação cheia).

Design tokens do PRD: escala de espaçamento (6/8/10/12/14/16/20px) já bate com a escala default do Tailwind — usar direto. Raios precisam de tokens customizados no `tailwind.config.ts`: `sm=10-12px, md=14-16px, lg=18px, xl=24px, pill=999px`. Paleta: `#FFFFFF` fundo, `#111111` texto/primário, `#F6C500` destaque, neutros só via opacidade do preto. Fonte Plus Jakarta Sans via `next/font/google`. Ícones SVG inline (sem lib de terceiros).

Componentes reutilizáveis em `apps/web/components/ui/`: `Button`, `Chip`, `CategoryBadge`, `StatusCircle`, `DeviceCard`, `BottomSheet`, `ConfirmModal` (2 etapas), `SearchInput`, `PhotoSlot`, `StatusGrid` (checklist 2×4 expansível), `BottomNav`. Estado/cache via TanStack Query; `lib/api.ts` centraliza fetch autenticado.

## Fases de construção

| Fase | Escopo | Verificação |
|---|---|---|
| 0 | Scaffold monorepo, projeto Firebase, emulators (auth/firestore/storage), health check | `GET /health` 200; `apps/web` sobe em :3000; emuladores rodando |
| 1 | Auth + RBAC + Lojas + Usuários, seed do Master | Criar loja/usuário via curl com token Master; 403 em rota restrita com token Staff |
| 2 | Aparelhos / Lista (+ contador denormalizado em `lojas/{id}`) | Seed de 1000 aparelhos; medir resposta e busca client-side |
| 3 | Contagem Primeira + Final | Fluxo completo abrir → marcar → finalizar → edição bloqueada após finalizar → "Outro" sem observação impede finalizar |
| 4 | Bloqueio / Pendência | Seed de contagem de "ontem" não finalizada; testar bloqueio, desbloqueio por Admin, resolução por Staff, `dataOriginal` preservada |
| 5 | Resumo do Dia | Cenário OK e cenário com divergência proposital; lista de divergentes bate com o esperado |
| 6 | Auditoria / Análise | Percorrer ações como Staff; conferir logs como Admin; Staff sem acesso à tela de análise |
| 7 | Polish responsivo | Testar em 375/768/1024/1440px; bottom nav vira sidebar em desktop, bottom sheet vira modal |

Cada fase deve ser testada de ponta a ponta (backend rodando contra os emuladores do Firebase + frontend consumindo a API real) antes de avançar para a próxima.

## Arquivos críticos a criar

- `apps/api/src/modules/contagens/contagens.service.ts` e `pendencia.service.ts`
- `apps/api/src/modules/resumo/resumo-calc.service.ts`
- `apps/api/src/common/guards/firebase-auth.guard.ts`
- `packages/shared/src/types/*`
- `apps/web/app/(app)/layout.tsx`
- `firestore.indexes.json`, `firestore.rules`, `storage.rules`
