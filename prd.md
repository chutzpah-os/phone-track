# PRD — Sistema de Conferência Diária de Aparelhos (MVP)

**Versão:** 1.0
**Data:** 30/07/2026
**Status:** Rascunho para validação
**Autor:** Haniel (Product Owner)

---

## 1. Visão Geral

### 1.1 Contexto
Hoje a conferência diária de aparelhos da loja é feita em **caderno físico**, manualmente, separando os aparelhos entre **Lacrados (novos)**, **Seminovos** e **Americanos**. O processo já é consolidado e funciona, mas é lento, sujeito a erros de contagem, e não gera histórico consultável.

### 1.2 Problema a resolver
- A conferência manual é demorada e propensa a erro de soma/transcrição.
- Não existe registro digital consultável de aparelhos, movimentações ou divergências.
- Não há rastreabilidade individual do histórico de cada aparelho.

### 1.3 Objetivo do produto
Criar uma ferramenta **extremamente simples**, responsiva (celular, tablet e computador), que **digitalize exatamente o processo já existente** — sem introduzir controle de estoque completo, sem mudar a rotina da equipe. A prioridade máxima é **facilitar a adaptação da equipe ao digital**.

### 1.4 Escopo do MVP: cliente único
Este MVP será validado com **um único cliente/loja** antes de qualquer discussão sobre visão consolidada multi-loja. O modelo de dados pode já prever o campo "loja" (para não exigir retrabalho futuro), mas nenhuma tela de consolidação entre lojas será construída nesta fase.

### 1.5 Não-objetivos (fora do escopo deste MVP)
- Não é um ERP.
- Não é um controle de estoque completo (sem SKU complexo, sem custo, sem fornecedores).
- Não haverá controle de vendas, PDV ou financeiro.
- Não haverá transferência formal entre lojas (apenas o status "Transferido" como marcação simples).
- Essas funcionalidades ficam mapeadas como evolução futura (seção 8).

### 1.6 Princípio norteador
> "A equipe já tem um processo consolidado. O sistema deve se adaptar ao processo da equipe, não o contrário."

---

## 2. Personas e Papéis (RBAC)

| Papel | Descrição | Permissões principais |
|---|---|---|
| **Master** | Donos do projeto (desenvolvedores/administradores do sistema) | Acesso total: cadastro de lojas, usuários, todas as permissões de Admin + configurações do sistema |
| **Admin (Dono da empresa)** | Donos da loja/rede | Cadastra e edita aparelhos, gerencia funcionários, visualiza relatórios, análises e logs de todas as lojas sob sua gestão |
| **Staff (Funcionário)** | Equipe operacional da loja | Realiza contagens (manhã e fechamento), cadastra aparelhos novos durante o dia, tira fotos, não acessa logs/análises administrativas |

**Autenticação:** cada usuário possui e-mail e senha individuais. Sem login compartilhado — isso é importante para rastreabilidade (saber quem fez cada contagem).

---

## 3. Módulos do Sistema

1. **Lista de Aparelhos** (cadastro e consulta)
2. **Contagem** (primeira contagem da manhã + contagem final de fechamento)
3. **Análise** (log de ações por usuário — trilha de auditoria)
4. **Relatório** (relatórios diários com registro temporal/histórico)

---

## 4. Módulo: Cadastro e Lista de Aparelhos

### 4.1 Campos do cadastro

| Campo | Obrigatório | Observação |
|---|---|---|
| Nome | Sim | Ex: "iPhone 13" |
| Marca | Sim | Ex: Apple, Samsung |
| Modelo | Sim | Ex: 13 Pro Max 256GB |
| Cor | Não | |
| IMEI | Não | |
| Descrição | Não | Texto livre |
| Categoria | Sim | Lacrado (novo) / Seminovo / Americano — escolha única |
| Foto individual | Não | Upload de imagem única do aparelho |

### 4.2 Histórico individual do aparelho
Cada aparelho possui uma **página própria** (modelo "cartão do Trello"), listando em ordem cronológica todas as movimentações registradas nas contagens (ex: "22/07 - Contagem manhã - Presente", "22/07 - Fechamento - Vendido"). Esse histórico é somente leitura — construído automaticamente a partir das contagens.

