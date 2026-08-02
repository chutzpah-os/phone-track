import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { CriarLojaInput } from '@phonetrack/shared';
import { FIRESTORE } from '../../firebase/firebase.module';

const COLECAO = 'lojas';

@Injectable()
export class LojasService {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async criar(input: CriarLojaInput) {
    const ref = this.firestore.collection(COLECAO).doc();
    const doc = {
      nome: input.nome,
      ativo: true,
      contadoresAparelhos: { lacrado: 0, seminovo: 0, americano: 0, total: 0 },
      criadoEm: FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return this.buscarPorId(ref.id);
  }

  async listar(lojaIds?: string[]) {
    let query = this.firestore.collection(COLECAO).where('ativo', '==', true).orderBy('nome');

    if (lojaIds && lojaIds.length > 0) {
      // Firestore "in" suporta até 30 valores — volume compatível com o MVP (cliente único).
      query = query.where('__name__', 'in', lojaIds.map((id) => this.firestore.collection(COLECAO).doc(id)));
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async buscarPorId(lojaId: string) {
    const doc = await this.firestore.collection(COLECAO).doc(lojaId).get();
    if (!doc.exists) {
      throw new NotFoundException('Loja não encontrada');
    }
    return { id: doc.id, ...doc.data() };
  }

  async atualizar(lojaId: string, input: Partial<CriarLojaInput>) {
    await this.buscarPorId(lojaId);
    await this.firestore.collection(COLECAO).doc(lojaId).update(input);
    return this.buscarPorId(lojaId);
  }
}
