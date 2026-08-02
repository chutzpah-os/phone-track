import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LojaAccessGuard } from '../../common/guards/loja-access.guard';
import { ResumoService } from './resumo.service';

@Controller('lojas/:lojaId/relatorios')
@UseGuards(FirebaseAuthGuard, RolesGuard, LojaAccessGuard)
export class ResumoController {
  constructor(private readonly resumoService: ResumoService) {}

  @Get()
  listar(
    @Param('lojaId') lojaId: string,
    @Query('de') de?: string,
    @Query('ate') ate?: string,
  ) {
    const hoje = new Date().toISOString().slice(0, 10);
    const trintaDiasAtras = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return this.resumoService.listar(lojaId, de ?? trintaDiasAtras, ate ?? hoje);
  }

  @Get(':data')
  buscar(@Param('lojaId') lojaId: string, @Param('data') data: string) {
    return this.resumoService.buscar(lojaId, data);
  }
}
