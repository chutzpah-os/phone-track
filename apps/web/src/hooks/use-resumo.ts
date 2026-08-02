"use client";

import { useQuery } from "@tanstack/react-query";
import type { DailySummary } from "@phonetrack/shared";
import { api } from "@/lib/api";

export function useResumoDoDia(lojaId: string | undefined, data: string | undefined) {
  return useQuery({
    queryKey: ["resumo", lojaId, data],
    queryFn: () => api.get<DailySummary | null>(`/lojas/${lojaId}/relatorios/${data}`),
    enabled: !!lojaId && !!data,
  });
}
