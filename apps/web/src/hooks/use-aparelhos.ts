"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Aparelho,
  AtualizarAparelhoInput,
  CriarAparelhoInput,
  HistoricoAparelhoItem,
} from "@phonetrack/shared";
import { api } from "@/lib/api";

export function useAparelhos(lojaId: string | undefined) {
  return useQuery({
    queryKey: ["aparelhos", lojaId],
    queryFn: () => api.get<Aparelho[]>(`/lojas/${lojaId}/aparelhos`),
    enabled: !!lojaId,
  });
}

export function useAparelho(id: string | undefined) {
  return useQuery({
    queryKey: ["aparelho", id],
    queryFn: () =>
      api.get<{ aparelho: Aparelho; historico: HistoricoAparelhoItem[] }>(`/aparelhos/${id}`),
    enabled: !!id,
  });
}

export function useCriarAparelho(lojaId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarAparelhoInput) =>
      api.post<Aparelho>(`/lojas/${lojaId}/aparelhos`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos", lojaId] });
      queryClient.invalidateQueries({ queryKey: ["lojas"] });
    },
  });
}

export function useAtualizarAparelho(lojaId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AtualizarAparelhoInput }) =>
      api.patch<Aparelho>(`/lojas/${lojaId}/aparelhos/${id}`, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos", lojaId] });
      queryClient.invalidateQueries({ queryKey: ["aparelho", id] });
      queryClient.invalidateQueries({ queryKey: ["lojas"] });
    },
  });
}

export function useExcluirAparelho(lojaId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lojas/${lojaId}/aparelhos/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos", lojaId] });
      queryClient.invalidateQueries({ queryKey: ["aparelho", id] });
      queryClient.invalidateQueries({ queryKey: ["lojas"] });
    },
  });
}
