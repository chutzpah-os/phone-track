import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { CountRecord } from '@phonetrack/shared';
import { FIRESTORE } from '../../firebase/firebase.module';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

const COLECAO = 'countRecords';

/**
 * Regra do PRD §5.4: se alguma contagem de um dia anterior não foi
 * finalizada, o sistema bloqueia o avanço para a próxima contagem até
 * Master/Admin desbloquear. Depois de desbloqueada, a pendência para de
 * bloquear novas contagens mas continua existindo até ser resolvida
 * (finalizada) — por qualquer papel — via os mesmos endpoints de
 * marcar/finalizar do ContagensService, sem necessidade de rota própria.
 */
@Injectable()
export class PendenciaService {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  private async buscarCandidatas(lojaId: string, antesDe: string): Promise<CountRecord[]> {
    const snapshot = await this.firestore
      .collection(COLECAO)
      .where('lojaId', '==', lojaId)
      .where('finalizada', '==', false)
      .where('data', '<', antesDe)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CountRecord);
  }

  /** Pendências que ainda bloqueiam o avanço (não desbloqueadas). */
  async encontrarBloqueio(lojaId: string, antesDe: string): Promise<CountRecord | null> {
    const candidatas = await this.buscarCandidatas(lojaId, antesDe);
    const bloqueante = candidatas.find((c) => !c.pendencia?.desbloqueadaEm);
    return bloqueante ?? null;
  }

  /** Todas as pendências (bloqueantes ou já desbloqueadas, mas não resolvidas). */
  async listar(lojaId: string): Promise<CountRecord[]> {
    return this.buscarCandidatas(lojaId, new Date().toISOString().slice(0, 10));
  }

  async desbloquear(lojaId: string, recordId: string, actor: AuthenticatedUser): Promise<CountRecord> {
    const ref = this.firestore.collection(COLECAO).doc(recordId);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Registro não encontrado');

    const registro = { id: snap.id, ...snap.data() } as CountRecord;
    if (registro.lojaId !== lojaId) {
      throw new NotFoundException('Registro não pertence a esta loja');
    }
    if (registro.finalizada) {
      throw new ForbiddenException('Este registro já está finalizado, não é uma pendência');
    }

    await ref.update({
      'pendencia.bloqueada': false,
      'pendencia.desbloqueadaEm': new Date().toISOString(),
      'pendencia.desbloqueadaPorUid': actor.uid,
    });

    return { ...registro, pendencia: { ...registro.pendencia, desbloqueadaEm: new Date().toISOString(), desbloqueadaPorUid: actor.uid } };
  }
}
