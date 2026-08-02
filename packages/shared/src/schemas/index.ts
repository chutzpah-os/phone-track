import { z } from 'zod';
import { CATEGORIAS, PAPEIS, STATUS_CONTAGEM_FINAL } from '../constants';

export const categoriaSchema = z.enum(CATEGORIAS);
export const papelSchema = z.enum(PAPEIS);
export const statusContagemFinalSchema = z.enum(STATUS_CONTAGEM_FINAL);

export const criarAparelhoSchema = z.object({
  nome: z.string().min(1),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  categoria: categoriaSchema,
  cor: z.string().optional(),
  imei: z.string().optional(),
  descricao: z.string().optional(),
  fotoUrl: z.string().url().optional(),
});
export type CriarAparelhoInput = z.infer<typeof criarAparelhoSchema>;

export const atualizarAparelhoSchema = criarAparelhoSchema.partial();
export type AtualizarAparelhoInput = z.infer<typeof atualizarAparelhoSchema>;

export const criarUsuarioSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  papel: papelSchema,
  lojaIds: z.array(z.string().min(1)).min(1),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const criarLojaSchema = z.object({
  nome: z.string().min(1),
});
export type CriarLojaInput = z.infer<typeof criarLojaSchema>;

export const marcarItemContagemSchema = z
  .object({
    status: statusContagemFinalSchema,
    observacao: z.string().optional(),
  })
  .refine((data) => data.status !== 'outro' || !!data.observacao?.trim(), {
    message: 'Observação é obrigatória quando o status é "Outro"',
    path: ['observacao'],
  });
export type MarcarItemContagemInput = z.infer<typeof marcarItemContagemSchema>;

export const marcarPresencaSchema = z.object({
  presente: z.boolean(),
});
export type MarcarPresencaInput = z.infer<typeof marcarPresencaSchema>;

export const adicionarAparelhoDuranteFechamentoSchema = z.object({
  nome: z.string().min(1),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  categoria: categoriaSchema,
});
export type AdicionarAparelhoDuranteFechamentoInput = z.infer<
  typeof adicionarAparelhoDuranteFechamentoSchema
>;
