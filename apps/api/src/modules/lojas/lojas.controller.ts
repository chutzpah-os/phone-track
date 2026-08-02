import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { criarLojaSchema } from '@phonetrack/shared';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LojaAccessGuard } from '../../common/guards/loja-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { LojasService } from './lojas.service';

@Controller('lojas')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class LojasController {
  constructor(
    private readonly lojasService: LojasService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Post()
  @Roles('master')
  async criar(@Body(new ZodValidationPipe(criarLojaSchema)) body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const loja = await this.lojasService.criar(body as never);
    await this.auditoriaService.log({
      lojaId: loja.id,
      actorUid: user.uid,
      actorNome: user.nome,
      actorPapel: user.papel,
      acao: 'loja.criar',
      entidadeTipo: 'loja',
      entidadeId: loja.id,
    });
    return loja;
  }

  @Get()
  listar(@CurrentUser() user: AuthenticatedUser) {
    return this.lojasService.listar(user.papel === 'master' ? undefined : user.lojaIds);
  }

  @Get(':lojaId')
  @UseGuards(LojaAccessGuard)
  buscar(@Param('lojaId') lojaId: string) {
    return this.lojasService.buscarPorId(lojaId);
  }

  @Patch(':lojaId')
  @Roles('master', 'admin')
  @UseGuards(LojaAccessGuard)
  async atualizar(
    @Param('lojaId') lojaId: string,
    @Body(new ZodValidationPipe(criarLojaSchema.partial())) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const loja = await this.lojasService.atualizar(lojaId, body as never);
    await this.auditoriaService.log({
      lojaId,
      actorUid: user.uid,
      actorNome: user.nome,
      actorPapel: user.papel,
      acao: 'loja.editar',
      entidadeTipo: 'loja',
      entidadeId: lojaId,
    });
    return loja;
  }
}
