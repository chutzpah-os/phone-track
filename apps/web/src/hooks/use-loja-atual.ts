"use client";

import { useQuery } from "@tanstack/react-query";
import type { Loja } from "@phonetrack/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

/**
 * MVP é de cliente único: assume a primeira loja disponível para o usuário.
 * Master vê todas as lojas cadastradas; Admin/Staff já vêm com `lojaIds` do
 * próprio perfil. Um seletor de loja fica para quando houver mais de uma.
 */
export function useLojaAtual() {
  const { perfil } = useAuth();

  const lojasQuery = useQuery({
    queryKey: ["lojas"],
    queryFn: () => api.get<Loja[]>("/lojas"),
    enabled: !!perfil,
  });

  const lojaId =
    perfil?.papel === "master" ? lojasQuery.data?.[0]?.id : perfil?.lojaIds[0];

  return {
    lojaId,
    loja: lojasQuery.data?.find((l) => l.id === lojaId),
    carregando: lojasQuery.isLoading,
  };
}
