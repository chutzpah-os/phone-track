import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LojaAccessGuard } from '../../common/guards/loja-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PendenciaService } from './pendencia.service';

@Controller('lojas/:lojaId/pendencias')
@UseGuards(FirebaseAuthGuard, RolesGuard, LojaAccessGuard)
export class PendenciasController {
  constructor(
    private readonly pendenciaService: PendenciaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Get()
  listar(@Param('lojaId') lojaId: string) {
    return this.pendenciaService.listar(lojaId);
  }

  @Post(':recordId/desbloquear')
  @Roles('master', 'admin')
  async desbloquear(
    @Param('lojaId') lojaId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const registro = await this.pendenciaService.desbloquear(lojaId, recordId, actor);
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'pendencia.desbloquear',
      entidadeTipo: 'countRecord',
      entidadeId: registro.id,
      detalhes: { tipo: registro.tipo, data: registro.data },
    });
    return registro;
  }
}
