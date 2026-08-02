import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { CriarUsuarioInput, Papel, Usuario } from '@phonetrack/shared';
import { FIREBASE_AUTH, FIRESTORE } from '../../firebase/firebase.module';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

const COLECAO = 'usuarios';

export interface AtualizarUsuarioInput {
  nome?: string;
  papel?: Papel;
  lojaIds?: string[];
}

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(FIREBASE_AUTH) private readonly auth: Auth,
    @Inject(FIRESTORE) private readonly firestore: Firestore,
  ) {}

  private validarEscopo(actor: AuthenticatedUser, papelAlvo: Papel, lojaIdsAlvo: string[]) {
    if (actor.papel === 'master') return;

    if (papelAlvo === 'master') {
      throw new ForbiddenException('Apenas Master pode criar outro Master');
    }
    const foraDoEscopo = lojaIdsAlvo.some((id) => !actor.lojaIds.includes(id));
    if (foraDoEscopo) {
      throw new ForbiddenException('Não é possível gerenciar usuários fora das suas lojas');
    }
  }

  async criar(actor: AuthenticatedUser, input: CriarUsuarioInput) {
    this.validarEscopo(actor, input.papel, input.lojaIds);

    let userRecord;
    try {
      userRecord = await this.auth.createUser({
        email: input.email,
        password: input.senha,
        displayName: input.nome,
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'auth/email-already-exists') {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      throw err;
    }

    await this.auth.setCustomUserClaims(userRecord.uid, {
      role: input.papel,
      lojaIds: input.lojaIds,
    });

    const doc = {
      nome: input.nome,
      email: input.email,
      papel: input.papel,
      lojaIds: input.lojaIds,
      ativo: true,
      criadoEm: FieldValue.serverTimestamp(),
    };
    await this.firestore.collection(COLECAO).doc(userRecord.uid).set(doc);

    return this.buscarPorUid(userRecord.uid);
  }

  async listar(lojaId?: string): Promise<Usuario[]> {
    let query = this.firestore.collection(COLECAO).where('ativo', '==', true);
    if (lojaId) {
      query = query.where('lojaIds', 'array-contains', lojaId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }) as Usuario);
  }

  async buscarPorUid(uid: string): Promise<Usuario> {
    const doc = await this.firestore.collection(COLECAO).doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return { uid: doc.id, ...doc.data() } as Usuario;
  }

  async atualizar(actor: AuthenticatedUser, uid: string, input: AtualizarUsuarioInput) {
    const atual = await this.buscarPorUid(uid);
    const papelFinal = input.papel ?? atual.papel;
    const lojaIdsFinal = input.lojaIds ?? atual.lojaIds;
    this.validarEscopo(actor, papelFinal, lojaIdsFinal);

    if (input.papel || input.lojaIds) {
      await this.auth.setCustomUserClaims(uid, { role: papelFinal, lojaIds: lojaIdsFinal });
    }
    if (input.nome) {
      await this.auth.updateUser(uid, { displayName: input.nome });
    }

    await this.firestore.collection(COLECAO).doc(uid).update({ ...input });
    return this.buscarPorUid(uid);
  }

  async desativar(actor: AuthenticatedUser, uid: string) {
    const atual = await this.buscarPorUid(uid);
    this.validarEscopo(actor, atual.papel, atual.lojaIds);

    if (actor.uid === uid) {
      throw new BadRequestException('Não é possível desativar o próprio usuário');
    }

    await this.auth.updateUser(uid, { disabled: true });
    await this.firestore.collection(COLECAO).doc(uid).update({ ativo: false });
    return { uid, ativo: false };
  }
}