### 4.3 Lista de aparelhos
- Lista geral com busca (por nome, marca, modelo ou IMEI).
- **Filtros por categoria:** Lacrados, Seminovos, Americanos — cada filtro exibe o **contador (count)** de aparelhos naquela categoria, além do total geral.
- Clique em um aparelho abre a ficha individual com histórico.

### 4.4 Regras
- Um aparelho pertence a apenas uma loja por vez (sem multi-loja neste MVP).
- Exclusão de aparelho: apenas Admin/Master, e a ação fica registrada no log (Análise).

---

## 5. Módulo: Contagem

A Contagem é o coração do sistema e replica o fluxo do caderno em duas etapas por dia.

### 5.1 Primeira Contagem (Abertura da loja)

**Fluxo:**
1. Funcionário abre a tela "Contagem — Primeira Contagem do dia".
2. Sistema exibe todos os aparelhos cadastrados da loja, agrupados/separáveis em 3 abas ou seções: **Lacrados, Americanos, Seminovos**.
3. Para cada aparelho, o funcionário marca a situação com um clique (ex: "Presente na loja"). Aparelhos não marcados ficam pendentes/visualmente destacados como "não conferido".
4. Contadores parciais em tempo real por categoria (ex: Lacrados 18/20, Americanos 10/10, Seminovos 15/15) e total geral.
5. Botão **Finalizar Contagem**, com **confirmação em duas etapas** (ex: "Finalizar contagem?" → "Tem certeza? Essa ação não poderá ser editada depois").
6. Após confirmar, o sistema oferece a opção de **anexar fotos** da situação geral da contagem (ex: foto da mesa com os aparelhos). Upload é opcional, múltiplas fotos permitidas.
7. Sistema salva o registro com:
   - Data
   - Horário
   - Loja
   - Responsável (usuário logado)
   - Quantidade encontrada por categoria (Lacrados / Americanos / Seminovos) + total geral
   - Fotos anexadas (se houver)

**Regra crítica:** uma vez finalizada, a Primeira Contagem **não pode mais ser editada** por ninguém (nem Admin), pois ela é a base de comparação do dia. Qualquer erro identificado depois deve ser tratado como movimentação na contagem final (ex: "Outro" com observação).

### 5.2 Durante o Dia
Sem tela específica. A loja opera normalmente. O sistema não interfere na operação — este é um requisito de produto explícito, não uma ausência de funcionalidade.

### 5.3 Contagem Final (Fechamento da loja)

**Fluxo:**
1. Sistema abre a lista da Primeira Contagem da manhã (somente leitura, não editável).
2. Para cada aparelho da lista, o funcionário informa o que aconteceu no dia através de **botões de status**:
   - Continua na loja
   - Entrada
   - Vendido
   - Transferido
   - Saiu
   - Assistência
   - Troca
   - Outro *(campo de observação em texto livre obrigatório quando selecionado)*
3. Botão **"+ Adicionar aparelho"**: permite cadastrar rapidamente um aparelho que chegou na loja durante o dia e não estava na primeira contagem (formulário reduzido: Nome, Marca, Modelo, Categoria — demais campos opcionais, podendo ser completados depois na ficha do aparelho).
4. Mesma lógica de finalização em duas etapas + anexo de fotos da contagem final.
5. Sistema salva o registro com data, horário, loja, responsável, status de cada aparelho e fotos.

### 5.4 Bloqueio e Pendência de Contagens Não Finalizadas

Essa regra vale igualmente para a **Primeira Contagem** e para a **Contagem Final**: se o turno anterior não foi finalizado (ex: loja esqueceu de fazer o fechamento no dia anterior), o sistema **bloqueia o avanço** para a próxima contagem até a pendência ser resolvida.

**Fluxo de bloqueio:**
1. Se a Contagem Final de um dia não foi finalizada, ao tentar iniciar a **Primeira Contagem do dia seguinte**, o sistema exibe um aviso de bloqueio: *"Existe uma contagem pendente de [data]. Resolva antes de continuar."*
2. O mesmo vale no sentido inverso: se a Primeira Contagem do dia não foi finalizada, a Contagem Final do mesmo dia também fica bloqueada.
3. Apenas **Master ou Admin** podem desbloquear a pendência.

