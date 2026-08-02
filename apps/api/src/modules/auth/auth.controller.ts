import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Controller('auth')
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post('session')
  async abrirSessao(@CurrentUser() user: AuthenticatedUser) {
    await this.auditoriaService.log({
      lojaId: user.lojaIds[0] ?? 'n/a',
      actorUid: user.uid,
      actorNome: user.nome,
      actorPapel: user.papel,
      acao: 'login',
    });
    return user;
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
