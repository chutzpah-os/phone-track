import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  AdicionarAparelhoDuranteFechamentoInput,
  Categoria,
  ContadoresContagem,
  CountItem,
  CountRecord,
  MarcarItemContagemInput,
  StatusContagemFinal,
} from '@phonetrack/shared';
import { CATEGORIAS, STATUS_QUE_DESATIVAM_APARELHO } from '@phonetrack/shared';
import { FIRESTORE } from '../../firebase/firebase.module';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AparelhosService } from '../aparelhos/aparelhos.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ResumoService } from '../resumo/resumo.service';
import { PendenciaService } from './pendencia.service';

const COLECAO = 'countRecords';
const TAMANHO_LOTE = 400;

function contadoresVazios(): ContadoresContagem {
  const porCategoria = Object.fromEntries(
    CATEGORIAS.map((c) => [c, { esperado: 0, conferido: 0 }]),
  ) as ContadoresContagem['porCategoria'];
  return { porCategoria, total: { esperado: 0, conferido: 0 } };
}

@Injectable()
export class ContagensService {
  constructor(
    @Inject(FIRESTORE) private readonly firestore: Firestore,
    private readonly aparelhosService: AparelhosService,
    private readonly pendenciaService: PendenciaService,
    private readonly auditoriaService: AuditoriaService,
    private readonly resumoService: ResumoService,
  ) {}

  hojeISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private idRegistro(lojaId: string, data: string, tipo: 'primeira' | 'final') {
    return `${lojaId}_${data}_${tipo}`;
  }

  private async buscarRegistroOuNull(id: string): Promise<CountRecord | null> {
    const doc = await this.firestore.collection(COLECAO).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as CountRecord;
  }

  async buscarRegistro(id: string): Promise<CountRecord> {
    const registro = await this.buscarRegistroOuNull(id);
    if (!registro) throw new NotFoundException('Registro de contagem não encontrado');
    return registro;
  }

  async status(lojaId: string) {
    const data = this.hojeISO();
    const [primeira, final, pendencias] = await Promise.all([
      this.buscarRegistroOuNull(this.idRegistro(lojaId, data, 'primeira')),
      this.buscarRegistroOuNull(this.idRegistro(lojaId, data, 'final')),
      this.pendenciaService.listar(lojaId),
    ]);

    let etapaAtual: 'primeira' | 'final' | 'concluido';
    if (!primeira || !primeira.finalizada) etapaAtual = 'primeira';
    else if (!final || !final.finalizada) etapaAtual = 'final';
    else etapaAtual = 'concluido';

    const bloqueio = pendencias.find((p) => !p.pendencia?.desbloqueadaEm) ?? null;

    return { data, etapaAtual, primeira, final, pendencias, bloqueio };
  }

  async porData(
    lojaId: string,
    data: string,
  ): Promise<{ data: string; primeira: CountRecord | null; final: CountRecord | null }> {
    const [primeira, final] = await Promise.all([
      this.buscarRegistroOuNull(this.idRegistro(lojaId, data, 'primeira')),
      this.buscarRegistroOuNull(this.idRegistro(lojaId, data, 'final')),
    ]);
    return { data, primeira, final };
  }

  async abrirPrimeira(lojaId: string, actor: AuthenticatedUser): Promise<CountRecord> {
    const data = this.hojeISO();

    const bloqueio = await this.pendenciaService.encontrarBloqueio(lojaId, data);
    if (bloqueio) {
      throw new ConflictException(
        `Existe uma contagem pendente de ${bloqueio.data}. Resolva antes de continuar.`,
      );
    }

    const id = this.idRegistro(lojaId, data, 'primeira');
    const existente = await this.buscarRegistroOuNull(id);
    if (existente) return existente;

    const aparelhos = await this.aparelhosService.listar(lojaId);
    const contadores = contadoresVazios();
    for (const aparelho of aparelhos) {
      contadores.porCategoria[aparelho.categoria].esperado++;
      contadores.total.esperado++;
    }

    const registro: Omit<CountRecord, 'id'> = {
      lojaId,
      data,
      dataOriginal: data,
      tipo: 'primeira',
      finalizada: false,
      responsavelAberturaUid: actor.uid,
      horarioAbertura: new Date().toISOString(),
      contadores,
      fotos: [],
      pendencia: { bloqueada: false },
    };

    await this.criarRegistroComItens(id, registro, aparelhos, data, 'primeira');
    return this.buscarRegistro(id);
  }