**Fluxo de desbloqueio e resolução:**
1. Master/Admin acessa a pendência e a desbloqueia.
2. Uma vez desbloqueada, a pendência passa a aparecer **junto com a contagem do dia atual** — ou seja, a tela de contagem passa a exibir dois blocos:
   - A contagem do turno atual (Primeira ou Final, conforme o horário/etapa do dia).
   - A(s) pendência(s) de dia(s) anterior(es), claramente sinalizada(s) como atrasada(s).
3. A pendência pode ser resolvida por **Admin, Master ou Staff**, marcando manualmente a situação individual de cada aparelho que ficou pendente (mesma lógica de botões de status usada na contagem normal).
4. Após a resolução da pendência, ela é finalizada normalmente (com a mesma confirmação em duas etapas) e passa a compor o relatório do dia a que originalmente pertencia — mantendo a integridade histórica dos relatórios.
5. Toda ação de bloqueio/desbloqueio/resolução de pendência é registrada no log de auditoria (módulo Análise), incluindo quem desbloqueou e quando.

---

## 6. Módulo: Resumo Automático / Relatório do Dia

Ao finalizar a Contagem Final, o sistema gera automaticamente um **resumo do dia**, calculado — não digitado manualmente — a partir dos dados das duas contagens.

**Estrutura do resumo (exemplo):**

```
RELATÓRIO DO DIA — 30/07/2026 — Loja Centro

PRIMEIRA CONTAGEM (08:00)
Lacrados: 20 | Americanos: 12 | Seminovos: 20 | Total: 52

MOVIMENTAÇÕES DO DIA
Vendidos: 3
Transferidos: 2
Recebidos (entrada): 1
Assistência: 0
Troca: 0
Saiu: 0
Outro: 0

TOTAL ESPERADO: 48
(Cálculo: Primeira Contagem − Saídas + Entradas)

CONTAGEM FINAL (19:00)
Lacrados: 18 | Americanos: 12 | Seminovos: 18 | Total: 48

STATUS FINAL
✅ Tudo correto (Total Esperado = Contagem Final)
—— ou ——
⚠️ Divergência encontrada: [+/- X aparelhos]
   Lista de aparelhos que geraram a divergência
```

- O relatório é sempre separado por categoria (Lacrados / Americanos / Seminovos) e também traz o total geral.
- Em caso de divergência, o sistema deve indicar **quais aparelhos especificamente** não bateram (não apenas o número), para facilitar a investigação.
- Cada relatório diário fica salvo com **registro temporal** (histórico por data), acessível no módulo Relatório.

---

## 7. Módulo: Análise (Log de Auditoria)

- Registra automaticamente **todas as ações relevantes** de cada usuário: login, cadastro/edição/exclusão de aparelho, início e finalização de contagem, adição de aparelho durante o fechamento, upload de foto.
- Cada entrada de log contém: data/hora, usuário, ação realizada, aparelho/registro afetado (quando aplicável).
- **Log é imutável** (não pode ser editado ou apagado por ninguém, incluindo Admin).
- Visível para **Master e Admin** (donos/pessoas de confiança); não visível para Staff.
- Preparar a estrutura de dados pensando na futura exportação (CSV/PDF) — funcionalidade completa fica para fase 2, mas o log já deve nascer estruturado para isso.

---

## 8. Requisitos Não Funcionais

### 8.1 Responsividade
- Interface deve funcionar de forma fluida em **celular, tablet e computador**, com um único código-base responsivo (mobile-first, já que a operação diária acontece majoritariamente pelo celular/tablet no balcão da loja).
- Botões de status na contagem devem ser grandes o suficiente para uso rápido em tela touch.

### 8.2 Simplicidade de uso
- Fluxo de contagem deve ser executável majoritariamente com toques/cliques (mínimo de digitação).
- Onboarding da equipe deve ser possível sem treinamento formal extenso — interface autoexplicativa.

