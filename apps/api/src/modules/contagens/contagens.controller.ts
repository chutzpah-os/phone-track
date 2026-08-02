import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  adicionarAparelhoDuranteFechamentoSchema,
  marcarItemContagemSchema,
  marcarPresencaSchema,
} from '@phonetrack/shared';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LojaAccessGuard } from '../../common/guards/loja-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ContagensService } from './contagens.service';

@Controller('lojas/:lojaId/contagens')
@UseGuards(FirebaseAuthGuard, RolesGuard, LojaAccessGuard)
export class ContagensController {
  constructor(
    private readonly contagensService: ContagensService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Get('status')
  status(@Param('lojaId') lojaId: string) {
    return this.contagensService.status(lojaId);
  }

  @Post('primeira/abrir')
  async abrirPrimeira(@Param('lojaId') lojaId: string, @CurrentUser() actor: AuthenticatedUser) {
    const registro = await this.contagensService.abrirPrimeira(lojaId, actor);
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'contagem.abrir',
      entidadeTipo: 'countRecord',
      entidadeId: registro.id,
      detalhes: { tipo: 'primeira', data: registro.data },
    });
    return registro;
  }

  @Post('final/abrir')
  async abrirFinal(@Param('lojaId') lojaId: string, @CurrentUser() actor: AuthenticatedUser) {
    const registro = await this.contagensService.abrirFinal(lojaId, actor);
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'contagem.abrir',
      entidadeTipo: 'countRecord',
      entidadeId: registro.id,
      detalhes: { tipo: 'final', data: registro.data },
    });
    return registro;
  }

  @Get('historico/:data')
  porData(@Param('lojaId') lojaId: string, @Param('data') data: string) {
    return this.contagensService.porData(lojaId, data);
  }

  @Get(':recordId/itens')
  async itens(@Param('recordId') recordId: string) {
    const [registro, itens] = await Promise.all([
      this.contagensService.buscarRegistro(recordId),
      this.contagensService.listarItens(recordId),
    ]);
    return { registro, itens };
  }

  @Patch(':recordId/itens/:deviceId/presenca')
  marcarPresenca(
    @Param('lojaId') lojaId: string,
    @Param('recordId') recordId: string,
    @Param('deviceId') deviceId: string,
    @Body(new ZodValidationPipe(marcarPresencaSchema)) body: { presente: boolean },
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.contagensService.marcarPresenca(lojaId, recordId, deviceId, actor, body.presente);
  }

  @Patch(':recordId/itens/:deviceId/status')
  marcarStatusFinal(
    @Param('lojaId') lojaId: string,
    @Param('recordId') recordId: string,
    @Param('deviceId') deviceId: string,
    @Body(new ZodValidationPipe(marcarItemContagemSchema)) body: never,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.contagensService.marcarStatusFinal(lojaId, recordId, deviceId, actor, body);
  }

  @Post(':recordId/aparelhos')
  async adicionarAparelho(
    @Param('lojaId') lojaId: string,
    @Param('recordId') recordId: string,
    @Body(new ZodValidationPipe(adicionarAparelhoDuranteFechamentoSchema)) body: never,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const resultado = await this.contagensService.adicionarAparelhoDuranteFechamento(
      lojaId,
      recordId,
      actor,
      body,
    );
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'contagem.item.adicionar_durante_fechamento',
      entidadeTipo: 'aparelho',
      entidadeId: resultado.aparelho.id,
      detalhes: { recordId },
    });
    return resultado;
  }

  @Post(':recordId/finalizar')
  async finalizar(
    @Param('lojaId') lojaId: string,
    @Param('recordId') recordId: string,
    @Body('fotos') fotos: string[] | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const registro = await this.contagensService.finalizar(lojaId, recordId, actor, fotos ?? []);
    const foiPendencia = registro.data !== this.contagensService.hojeISO();
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: foiPendencia ? 'pendencia.resolver' : 'contagem.finalizar',
      entidadeTipo: 'countRecord',
      entidadeId: registro.id,
      detalhes: { tipo: registro.tipo, data: registro.data },
    });
    return registro;
  }
}