  async abrirFinal(lojaId: string, actor: AuthenticatedUser): Promise<CountRecord> {
    const data = this.hojeISO();

    const bloqueio = await this.pendenciaService.encontrarBloqueio(lojaId, data);
    if (bloqueio) {
      throw new ConflictException(
        `Existe uma contagem pendente de ${bloqueio.data}. Resolva antes de continuar.`,
      );
    }

    const idPrimeira = this.idRegistro(lojaId, data, 'primeira');
    const primeira = await this.buscarRegistroOuNull(idPrimeira);
    if (!primeira || !primeira.finalizada) {
      throw new ConflictException('Primeira Contagem ainda não finalizada.');
    }

    const idFinal = this.idRegistro(lojaId, data, 'final');
    const existente = await this.buscarRegistroOuNull(idFinal);
    if (existente) return existente;

    const itensPrimeira = await this.listarItens(idPrimeira);
    const contadores = contadoresVazios();
    for (const item of itensPrimeira) {
      contadores.porCategoria[item.categoria].esperado++;
      contadores.total.esperado++;
    }

    const registro: Omit<CountRecord, 'id'> = {
      lojaId,
      data,
      dataOriginal: data,
      tipo: 'final',
      finalizada: false,
      responsavelAberturaUid: actor.uid,
      horarioAbertura: new Date().toISOString(),
      contadores,
      fotos: [],
      pendencia: { bloqueada: false },
    };

    const itensParaCriar = itensPrimeira.map((item) => ({
      id: item.deviceId,
      lojaId,
      nome: item.nome,
      marca: item.marca,
      modelo: item.modelo,
      categoria: item.categoria,
    }));

    await this.criarRegistroComItensBrutos(idFinal, registro, itensParaCriar, data, 'final');
    return this.buscarRegistro(idFinal);
  }

  private async criarRegistroComItens(
    id: string,
    registro: Omit<CountRecord, 'id'>,
    aparelhos: Awaited<ReturnType<AparelhosService['listar']>>,
    data: string,
    tipo: 'primeira' | 'final',
  ) {
    const itens = aparelhos.map((a) => ({
      id: a.id,
      lojaId: a.lojaId,
      nome: a.nome,
      marca: a.marca,
      modelo: a.modelo,
      categoria: a.categoria,
    }));
    await this.criarRegistroComItensBrutos(id, registro, itens, data, tipo);
  }

  private async criarRegistroComItensBrutos(
    id: string,
    registro: Omit<CountRecord, 'id'>,
    itens: { id: string; lojaId: string; nome: string; marca: string; modelo: string; categoria: Categoria }[],
    data: string,
    tipo: 'primeira' | 'final',
  ) {
    const registroRef = this.firestore.collection(COLECAO).doc(id);

    for (let inicio = 0; inicio < itens.length; inicio += TAMANHO_LOTE) {
      const lote = this.firestore.batch();
      if (inicio === 0) {
        lote.set(registroRef, registro);
      }
      for (const item of itens.slice(inicio, inicio + TAMANHO_LOTE)) {
        const itemRef = registroRef.collection('items').doc(item.id);
        const countItem: Omit<CountItem, 'status' | 'observacao' | 'marcadoPorUid' | 'marcadoEm'> = {
          deviceId: item.id,
          lojaId: item.lojaId,
          tipoContagem: tipo,
          nome: item.nome,
          marca: item.marca,
          modelo: item.modelo,
          categoria: item.categoria,
          data,
        };
        lote.set(itemRef, countItem);
      }
      await lote.commit();
    }

    if (itens.length === 0) {
      await registroRef.set(registro);
    }
  }