### 8.3 Confiabilidade dos dados
- Primeira Contagem, uma vez finalizada, é imutável (exceto via fluxo de pendência descrito em 5.4).
- Confirmação em duas etapas antes de qualquer finalização, para evitar erro de toque acidental.
- **Conexão com a internet é estável** neste cliente — não há requisito de funcionamento offline no MVP. O sistema pode assumir conexão sempre ativa (arquitetura mais simples, sem necessidade de fila de sincronização).

### 8.4 Performance e volume
- Dimensionar a lista de aparelhos e as telas de contagem para o volume real do cliente piloto: **~1.000 aparelhos cadastrados**.
- A tela de contagem (que exibe todos os aparelhos) deve suportar esse volume com carregamento rápido — recomenda-se paginação/scroll virtualizado e busca/filtro em tempo real dentro da própria tela de contagem, para o funcionário localizar um aparelho rapidamente em meio a ~1.000 itens.
- Os contadores por categoria (Lacrados/Americanos/Seminovos) devem ser calculados no backend, não recalculados no cliente a cada interação, para evitar lentidão.

### 8.5 Fotos e armazenamento
- Sem limite de quantidade ou tempo de retenção definido para fotos neste MVP — todas as fotos enviadas (do cadastro individual e das contagens) são mantidas indefinidamente.
- Recomenda-se compressão/otimização de imagem no upload para controlar custo de armazenamento, mesmo sem limite de retenção definido pelo negócio.

### 8.6 Segurança e acesso
- Autenticação por e-mail/senha individual.
- Controle de acesso por papel (RBAC) conforme seção 2.
- Fotos e dados armazenados de forma segura, com acesso restrito por loja/papel.

---

## 9. Fluxo Resumido (Diagrama textual)

```
[ABERTURA DA LOJA]
   ↓
Primeira Contagem → marcar presença por categoria → finalizar (2 etapas) → fotos (opcional) → registro salvo (imutável)
   ↓
[DIA NORMAL DE OPERAÇÃO — sem interferência do sistema]
   ↓
[FECHAMENTO DA LOJA]
   ↓
Contagem Final → abrir lista da manhã (somente leitura) → marcar status de cada aparelho
   → (+Adicionar aparelho, se necessário) → finalizar (2 etapas) → fotos (opcional)
   ↓
Resumo Automático gerado → comparação Esperado x Contagem Final → Status: OK ou Divergência
   ↓
Relatório do dia salvo com histórico temporal + Log de auditoria atualizado
```

---

## 10. Fora do Escopo — Evolução Futura (pós-MVP)

Após a equipe estar totalmente adaptada ao uso do sistema, módulos futuros incluem:

- Controle de estoque completo
- Transferências formais entre lojas
- Histórico completo de movimentações (visão consolidada multi-loja)
- Relatórios avançados (dashboards, comparativos por período)
- Módulo de Vendas / PDV
- Auditorias programadas
- Inventários automáticos
- Exportação de logs em CSV/PDF (visível a Master/Admin, imutável)

---

## 11. Critérios de Sucesso do MVP

- Equipe consegue concluir a Primeira Contagem e a Contagem Final em **menos tempo** do que levava no caderno.
- Redução de divergências não identificadas (o sistema aponta exatamente qual aparelho gerou a diferença).
- Adoção voluntária pela equipe sem necessidade de treinamento extenso.
- Zero necessidade de alterar a rotina operacional da loja durante o expediente.

---

## 12. Decisões Validadas (histórico de perguntas em aberto)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Base de aparelhos separada por loja ou visão consolidada? | MVP com **cliente único**. Visão multi-loja fica fora de escopo por enquanto (ver seção 1.4). |
| 2 | O que acontece se a Contagem Final não for finalizada no mesmo dia? | Sistema **bloqueia** o próximo turno. Master/Admin desbloqueiam; a pendência aparece junto com a contagem do dia atual e pode ser resolvida por Admin, Master ou Staff (ver seção 5.4). |
| 3 | Uso offline é necessário? | Não. Internet estável no cliente piloto — sistema pode assumir conexão sempre ativa. |
| 4 | Volume médio de aparelhos por loja? | ~1.000 aparelhos — direciona decisões de performance (ver seção 8.4). |
| 5 | Limite de armazenamento/retenção de fotos? | Sem limite definido pelo negócio no MVP. |

