import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  AtualizarAparelhoInput,
  Aparelho,
  AuditLog,
  Categoria,
  CriarAparelhoInput,
  HistoricoAparelhoItem,
} from '@phonetrack/shared';
import { FIRESTORE } from '../../firebase/firebase.module';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AuditoriaService } from '../auditoria/auditoria.service';

const COLECAO = 'aparelhos';
const COLECAO_LOJAS = 'lojas';

@Injectable()
export class AparelhosService {
  constructor(
    @Inject(FIRESTORE) private readonly firestore: Firestore,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async criar(lojaId: string, actor: AuthenticatedUser, input: CriarAparelhoInput): Promise<Aparelho> {
    const ref = this.firestore.collection(COLECAO).doc();
    const lojaRef = this.firestore.collection(COLECAO_LOJAS).doc(lojaId);

    await this.firestore.runTransaction(async (tx) => {
      tx.set(ref, {
        lojaId,
        nome: input.nome,
        marca: input.marca,
        modelo: input.modelo,
        categoria: input.categoria,
        cor: input.cor ?? null,
        imei: input.imei ?? null,
        descricao: input.descricao ?? null,
        fotoUrl: input.fotoUrl ?? null,
        ativo: true,
        criadoPorUid: actor.uid,
        criadoEm: FieldValue.serverTimestamp(),
      });
      tx.update(lojaRef, {
        [`contadoresAparelhos.${input.categoria}`]: FieldValue.increment(1),
        'contadoresAparelhos.total': FieldValue.increment(1),
      });
    });

    return this.buscarPorId(ref.id);
  }

  async listar(lojaId: string): Promise<Aparelho[]> {
    const snapshot = await this.firestore
      .collection(COLECAO)
      .where('lojaId', '==', lojaId)
      .where('ativo', '==', true)
      .orderBy('nome')
      .get();
    return snapshot.docs.map((doc) => this.paraAparelho(doc.id, doc.data()));
  }

  async buscarPorId(id: string): Promise<Aparelho> {
    const doc = await this.firestore.collection(COLECAO).doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException('Aparelho não encontrado');
    }
    return this.paraAparelho(doc.id, doc.data()!);
  }

  async buscarComHistorico(id: string): Promise<{ aparelho: Aparelho; historico: HistoricoAparelhoItem[] }> {
    const aparelho = await this.buscarPorId(id);

    const itensSnapshot = await this.firestore
      .collectionGroup('items')
      .where('deviceId', '==', id)
      .orderBy('data')
      .get();

    const historicoContagens: HistoricoAparelhoItem[] = itensSnapshot.docs
      .map((doc) => doc.data())
      .filter((data) => data.status !== undefined)
      .map((data) => ({
        data: data.data,
        origem: data.tipoContagem,
        status: data.status,
        observacao: data.observacao ?? undefined,
      }));

    // O cadastro em si sempre conta como "Entrada" no histórico, sintetizado a
    // partir de `criadoEm` — não depende de o aparelho já ter passado por
    // alguma contagem, e corrige retroativamente aparelhos cadastrados antes
    // dessa regra existir (sem precisar de backfill).
    const entradaCadastro: HistoricoAparelhoItem = {
      data: this.paraDataISO(aparelho.criadoEm),
      origem: 'cadastro',
      status: 'entrada',
    };

    // Edições e exclusões manuais (feitas por Admin/Master pela ficha) vêm do
    // próprio log de auditoria, não de um countRecord. Exclusões automáticas
    // (vendido/transferido/saiu durante o Fechamento) já aparecem no histórico
    // acima via o item da contagem — por isso são identificadas e ignoradas
    // aqui pelo `detalhes.recordId`, que só a exclusão automática carrega.
    const logs: AuditLog[] = await this.auditoriaService.listarPorEntidade('aparelho', id);
    const historicoAcoes: HistoricoAparelhoItem[] = logs
      .filter((log) => log.acao === 'aparelho.editar' || log.acao === 'aparelho.excluir')
      .filter((log) => log.acao === 'aparelho.editar' || !log.detalhes?.recordId)
      .map((log) => ({
        data: this.paraDataISO(log.timestamp),
        origem: log.acao === 'aparelho.editar' ? ('edicao' as const) : ('exclusao' as const),
        status: log.acao === 'aparelho.editar' ? ('editado' as const) : ('excluido' as const),
        actorNome: log.actorNome,
      }));

    const historico = [entradaCadastro, ...historicoContagens, ...historicoAcoes].sort((a, b) =>
      a.data.localeCompare(b.data),
    );

    return { aparelho, historico };
  }

