import type {
  AcaoAuditoria,
  Categoria,
  Papel,
  StatusContagemFinal,
  StatusPrimeiraContagem,
  TipoContagem,
} from '../constants';

export interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
  contadoresAparelhos: {
    lacrado: number;
    seminovo: number;
    americano: number;
    total: number;
  };
  criadoEm: string;
}

/** Formato do perfil autenticado retornado por GET /auth/me e POST /auth/session. */
export interface SessionUser {
  uid: string;
  nome: string;
  email: string;
  papel: Papel;
  lojaIds: string[];
  ativo: boolean;
}

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  papel: Papel;
  lojaIds: string[];
  ativo: boolean;
  criadoEm: string;
}

export interface Aparelho {
  id: string;
  lojaId: string;
  nome: string;
  marca: string;
  modelo: string;
  cor?: string;
  imei?: string;
  descricao?: string;
  categoria: Categoria;
  fotoUrl?: string;
  ativo: boolean;
  criadoPorUid: string;
  criadoEm: string;
}

export interface HistoricoAparelhoItem {
  data: string;
  origem: TipoContagem | 'cadastro' | 'edicao' | 'exclusao';
  status: StatusPrimeiraContagem | StatusContagemFinal | 'editado' | 'excluido';
  observacao?: string;
  actorNome?: string;
}

export interface ContadoresPorCategoria {
  lacrado: number;
  seminovo: number;
  americano: number;
  total: number;
}

export interface PendenciaInfo {
  bloqueada: boolean;
  bloqueadaEm?: string;
  bloqueadaPorUid?: string;
  desbloqueadaEm?: string;
  desbloqueadaPorUid?: string;
}

export interface ContadorProgresso {
  esperado: number;
  conferido: number;
}

export interface ContadoresContagem {
  porCategoria: Record<Categoria, ContadorProgresso>;
  total: ContadorProgresso;
}

export interface CountRecord {
  id: string;
  lojaId: string;
  data: string;
  dataOriginal: string;
  tipo: TipoContagem;
  finalizada: boolean;
  responsavelAberturaUid: string;
  responsavelFinalizacaoUid?: string;
  horarioAbertura: string;
  horarioFinalizacao?: string;
  contadores: ContadoresContagem;
  fotos: string[];
  pendencia: PendenciaInfo;
}

export interface CountItem {
  deviceId: string;
  lojaId: string;
  nome: string;
  marca: string;
  modelo: string;
  data: string;
  tipoContagem: TipoContagem;
  categoria: Categoria;
  status?: StatusPrimeiraContagem | StatusContagemFinal;
  observacao?: string;
  marcadoPorUid?: string;
  marcadoEm?: string;
}

export interface AparelhoDivergente {
  deviceId: string;
  nome: string;
  motivo: string;
}

export interface DailySummary {
  id: string;
  lojaId: string;
  data: string;
  primeiraContadores: ContadoresPorCategoria;
  movimentacoesManha: Record<StatusContagemFinal, number>;
  movimentacoes: Record<StatusContagemFinal, number>;
  totalEsperado: number;
  finalContadores: ContadoresPorCategoria;
  statusFinal: 'ok' | 'divergencia';
  divergentes: AparelhoDivergente[];
}

export interface AuditLog {
  id: string;
  lojaId: string;
  timestamp: string;
  actorUid: string;
  actorNome: string;
  actorPapel: Papel;
  acao: AcaoAuditoria;
  entidadeTipo?: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
}
