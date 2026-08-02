import { Module } from '@nestjs/common';
import { ResumoController } from './resumo.controller';
import { ResumoService } from './resumo.service';

@Module({
  controllers: [ResumoController],
  providers: [ResumoService],
  exports: [ResumoService],
})
export class ResumoModule {}
