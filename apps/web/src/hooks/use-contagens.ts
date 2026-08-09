"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdicionarAparelhoDuranteFechamentoInput,
  Aparelho,
  CountItem,
  CountRecord,
  MarcarItemContagemInput,
} from "@phonetrack/shared";
import { api } from "@/lib/api";

interface StatusContagem {
  data: string;
  etapaAtual: "primeira" | "final" | "concluido";
  primeira: CountRecord | null;
  final: CountRecord | null;
  pendencias: CountRecord[];
  bloqueio: CountRecord | null;
}

export function useContagemStatus(lojaId: string | undefined) {
  return useQuery({
    queryKey: ["contagem-status", lojaId],
    queryFn: () => api.get<StatusContagem>(`/lojas/${lojaId}/contagens/status`),
    enabled: !!lojaId,
    refetchInterval: 15000,
  });
}

interface ContagemPorData {
  data: string;
  primeira: CountRecord | null;
  final: CountRecord | null;
}

export function useContagemPorData(lojaId: string | undefined, data: string | undefined) {
  return useQuery({
    queryKey: ["contagem-historico", lojaId, data],
    queryFn: () => api.get<ContagemPorData>(`/lojas/${lojaId}/contagens/historico/${data}`),
    enabled: !!lojaId && !!data,
  });
}

export function useAbrirPrimeira(lojaId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<CountRecord>(`/lojas/${lojaId}/contagens/primeira/abrir`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contagem-status", lojaId] }),
  });
}

export function useAbrirFinal(lojaId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<CountRecord>(`/lojas/${lojaId}/contagens/final/abrir`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contagem-status", lojaId] }),
  });
}

export function useItensContagem(lojaId: string | undefined, recordId: string | undefined) {
  return useQuery({
    queryKey: ["contagem-itens", recordId],
    queryFn: () =>
      api.get<{ registro: CountRecord; itens: CountItem[] }>(
        `/lojas/${lojaId}/contagens/${recordId}/itens`,
      ),
    enabled: !!lojaId && !!recordId,
  });
}

export function useMarcarPresenca(lojaId: string | undefined, recordId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, presente }: { deviceId: string; presente: boolean }) =>
      api.patch<CountItem>(
        `/lojas/${lojaId}/contagens/${recordId}/itens/${deviceId}/presenca`,
        { presente },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contagem-itens", recordId] });
      queryClient.invalidateQueries({ queryKey: ["contagem-status", lojaId] });
    },
  });
}

export function useMarcarStatusItem(lojaId: string | undefined, recordId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, input }: { deviceId: string; input: MarcarItemContagemInput }) =>
      api.patch<CountItem>(
        `/lojas/${lojaId}/contagens/${recordId}/itens/${deviceId}/status`,
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contagem-itens", recordId] });
      queryClient.invalidateQueries({ queryKey: ["contagem-status", lojaId] });
    },
  });
}

export function useAdicionarAparelhoFechamento(
  lojaId: string | undefined,
  recordId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdicionarAparelhoDuranteFechamentoInput) =>
      api.post<{ aparelho: Aparelho; item: CountItem }>(
        `/lojas/${lojaId}/contagens/${recordId}/aparelhos`,
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contagem-itens", recordId] });
      queryClient.invalidateQueries({ queryKey: ["contagem-status", lojaId] });
      queryClient.invalidateQueries({ queryKey: ["aparelhos", lojaId] });
    },
  });
}

export function useDesbloquearPendencia(lojaId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      api.post<CountRecord>(`/lojas/${lojaId}/pendencias/${recordId}/desbloquear`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contagem-status", lojaId] }),
  });
}

export function useFinalizarContagem(lojaId: string | undefined, recordId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fotos: string[] = []) =>
      api.post<CountRecord>(`/lojas/${lojaId}/contagens/${recordId}/finalizar`, { fotos }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contagem-itens", recordId] });
      queryClient.invalidateQueries({ queryKey: ["contagem-status", lojaId] });
    },
  });
}
