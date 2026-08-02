import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { FIREBASE_AUTH, FIRESTORE } from '../../firebase/firebase.module';
import type { AuthenticatedUser } from '../types/auth-user.type';

/**
 * Verifica o ID token do Firebase Auth e cruza com `usuarios/{uid}` no
 * Firestore como fonte de verdade — as custom claims do token podem estar
 * desatualizadas logo após uma troca de papel/loja (o cliente só as renova
 * no próximo refresh do token).
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_AUTH) private readonly auth: Auth,
    @Inject(FIRESTORE) private readonly firestore: Firestore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação ausente');
    }

    const idToken = authHeader.slice('Bearer '.length);

    let uid: string;
    try {
      const decoded = await this.auth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      throw new UnauthorizedException('Token de autenticação inválido ou expirado');
    }

    const snapshot = await this.firestore.collection('usuarios').doc(uid).get();
    if (!snapshot.exists) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const data = snapshot.data()!;
    if (!data.ativo) {
      throw new UnauthorizedException('Usuário desativado');
    }

    const user: AuthenticatedUser = {
      uid,
      nome: data.nome,
      email: data.email,
      papel: data.papel,
      lojaIds: data.lojaIds ?? [],
      ativo: data.ativo,
    };
    request.user = user;

    return true;
  }
}