Nenhuma pergunta em aberto pendente no momento. Novas dúvidas que surgirem durante o design técnico devem ser adicionadas aqui.

## Stack 

Este é um web application

Nest - Backend
Next - Front
Firebase - Banco de dados
Sistema de caching otimizado

## Design


Design reference: /home/vhrsm/Documentos/github/phone-track/design-reference.png 


**DOCUMENTO DE DESIGN** 

# Sistema de Conferência Diária de Aparelhos 

Protótipo mobile · Staff · v1.0 · 30/07/2026 

Avalie esta página para mais informações sobre o design: /home/vhrsm/Documentos/github/phone-track

O sistema precisa ser pensado em mobile first (mas funcionando perfeitamente para os outros dispositivos - computador e tablet também )

## 1. Visão geral 

O protótipo digitaliza a conferência diária de aparelhos hoje feita em caderno físico, replicando o fluxo já consolidado da equipe: uma **Primeira Contagem** na abertura da loja e uma **Contagem Final** no fechamento, com um **Resumo do Dia** calculado automaticamente. O ponto de vista é o do **Staff (funcionário)** , em formato de **celular** — o dispositivo usado no balcão da loja. 

Quatro áreas compõem o app: **Lista de Aparelhos** (cadastro e consulta), **Primeira Contagem** , **Contagem Final** e **Resumo do Dia** , acessadas por uma barra de navegação inferior fixa. 

## 2. Paleta e tipografia 

Paleta reduzida a três cores, para máxima legibilidade em uso rápido de balcão: **branco** como fundo, **preto** como cor de texto e elementos primários, **amarelo** como cor de destaque (ações confirmadas, seleção ativa, texto sobre preto). 

<!-- Start of picture text -->
Branco Preto Amarelo<br>#FFFFFF · fundo #111111 · texto/primário #F6C500 · destaque<br><!-- End of picture text -->

Tons neutros intermediários (cinzas) são obtidos apenas por opacidade do preto (ex: `rgba(17,17,17,0.55)` para texto secundário, `rgba(17,17,17,0.08)` para bordas) — nenhuma cor nova é introduzida. Tipografia: **Plus Jakarta Sans** , pesos 400 a 800, para uma leitura amigável e rápida em tela touch. 

## 3. Dimensões e grid 

Protótipo desenhado sobre uma moldura de iPhone de **402 × 874px** (proporção de tela real), mobile-first. Estrutura vertical fixa: 

- **Status bar** (relógio/sinal/bateria): sobreposta, 54px de altura reservada no topo do conteúdo. 

- **Área de conteúdo** : rolagem vertical livre, ocupa todo o espaço restante entre status bar e barra de navegação. 

- **Barra de navegação inferior** : 4 abas, padding 8px laterais/superior + 22px inferior (+ home indicator da moldura), altura efetiva ≈ 78px. 

Escala de espaçamento usada em todo o app: **6 · 8 · 10 · 12 · 14 · 16 · 20px** (paddings/gaps) — praticamente nenhum valor fora dessa escala. Raio de canto: 10–12px em botões e chips pequenos, 14–16px em cards, 18px em cards de destaque/modais, 24px no topo da folha (bottom sheet) e 999px (pill) em selos, chips e círculos de status. 

Tipografia por elemento: título de tela 22–26px/800; subtítulo 13–14px/400 a 55% de opacidade; nome do aparelho 14.5–15px/600; texto secundário (marca/modelo) 12–12.5px; rótulos de categoria e status 11–13px/700; botões primários 13.5–14.5px/700. Nenhum texto abaixo de 10.5px (contadores de rodapé de tab). 

Alvos de toque: linhas de lista e itens de checklist têm no mínimo 44–52px de altura; botões de status em grid 2 colunas com padding vertical de 9px resultam em ≈ 40px de altura por botão — dentro do mínimo recomendado para uso touch no balcão. 

