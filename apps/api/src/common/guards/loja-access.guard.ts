import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Garante que o usuário autenticado tem acesso à loja referenciada na rota
 * (`:lojaId`). Master tem acesso a todas; Admin/Staff só às lojas em
 * `user.lojaIds`. Deve vir sempre depois do FirebaseAuthGuard na cadeia.
 */
@Injectable()
export class LojaAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const rawLojaId = request.params.lojaId;
    const lojaId = Array.isArray(rawLojaId) ? rawLojaId[0] : rawLojaId;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (!lojaId) {
      return true;
    }

    if (user.papel === 'master' || user.lojaIds.includes(lojaId)) {
      return true;
    }

    throw new ForbiddenException('Usuário não tem acesso a esta loja');
  }
}
