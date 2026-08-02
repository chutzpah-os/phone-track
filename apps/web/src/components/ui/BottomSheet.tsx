"use client";

import type { ReactNode } from "react";

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-[480px] overflow-y-auto rounded-t-xl bg-bg px-5 pb-6 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-pill bg-fg/15" />
        <div className="flex justify-end">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-pill bg-fg/[0.06] text-[15px]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
