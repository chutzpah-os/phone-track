import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LojaAccessGuard } from '../../common/guards/loja-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditoriaService } from './auditoria.service';

@Controller('lojas/:lojaId/auditoria')
@UseGuards(FirebaseAuthGuard, RolesGuard, LojaAccessGuard)
@Roles('master', 'admin')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  listar(
    @Param('lojaId') lojaId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = Math.min(Number(limit) || 50, 200);
    return this.auditoriaService.listar(lojaId, { limit: parsedLimit, cursor });
  }
}
