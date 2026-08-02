"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { BottomNav } from "@/components/ui/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, perfil, carregando, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !firebaseUser) {
      router.replace("/login");
    }
  }, [carregando, firebaseUser, router]);

  if (carregando || !firebaseUser) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-fg-muted">Carregando...</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <p className="text-[15px] font-bold leading-tight">
            Phone<span className="text-accent">Track</span>
          </p>
          {perfil && (
            <p className="text-xs text-fg-muted">
              {perfil.nome} · {perfil.papel}
            </p>
          )}
        </div>
        <button
          onClick={() => logout()}
          className="rounded-pill border-[1.5px] border-fg px-3 py-1.5 text-xs font-bold"
        >
          Sair
        </button>
      </header>
      <div className="flex-1 pb-4">{children}</div>
      <BottomNav />
    </div>
  );
}
