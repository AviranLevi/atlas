export function LineNum({ num }: { num?: number }) {
  return (
    <span className="inline-flex items-center h-[1.625em] w-10 shrink-0 select-none justify-end pr-2 text-[10px] leading-relaxed text-muted-foreground/60 font-mono">
      {num ?? ''}
    </span>
  );
}