  private paraDataISO(valor: unknown): string {
    const timestamp = valor as FirebaseFirestore.Timestamp | undefined;
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  }

  private garantirAcessoLoja(actor: AuthenticatedUser, lojaId: string) {
    if (actor.papel !== 'master' && !actor.lojaIds.includes(lojaId)) {
      throw new ForbiddenException('Usuário não tem acesso a esta loja');
    }
  }

  async atualizar(
    lojaId: string,
    id: string,
    actor: AuthenticatedUser,
    input: AtualizarAparelhoInput,
  ): Promise<Aparelho> {
    this.garantirAcessoLoja(actor, lojaId);
    const atual = await this.buscarPorId(id);
    if (atual.lojaId !== lojaId) {
      throw new NotFoundException('Aparelho não encontrado nesta loja');
    }

    const ref = this.firestore.collection(COLECAO).doc(id);
    const lojaRef = this.firestore.collection(COLECAO_LOJAS).doc(lojaId);
    const novaCategoria = input.categoria;

    await this.firestore.runTransaction(async (tx) => {
      tx.update(ref, { ...input });
      if (novaCategoria && novaCategoria !== atual.categoria) {
        tx.update(lojaRef, {
          [`contadoresAparelhos.${atual.categoria}`]: FieldValue.increment(-1),
          [`contadoresAparelhos.${novaCategoria}`]: FieldValue.increment(1),
        });
      }
    });

    return this.buscarPorId(id);
  }

  async excluir(lojaId: string, id: string, actor: AuthenticatedUser): Promise<{ id: string; ativo: false }> {
    this.garantirAcessoLoja(actor, lojaId);
    const atual = await this.buscarPorId(id);
    if (atual.lojaId !== lojaId) {
      throw new NotFoundException('Aparelho não encontrado nesta loja');
    }
    if (!atual.ativo) {
      return { id, ativo: false };
    }

    const ref = this.firestore.collection(COLECAO).doc(id);
    const lojaRef = this.firestore.collection(COLECAO_LOJAS).doc(lojaId);

    await this.firestore.runTransaction(async (tx) => {
      tx.update(ref, { ativo: false });
      tx.update(lojaRef, {
        [`contadoresAparelhos.${atual.categoria}`]: FieldValue.increment(-1),
        'contadoresAparelhos.total': FieldValue.increment(-1),
      });
    });

    return { id, ativo: false };
  }

  /**
   * Reverte a desativação automática de `excluir` quando o staff corrige,
   * antes de finalizar, um status de fechamento que tinha marcado o
   * aparelho como vendido/transferido/saiu para outro status.
   */
  async reativar(lojaId: string, id: string, actor: AuthenticatedUser): Promise<{ id: string; ativo: true }> {
    this.garantirAcessoLoja(actor, lojaId);
    const atual = await this.buscarPorId(id);
    if (atual.lojaId !== lojaId) {
      throw new NotFoundException('Aparelho não encontrado nesta loja');
    }
    if (atual.ativo) {
      return { id, ativo: true };
    }

    const ref = this.firestore.collection(COLECAO).doc(id);
    const lojaRef = this.firestore.collection(COLECAO_LOJAS).doc(lojaId);

    await this.firestore.runTransaction(async (tx) => {
      tx.update(ref, { ativo: true });
      tx.update(lojaRef, {
        [`contadoresAparelhos.${atual.categoria}`]: FieldValue.increment(1),
        'contadoresAparelhos.total': FieldValue.increment(1),
      });
    });

    return { id, ativo: true };
  }

  private paraAparelho(id: string, data: FirebaseFirestore.DocumentData): Aparelho {
    return {
      id,
      lojaId: data.lojaId,
      nome: data.nome,
      marca: data.marca,
      modelo: data.modelo,
      cor: data.cor ?? undefined,
      imei: data.imei ?? undefined,
      descricao: data.descricao ?? undefined,
      categoria: data.categoria as Categoria,
      fotoUrl: data.fotoUrl ?? undefined,
      ativo: data.ativo,
      criadoPorUid: data.criadoPorUid,
      criadoEm: data.criadoEm,
    };
  }
}
