import { Inject, Injectable } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import type {
  Categoria,
  ContadoresPorCategoria,
  CountItem,
  DailySummary,
  StatusContagemFinal,
} from '@phonetrack/shared';
import { CATEGORIAS, STATUS_CONTAGEM_FINAL, STATUS_ENTRADA, STATUS_SAIDA } from '@phonetrack/shared';
import { FIRESTORE } from '../../firebase/firebase.module';

const COLECAO_CONTAGENS = 'countRecords';
const COLECAO_RESUMOS = 'dailySummaries';

function contadoresVazios(): ContadoresPorCategoria {
  return { lacrado: 0, seminovo: 0, americano: 0, total: 0 };
}

function contarPorCategoria(itens: CountItem[], predicado: (item: CountItem) => boolean): ContadoresPorCategoria {
  const contadores = contadoresVazios();
  for (const item of itens) {
    if (predicado(item)) {
      contadores[item.categoria]++;
      contadores.total++;
    }
  }
  return contadores;
}

@Injectable()
export class ResumoService {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  private async listarItens(recordId: string): Promise<CountItem[]> {
    const snapshot = await this.firestore
      .collection(COLECAO_CONTAGENS)
      .doc(recordId)
      .collection('items')
      .get();
    return snapshot.docs.map((doc) => doc.data() as CountItem);
  }

  /** Calcula o resumo do dia a partir dos registros de contagem — nunca digitado, sempre derivado. */
  async calcular(lojaId: string, data: string): Promise<DailySummary | null> {
    const idPrimeira = `${lojaId}_${data}_primeira`;
    const idFinal = `${lojaId}_${data}_final`;

    const [primeiraSnap, finalSnap] = await Promise.all([
      this.firestore.collection(COLECAO_CONTAGENS).doc(idPrimeira).get(),
      this.firestore.collection(COLECAO_CONTAGENS).doc(idFinal).get(),
    ]);

    if (!primeiraSnap.exists) {
      return null;
    }

    const [itensPrimeira, itensFinal] = await Promise.all([
      this.listarItens(idPrimeira),
      finalSnap.exists ? this.listarItens(idFinal) : Promise.resolve<CountItem[]>([]),
    ]);

    const primeiraContadores = contarPorCategoria(itensPrimeira, (i) => i.status === 'presente');

    const movimentacoes = Object.fromEntries(
      STATUS_CONTAGEM_FINAL.map((s) => [s, 0]),
    ) as Record<StatusContagemFinal, number>;
    for (const item of itensFinal) {
      if (item.status) {
        movimentacoes[item.status as StatusContagemFinal]++;
      }
    }

    const saidas = STATUS_SAIDA.reduce((soma, status) => soma + movimentacoes[status], 0);
    const entradas = STATUS_ENTRADA.reduce((soma, status) => soma + movimentacoes[status], 0);
    const totalEsperado = primeiraContadores.total - saidas + entradas;

    const finalContadores = contarPorCategoria(
      itensFinal,
      (i) => i.status === 'continua' || i.status === 'entrada',
    );

    const naoConferidos = itensFinal.filter((i) => i.status === undefined);
    const divergentes = naoConferidos.map((i) => ({
      deviceId: i.deviceId,
      nome: i.nome,
      motivo: 'Não conferido no fechamento',
    }));

    const statusFinal: 'ok' | 'divergencia' =
      finalSnap.exists && divergentes.length === 0 && totalEsperado === finalContadores.total
        ? 'ok'
        : 'divergencia';

    return {
      id: `${lojaId}_${data}`,
      lojaId,
      data,
      primeiraContadores,
      movimentacoes,
      totalEsperado,
      finalContadores,
      statusFinal,
      divergentes,
    };
  }

  /** Congela o resumo do dia no momento em que a Contagem Final é finalizada. */
  async armazenar(lojaId: string, data: string): Promise<DailySummary | null> {
    const resumo = await this.calcular(lojaId, data);
    if (!resumo) return null;
    await this.firestore.collection(COLECAO_RESUMOS).doc(resumo.id).set(resumo);
    return resumo;
  }

  /** Lê o resumo congelado; se o dia ainda não fechou, calcula uma prévia sob demanda. */
  async buscar(lojaId: string, data: string): Promise<DailySummary | null> {
    const doc = await this.firestore.collection(COLECAO_RESUMOS).doc(`${lojaId}_${data}`).get();
    if (doc.exists) {
      return doc.data() as DailySummary;
    }
    return this.calcular(lojaId, data);
  }

  async listar(lojaId: string, de: string, ate: string): Promise<DailySummary[]> {
    const snapshot = await this.firestore
      .collection(COLECAO_RESUMOS)
      .where('lojaId', '==', lojaId)
      .where('data', '>=', de)
      .where('data', '<=', ate)
      .orderBy('data', 'desc')
      .get();
    return snapshot.docs.map((doc) => doc.data() as DailySummary);
  }
}