## 4. Componentes de UI 

- **Botão primário** (Finalizar, Adicionar, Confirmar/Continuar): fundo preto, texto amarelo, sem borda, raio 11–14px, padding 11–15px. 

- **Botão secundário** (Cancelar): fundo branco, borda preta 1.5px, texto preto. 

- **Chip de filtro/contador** : padding 7–8px × 12–14px, raio pill (999px); ativo = fundo preto/texto amarelo ou branco; inativo = fundo branco/borda preta 15% opacidade. 

- **Selo de categoria** : padding 3–4px × 9–10px, raio pill, com as três variações preto/amarelo/contorno descritas na seção 2. 

- **Card de aparelho** : fundo branco, borda 1.5px preta a 8% de opacidade, raio 14–16px, padding 12–14px. 

- **Indicador de status (checklist)** : círculo 26×26px, borda 2px; vazio = borda preta a 

- 20%/fundo branco; preenchido = fundo preto com ✓ amarelo. 

- **Grid de especificação** : 2 colunas × 4 linhas (8 opções de status), gap 6px, sem rolagem — substitui a antiga barra de rolagem horizontal. 

- **Campo de texto** (busca, observação "Outro", formulário): borda 1.5px preta a 12% de opacidade, raio 10–14px, fundo branco (ou cinza claro para "Outro"). 

- **Modal de confirmação** : cartão branco centralizado, largura máx. 280px, raio 18px, padding 20px, com os dois botões primário/secundário lado a lado. 

- **Bottom sheet** (ficha do aparelho): ocupa até 80% da altura da tela, raio 24px apenas no topo, "puxador" de 36×4px centralizado. 

- **Slot de foto** (cadastro): área de 140px de altura, arrastar-e-soltar, cantos arredondados 14px. 

## 5. Iconografia 

Todos os ícones são desenhados em SVG inline, 22×22px, `fill="none"` , cor herdada via `currentColor` (preto quando ativo, `rgba(17,17,17,0.35)` quando inativo) — nenhum ícone de terceiros ou fonte de ícones é usado. 

- **Lista** (aba): três retângulos horizontais empilhados, `viewBox="0 0 22 22"` , cada barra `16×3px` com `rx="1.5"` , nas posições y = 4, 9.5 e 15, x = 3. 

- **Manhã / sol** (aba): círculo central `cx="11" cy="11" r="4.5"` preenchido, 

- mais 4 raios (linhas `stroke-width="1.8"` , `stroke-linecap="round"` ) nas posições 12h/6h/3h/9h. 

- **Fechamento / lua** (aba): um único `path` em forma de crescente — `M17 12.5A7 7 0 019 3a7.5 7.5 0 108 9.5z` — preenchido sólido. 

- **Resumo / gráfico de barras** (aba): 3 retângulos verticais de alturas crescentes (8, 13, 18px), `rx="1"` , alinhados à base. 

- **Checkmark** (indicador de status preenchido): `viewBox="0 0 13 10"` , path `M1 5l4 4` 

- `7-8` , `stroke="#F6C500"` sobre círculo preto, `stroke-width="2"` , `strokelinecap/linejoin="round"` . 

- **Fechar (** ✕ **)** (bottom sheet): caractere de texto " ✕ " 15px sobre botão circular `30×30px` , fundo `rgba(17,17,17,0.06)` — não é SVG. 

- **Voltar / chevron** , quando aplicável, segue o mesmo padrão de traço 2–2.5px arredondado, nunca preenchido. 

Emojis são usados apenas em dois pontos pontuais e funcionais — banners de confirmação (✅) e de divergência (⚠) — como reforço rápido de leitura, nunca como recurso decorativo geral. 

## 6. Navegação 

Barra inferior fixa com 4 abas — **Lista** , **Manhã** , **Fechamento** , **Resumo** — sempre visível, com o ícone da aba ativa em preto e as demais em preto a 35% de opacidade. 

## 7. Telas 

### 7.1 Lista de Aparelhos 

Busca por nome, marca, modelo ou IMEI. 

- Filtros por categoria (Todos, Lacrados, Seminovos, Americanos), cada chip mostrando o contador de aparelhos. 

