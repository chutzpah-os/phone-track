export const PAPEIS = ['master', 'admin', 'staff'] as const;
export type Papel = (typeof PAPEIS)[number];

export const CATEGORIAS = ['lacrado', 'seminovo', 'americano'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const TIPOS_CONTAGEM = ['primeira', 'final'] as const;
export type TipoContagem = (typeof TIPOS_CONTAGEM)[number];

export const STATUS_PRIMEIRA_CONTAGEM = ['presente', 'nao_conferido'] as const;
export type StatusPrimeiraContagem = (typeof STATUS_PRIMEIRA_CONTAGEM)[number];

export const STATUS_CONTAGEM_FINAL = [
  'continua',
  'entrada',
  'vendido',
  'transferido',
  'saiu',
  'assistencia',
  'troca',
  'outro',
] as const;
export type StatusContagemFinal = (typeof STATUS_CONTAGEM_FINAL)[number];

/** Status que representam saída do estoque físico da loja (usados no cálculo do Total Esperado). */
export const STATUS_SAIDA: readonly StatusContagemFinal[] = [
  'vendido',
  'transferido',
  'saiu',
  'assistencia',
];

/** Status que representam entrada no estoque físico da loja (usados no cálculo do Total Esperado). */
export const STATUS_ENTRADA: readonly StatusContagemFinal[] = ['entrada'];

/**
 * Status que tiram o aparelho definitivamente do estoque da loja: uma vez
 * marcado, o aparelho é desativado automaticamente (mesmo soft-delete do
 * cadastro manual) e some da Lista e das próximas contagens. "Assistência"
 * e "Troca" não entram aqui — o aparelho deve voltar à loja depois.
 */
export const STATUS_QUE_DESATIVAM_APARELHO: readonly StatusContagemFinal[] = [
  'vendido',
  'transferido',
  'saiu',
];

export const ACOES_AUDITORIA = [
  'login',
  'aparelho.criar',
  'aparelho.editar',
  'aparelho.excluir',
  'contagem.abrir',
  'contagem.finalizar',
  'contagem.item.marcar',
  'contagem.item.adicionar_durante_fechamento',
  'foto.upload',
  'pendencia.bloquear',
  'pendencia.desbloquear',
  'pendencia.resolver',
  'usuario.criar',
  'usuario.editar',
  'usuario.desativar',
  'loja.criar',
  'loja.editar',
] as const;
export type AcaoAuditoria = (typeof ACOES_AUDITORIA)[number];
