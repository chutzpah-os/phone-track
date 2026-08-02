import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { criarUsuarioSchema } from '@phonetrack/shared';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { UsuariosService, type AtualizarUsuarioInput } from './usuarios.service';

@Controller('usuarios')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('master', 'admin')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Post()
  async criar(
    @Body(new ZodValidationPipe(criarUsuarioSchema)) body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const usuario = await this.usuariosService.criar(actor, body as never);
    await this.auditoriaService.log({
      lojaId: usuario.lojaIds[0],
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'usuario.criar',
      entidadeTipo: 'usuario',
      entidadeId: usuario.uid,
    });
    return usuario;
  }

  @Get()
  listar(@Query('lojaId') lojaId?: string) {
    return this.usuariosService.listar(lojaId);
  }

  @Patch(':uid')
  async atualizar(
    @Param('uid') uid: string,
    @Body() body: AtualizarUsuarioInput,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const usuario = await this.usuariosService.atualizar(actor, uid, body);
    await this.auditoriaService.log({
      lojaId: usuario.lojaIds[0],
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'usuario.editar',
      entidadeTipo: 'usuario',
      entidadeId: uid,
    });
    return usuario;
  }

  @Delete(':uid')
  async desativar(@Param('uid') uid: string, @CurrentUser() actor: AuthenticatedUser) {
    const resultado = await this.usuariosService.desativar(actor, uid);
    await this.auditoriaService.log({
      lojaId: actor.lojaIds[0] ?? 'n/a',
      actorUid: actor.uid,
      actorNome: actor.nome,
      actorPapel: actor.papel,
      acao: 'usuario.desativar',
      entidadeTipo: 'usuario',
      entidadeId: uid,
    });
    return resultado;
  }
}
