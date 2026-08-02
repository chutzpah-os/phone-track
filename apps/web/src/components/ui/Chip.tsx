import type { ButtonHTMLAttributes } from "react";

export function Chip({
  ativo,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { ativo?: boolean }) {
  const styles = ativo
    ? "bg-fg text-accent"
    : "bg-bg text-fg border border-border";

  return (
    <button
      className={`rounded-pill px-3.5 py-2 text-xs font-bold whitespace-nowrap ${styles} ${className}`}
      {...props}
    />
  );
}
