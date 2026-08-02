import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { HealthController } from './health/health.controller';
import { AparelhosModule } from './modules/aparelhos/aparelhos.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContagensModule } from './modules/contagens/contagens.module';
import { LojasModule } from './modules/lojas/lojas.module';
import { ResumoModule } from './modules/resumo/resumo.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    AuditoriaModule,
    AuthModule,
    LojasModule,
    UsuariosModule,
    AparelhosModule,
    ContagensModule,
    ResumoModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
