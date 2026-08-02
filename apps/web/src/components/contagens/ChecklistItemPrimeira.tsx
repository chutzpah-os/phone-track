import type { CountItem } from "@phonetrack/shared";
import { StatusCircle } from "@/components/ui/StatusCircle";

export function ChecklistItemPrimeira({
  item,
  disabled,
  onToggle,
}: {
  item: CountItem;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const presente = item.status === "presente";

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-md border-[1.5px] border-border bg-bg px-3.5 py-3 text-left disabled:opacity-70"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold">{item.nome}</span>
        <span className="block truncate text-xs text-fg-muted">
          {item.marca} · {item.modelo}
        </span>
      </span>
      <StatusCircle marcado={presente} />
    </button>
  );
}