- Botão **+ Adicionar aparelho** , com formulário reduzido (foto, nome, marca, modelo, categoria) — cadastro completo pode ser finalizado depois na ficha do aparelho. 

- Cada linha exibe um selo de categoria com tratamento visual distinto: **Lacrado** (preto/texto branco), **Seminovo** (amarelo/texto preto), **Americano** (branco com contorno preto). 

- Toque em um aparelho abre a ficha individual (somente leitura) com dados e histórico cronológico de movimentações. 

### 7.2 Primeira Contagem & 7.3 Contagem Final 

As duas telas compartilham a **mesma estrutura** — mesmo checklist agrupado por categoria e mesma especificação de status — variando apenas o momento do dia e, na Contagem Final, uma referência somente leitura à Primeira Contagem do dia. 

- Contadores por categoria no topo (ex: "Lacrados 2/4") mais contador geral. 

- Aparelhos agrupados em seções: Lacrados, Seminovos, Americanos. 

- Botão **Finalizar Contagem** com confirmação em duas etapas; após finalizar, a contagem é travada (não editável) e um banner confirma horário e responsável. 

- Anexo de fotos opcional após a finalização. 

##### **PADRÃO DE INTERAÇÃO — CHECKLIST EXPANSÍVEL** 

Cada aparelho aparece primeiro como um item de checklist compacto (nome + indicador circular). Ao tocar, a **especificação completa aparece no mesmo lugar** , substituindo o checklist: 

#### **Continua na loja · Entrada · Vendido · Transferido · Saiu · Assistência · Troca · Outro** 

Ao escolher uma opção, o card recolhe automaticamente de volta ao formato compacto, agora mostrando o status escolhido e o indicador preenchido. Selecionar "Outro" mantém um campo de observação em texto livre sempre visível abaixo do item. 

### 7.4 Resumo do Dia 

- Alternância entre os cenários "Tudo certo" e "Divergência" (para fins de demonstração do protótipo). 

- Cartão com Primeira Contagem, Movimentações do dia, Total Esperado (calculado), Contagem Final e Status final. 

- Em caso de divergência, lista os aparelhos específicos que geraram a diferença, não apenas o número. 

## 8. Interações e comportamentos 

- **Navegação por abas** : clique troca uma variável de estado ( `tab` ); sem animação de transição entre telas — troca instantânea de conteúdo. 

- **Filtro de categoria / busca** (Lista): clique no chip atualiza o filtro ativo; digitar no campo de busca filtra em tempo real por nome, marca, modelo ou IMEI (comparação caseinsensitive, sem debounce necessário no volume do protótipo). 

- **Abrir ficha do aparelho** : clique na linha da lista sobe uma bottom sheet 

- ( `translateY(24px)→0` + fade, ~0.2s, `ease` ); clique fora da folha ou no ✕ fecha (o clique dentro da folha não deve propagar/fechar — `stopPropagation` ). 

- **Checklist expansível** (Manhã/Fechamento): clique no cabeçalho do item alterna `expandedId` (apenas um item aberto por vez, por tela); ao escolher uma opção de status, a grade fecha automaticamente ( `expandedId = null` ) e o item volta ao formato compacto já com o selo do status escolhido. 

- **Campo "Outro"** : ao selecionar o status "Outro", um campo de texto obrigatório aparece abaixo do item e permanece visível mesmo com o item recolhido, para edição a qualquer momento. 

- **Finalizar contagem** : fluxo de confirmação em duas etapas — modal 1 "Finalizar contagem?" (Cancelar/Continuar) → modal 2 "Tem certeza? Essa ação não poderá ser editada depois." (Cancelar/Confirmar). Ao confirmar, grava horário e responsável, trava todos os itens (cliques deixam de ter efeito) e mostra banner de confirmação. 

- **Anexar foto** (pós-finalização): botão tracejado incrementa um contador local de fotos anexadas (placeholder de upload). 

- **Adicionar aparelho** (Lista): abre modal com slot de foto (arrastar/soltar ou clique para escolher arquivo), campos de texto e seleção de categoria (single-select, 3 botões); ao confirmar, o aparelho entra na Lista e passa a aparecer também nas seções por categoria da Contagem Final. 