  async listarItens(recordId: string): Promise<CountItem[]> {
    const snapshot = await this.firestore
      .collection(COLECAO)
      .doc(recordId)
      .collection('items')
      .orderBy('nome')
      .get();
    return snapshot.docs.map((doc) => doc.data() as CountItem);
  }

  private garantirAcessoLoja(actor: AuthenticatedUser, lojaId: string) {
    if (actor.papel !== 'master' && !actor.lojaIds.includes(lojaId)) {
      throw new ForbiddenException('Usuário não tem acesso a esta loja');
    }
  }

  async marcarPresenca(
    lojaId: string,
    recordId: string,
    deviceId: string,
    actor: AuthenticatedUser,
    presente: boolean,
  ): Promise<CountItem> {
    this.garantirAcessoLoja(actor, lojaId);
    const registroRef = this.firestore.collection(COLECAO).doc(recordId);
    const itemRef = registroRef.collection('items').doc(deviceId);

    return this.firestore.runTransaction(async (tx) => {
      const [registroSnap, itemSnap] = await Promise.all([tx.get(registroRef), tx.get(itemRef)]);
      if (!registroSnap.exists) throw new NotFoundException('Registro não encontrado');
      if (!itemSnap.exists) throw new NotFoundException('Item não encontrado');

      const registro = registroSnap.data() as CountRecord;
      if (registro.finalizada) {
        throw new ForbiddenException('Esta contagem já foi finalizada e não pode ser editada');
      }

      const item = itemSnap.data() as CountItem;
      const jaEstavaPresente = item.status === 'presente';

      const novoItem: CountItem = {
        ...item,
        status: presente ? 'presente' : undefined,
        marcadoPorUid: actor.uid,
        marcadoEm: new Date().toISOString(),
      };
      tx.set(itemRef, novoItem);

      if (presente !== jaEstavaPresente) {
        const delta = presente ? 1 : -1;
        tx.update(registroRef, {
          [`contadores.porCategoria.${item.categoria}.conferido`]: FieldValue.increment(delta),
          'contadores.total.conferido': FieldValue.increment(delta),
        });
      }

      return novoItem;
    });
  }

  async marcarStatusFinal(
    lojaId: string,
    recordId: string,
    deviceId: string,
    actor: AuthenticatedUser,
    input: MarcarItemContagemInput,
  ): Promise<CountItem> {
    this.garantirAcessoLoja(actor, lojaId);
    const registroRef = this.firestore.collection(COLECAO).doc(recordId);
    const itemRef = registroRef.collection('items').doc(deviceId);

    const { item: novoItem, statusAnterior } = await this.firestore.runTransaction(async (tx) => {
      const [registroSnap, itemSnap] = await Promise.all([tx.get(registroRef), tx.get(itemRef)]);
      if (!registroSnap.exists) throw new NotFoundException('Registro não encontrado');
      if (!itemSnap.exists) throw new NotFoundException('Item não encontrado');

      const registro = registroSnap.data() as CountRecord;
      if (registro.finalizada) {
        throw new ForbiddenException('Esta contagem já foi finalizada e não pode ser editada');
      }

      const item = itemSnap.data() as CountItem;
      const jaEstavaConferido = item.status !== undefined;
      const statusAnterior = item.status as StatusContagemFinal | undefined;

      const itemAtualizado: CountItem = {
        ...item,
        status: input.status,
        observacao: input.status === 'outro' ? input.observacao : undefined,
        marcadoPorUid: actor.uid,
        marcadoEm: new Date().toISOString(),
      };
      tx.set(itemRef, itemAtualizado);

      if (!jaEstavaConferido) {
        tx.update(registroRef, {
          [`contadores.porCategoria.${item.categoria}.conferido`]: FieldValue.increment(1),
          'contadores.total.conferido': FieldValue.increment(1),
        });
      }

      return { item: itemAtualizado, statusAnterior };
    });

    // Vendido/Transferido/Saiu tiram o aparelho do estoque ativo da loja —
    // mesma regra de soft-delete usada na exclusão manual (PRD §4.4), aqui
    // disparada como efeito colateral da marcação no fechamento. Se o staff
    // corrigir o status antes de finalizar, o aparelho volta a ficar ativo.
    const antesDesativava = statusAnterior && STATUS_QUE_DESATIVAM_APARELHO.includes(statusAnterior);
    const agoraDesativa = STATUS_QUE_DESATIVAM_APARELHO.includes(input.status);

    if (agoraDesativa && !antesDesativava) {
      await this.aparelhosService.excluir(lojaId, deviceId, actor);
      await this.auditoriaService.log({
        lojaId,
        actorUid: actor.uid,
        actorNome: actor.nome,
        actorPapel: actor.papel,
        acao: 'aparelho.excluir',
        entidadeTipo: 'aparelho',
        entidadeId: deviceId,
        detalhes: { motivo: input.status, recordId },
      });
    } else if (!agoraDesativa && antesDesativava) {
      await this.aparelhosService.reativar(lojaId, deviceId, actor);
    }

    return novoItem;
  }

