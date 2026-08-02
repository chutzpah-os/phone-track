import { Module } from '@nestjs/common';
import { AparelhosModule } from '../aparelhos/aparelhos.module';
import { ResumoModule } from '../resumo/resumo.module';
import { ContagensController } from './contagens.controller';
import { ContagensService } from './contagens.service';
import { PendenciaService } from './pendencia.service';
import { PendenciasController } from './pendencias.controller';

@Module({
  imports: [AparelhosModule, ResumoModule],
  controllers: [ContagensController, PendenciasController],
  providers: [ContagensService, PendenciaService],
  exports: [ContagensService, PendenciaService],
})
export class ContagensModule {}
