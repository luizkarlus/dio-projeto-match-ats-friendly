import { cn } from "@/lib/cn";

export function Progress({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const tone = clamped >= 80 ? "bg-success" : clamped >= 60 ? "bg-primary" : clamped >= 40 ? "bg-warning" : "bg-red-500";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={`${clamped} de 100`}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-line", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none", tone)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