  async adicionarAparelhoDuranteFechamento(
    lojaId: string,
    recordId: string,
    actor: AuthenticatedUser,
    input: AdicionarAparelhoDuranteFechamentoInput,
  ) {
    this.garantirAcessoLoja(actor, lojaId);
    const registro = await this.buscarRegistro(recordId);
    if (registro.tipo !== 'final') {
      throw new ForbiddenException('Só é possível adicionar aparelhos durante o fechamento');
    }
    if (registro.finalizada) {
      throw new ForbiddenException('Esta contagem já foi finalizada');
    }

    const aparelho = await this.aparelhosService.criar(lojaId, actor, input);

    const registroRef = this.firestore.collection(COLECAO).doc(recordId);
    const itemRef = registroRef.collection('items').doc(aparelho.id);
    const countItem: CountItem = {
      deviceId: aparelho.id,
      lojaId,
      tipoContagem: 'final',
      nome: aparelho.nome,
      marca: aparelho.marca,
      modelo: aparelho.modelo,
      categoria: aparelho.categoria,
      data: registro.data,
    };

    await this.firestore.runTransaction(async (tx) => {
      tx.set(itemRef, countItem);
      tx.update(registroRef, {
        [`contadores.porCategoria.${aparelho.categoria}.esperado`]: FieldValue.increment(1),
        'contadores.total.esperado': FieldValue.increment(1),
      });
    });

    return { aparelho, item: countItem };
  }

  async finalizar(
    lojaId: string,
    recordId: string,
    actor: AuthenticatedUser,
    fotos: string[] = [],
  ): Promise<CountRecord> {
    this.garantirAcessoLoja(actor, lojaId);
    const registroRef = this.firestore.collection(COLECAO).doc(recordId);

    const registro = await this.firestore.runTransaction(async (tx) => {
      const snap = await tx.get(registroRef);
      if (!snap.exists) throw new NotFoundException('Registro não encontrado');
      const atual = { id: snap.id, ...snap.data() } as CountRecord;

      if (atual.finalizada) {
        return atual;
      }

      tx.update(registroRef, {
        finalizada: true,
        responsavelFinalizacaoUid: actor.uid,
        horarioFinalizacao: new Date().toISOString(),
        fotos,
      });

      return { ...atual, finalizada: true, responsavelFinalizacaoUid: actor.uid, fotos };
    });

    // Ao finalizar a Contagem Final, o Resumo do Dia é gerado automaticamente
    // (nunca digitado) e congelado — não recalculado em leituras futuras.
    if (registro.tipo === 'final') {
      await this.resumoService.armazenar(lojaId, registro.data);
    }

    return registro;
  }
}
