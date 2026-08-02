import { Inject, Injectable } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { AcaoAuditoria, AuditLog, Papel } from '@phonetrack/shared';
import { FIRESTORE } from '../../firebase/firebase.module';

export interface RegistrarAuditoriaInput {
  lojaId: string;
  actorUid: string;
  actorNome: string;
  actorPapel: Papel;
  acao: AcaoAuditoria;
  entidadeTipo?: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
}

@Injectable()
export class AuditoriaService {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async log(input: RegistrarAuditoriaInput): Promise<void> {
    await this.firestore.collection('auditLogs').add({
      ...input,
      timestamp: FieldValue.serverTimestamp(),
    });
  }

  async listarPorEntidade(entidadeTipo: string, entidadeId: string): Promise<AuditLog[]> {
    const snapshot = await this.firestore
      .collection('auditLogs')
      .where('entidadeTipo', '==', entidadeTipo)
      .where('entidadeId', '==', entidadeId)
      .orderBy('timestamp', 'asc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AuditLog);
  }

  async listar(lojaId: string, opts: { limit: number; cursor?: string }) {
    let query = this.firestore
      .collection('auditLogs')
      .where('lojaId', '==', lojaId)
      .orderBy('timestamp', 'desc')
      .limit(opts.limit);

    if (opts.cursor) {
      const cursorDoc = await this.firestore.collection('auditLogs').doc(opts.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}
