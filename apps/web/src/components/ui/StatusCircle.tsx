export function StatusCircle({ marcado }: { marcado: boolean }) {
  if (!marcado) {
    return <span className="block h-[26px] w-[26px] shrink-0 rounded-pill border-2 border-fg/20" />;
  }
  return (
    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-pill bg-fg">
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
        <path
          d="M1 5l4 4 7-8"
          stroke="#F6C500"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
