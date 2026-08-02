"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { AuditLog } from "@phonetrack/shared";
import { api } from "@/lib/api";

export function useAuditoria(lojaId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["auditoria", lojaId],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      const query = pageParam ? `?cursor=${pageParam}&limit=30` : "?limit=30";
      return api.get<AuditLog[]>(`/lojas/${lojaId}/auditoria${query}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultimaPagina) =>
      ultimaPagina.length === 30 ? ultimaPagina[ultimaPagina.length - 1].id : undefined,
    enabled: !!lojaId,
  });
}
