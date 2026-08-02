import type { InputHTMLAttributes } from "react";

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="search"
      className="w-full rounded-md border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-fg-muted focus:border-fg"
      {...props}
    />
  );
}
