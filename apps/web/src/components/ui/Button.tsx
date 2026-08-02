import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "rounded-md px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-fg text-accent"
      : "bg-bg text-fg border-[1.5px] border-fg";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