- **Alternância de cenário** (Resumo): segmented control de 2 opções recalcula 

- instantaneamente os números do cartão de relatório (nenhuma chamada assíncrona — troca de estado local). 

Transições/keyframes usados: `fadeIn` (opacity 0→1) em overlays de modal/sheet; `sheetUp` (translateY 24px→0 + opacity 0→1) na bottom sheet — ambas ~0.15–0.2s `ease` . Não há easing customizado, spring ou biblioteca de animação. 

## 9. Modelo de dados (do protótipo) 

**Aparelho** : id, nome, marca, modelo, cor (opcional), imei (opcional), categoria (lacrado | seminovo | americano — escolha única), foto (opcional), histórico (lista ordenada de strings cronológicas, somente leitura). 

**Registro de contagem** (Primeira/Final, por dia): status por aparelho — um de `continua` · `entrada` · `vendido` · `transferido` · `saiu` · `assistencia` · `troca` · `outro` (com observação em texto livre obrigatória quando "outro"); data, horário de finalização, responsável (usuário logado), fotos anexadas; estado `finalizado` (booleano) que trava edição. 

**Resumo do dia** : derivado — nunca digitado — a partir dos dois registros de contagem: contadores por categoria da Primeira Contagem, contadores de movimentações do dia, Total Esperado (Primeira Contagem − saídas + entradas), contadores por categoria da Contagem Final, status final (OK ou lista de aparelhos divergentes). 

## 10. Tokens de design (resumo) 

|**Token**|**Valor**|**Uso**|
|---|---|---|
|color/bg|#FFFFFF|fundo geral|
|color/fg|#111111|texto, botões primários, bordas fortes|
|color/accent|#F6C500|destaque/seleção, texto sobre preto|
|color/fg-muted|rgba(17,17,17,.55)|texto secundário|
|color/border|rgba(17,17,17,.08–.15)|bordas de card/input|
|color/surface-soft|rgba(17,17,17,.04–.06)|fundos sutis (chips, banners neutros)|
|font/family|Plus Jakarta Sans|toda a UI|
|radius/sm · md · lg · pill|10–12 · 14–16 · 18–24 · 999px|botões/chips · cards · modais/sheet · selos|
|space scale|6/8/10/12/14/16/20px|todo padding/gap|



## 11. Regras de estado 

- Primeira Contagem finalizada é imutável — mesma regra vale para a Contagem Final. 

- Toda finalização passa por confirmação em duas etapas, para evitar toque acidental. Aparelhos cadastrados durante o dia (via Lista) entram automaticamente nas seções da Contagem Final, sem retroagir à Primeira Contagem. 

- Enquanto uma contagem não está finalizada, os itens exibem apenas o indicador vazio; não há distinção visual de "pendente" além da ausência do selo de status. 

## 12. Arquivos do protótipo 

`Conferencia Diaria.dc.html` — protótipo interativo completo (as 4 telas, estado e interações descritos acima). `ios-frame.jsx` — moldura de iPhone (bezel, status bar, home indicator). `image-slot.js` — componente de upload de foto por arrastar-e-soltar usado no formulário de cadastro. 

## 13. Notas para implementação 

Os arquivos HTML deste pacote são **referências de design** — protótipos que demonstram aparência e comportamento pretendidos, não código de produção para copiar diretamente. A tarefa é recriar este design no ambiente/stack já existente do projeto (React Native, Flutter, iOS/Android nativo, etc.), usando os padrões e bibliotecas já estabelecidos ali; na ausência de um ambiente definido, qualquer framework mobile-first moderno é adequado. Este é um protótipo de **alta fidelidade** (hifi): cores, tipografia, espaçamento e interações devem ser recriados o mais próximo possível dos valores exatos listados neste documento. 

Fluxo de bloqueio/pendência de contagens não finalizadas, módulo de Análise (log de auditoria) e autenticação por papel (RBAC) não foram construídos nesta fase de protótipo visual — ver PRD original para especificação funcional completa dessas partes. 
