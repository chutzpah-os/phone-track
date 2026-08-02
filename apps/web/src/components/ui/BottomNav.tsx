"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const TABS = [
  { href: "/", label: "Lista", icon: IconLista },
  { href: "/manha", label: "Manhã", icon: IconManha },
  { href: "/fechamento", label: "Fechamento", icon: IconFechamento },
  { href: "/resumo", label: "Resumo", icon: IconResumo },
];

const TAB_ANALISE = { href: "/analise", label: "Análise", icon: IconAnalise };

export function BottomNav() {
  const pathname = usePathname();
  const { perfil } = useAuth();
  const tabs =
    perfil?.papel === "master" || perfil?.papel === "admin" ? [...TABS, TAB_ANALISE] : TABS;

  return (
    <nav className="sticky bottom-0 flex border-t border-border bg-bg px-2 pb-[22px] pt-2">
      {tabs.map((tab) => {
        const ativo = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <Icon color={ativo ? "#111111" : "rgba(17,17,17,0.35)"} />
            <span
              className="text-[10.5px] font-semibold"
              style={{ color: ativo ? "#111111" : "rgba(17,17,17,0.35)" }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function IconLista({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="4" width="16" height="3" rx="1.5" fill={color} />
      <rect x="3" y="9.5" width="16" height="3" rx="1.5" fill={color} />
      <rect x="3" y="15" width="16" height="3" rx="1.5" fill={color} />
    </svg>
  );
}

function IconManha({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="4.5" fill={color} />
      {[0, 90, 45, 135].map((deg) => (
        <line
          key={deg}
          x1="11"
          y1="2"
          x2="11"
          y2="4.5"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${deg} 11 11)`}
        />
      ))}
    </svg>
  );
}

function IconFechamento({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M17 12.5A7 7 0 019 3a7.5 7.5 0 108 9.5z" fill={color} />
    </svg>
  );
}

function IconResumo({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="12" width="4" height="8" rx="1" fill={color} />
      <rect x="9" y="7" width="4" height="13" rx="1" fill={color} />
      <rect x="15" y="2" width="4" height="18" rx="1" fill={color} />
    </svg>
  );
}

function IconAnalise({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="9.5" cy="9.5" r="6" stroke={color} strokeWidth="2" />
      <line x1="14" y1="14" x2="19" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
