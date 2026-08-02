import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { atualizarAparelhoSchema, criarAparelhoSchema } from '@phonetrack/shared';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LojaAccessGuard } from '../../common/guards/loja-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AparelhosService } from './aparelhos.service';

@Controller()
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AparelhosController {
  constructor(
    private readonly aparelhosService: AparelhosService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Post('lojas/:lojaId/aparelhos')
  @UseGuards(LojaAccessGuard)
  async criar(
    @Param('lojaId') lojaId: string,
    @Body(new ZodValidationPipe(criarAparelhoSchema)) body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const aparelho = await this.aparelhosService.criar(lojaId, actor, body as never);
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'aparelho.criar',
      entidadeTipo: 'aparelho',
      entidadeId: aparelho.id,
    });
    return aparelho;
  }

  @Get('lojas/:lojaId/aparelhos')
  @UseGuards(LojaAccessGuard)
  listar(@Param('lojaId') lojaId: string) {
    return this.aparelhosService.listar(lojaId);
  }

  @Get('aparelhos/:id')
  async buscar(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    const resultado = await this.aparelhosService.buscarComHistorico(id);
    if (actor.papel !== 'master' && !actor.lojaIds.includes(resultado.aparelho.lojaId)) {
      throw new ForbiddenException('Usuário não tem acesso a esta loja');
    }
    return resultado;
  }

  @Patch('lojas/:lojaId/aparelhos/:id')
  @Roles('master', 'admin')
  @UseGuards(LojaAccessGuard)
  async atualizar(
    @Param('lojaId') lojaId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(atualizarAparelhoSchema)) body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const aparelho = await this.aparelhosService.atualizar(lojaId, id, actor, body as never);
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'aparelho.editar',
      entidadeTipo: 'aparelho',
      entidadeId: id,
      detalhes: body as Record<string, unknown>,
    });
    return aparelho;
  }

  @Delete('lojas/:lojaId/aparelhos/:id')
  @Roles('master', 'admin')
  @UseGuards(LojaAccessGuard)
  async excluir(
    @Param('lojaId') lojaId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const resultado = await this.aparelhosService.excluir(lojaId, id, actor);
    await this.auditoriaService.log({
      lojaId,
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'aparelho.excluir',
      entidadeTipo: 'aparelho',
      entidadeId: id,
    });
    return resultado;
  }
}
