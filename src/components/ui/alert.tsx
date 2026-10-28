import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, { wrapper: string; icon: React.ReactNode }> = {
  info: {
    wrapper: "border-primary/20 bg-primary-soft/60 text-navy",
    icon: <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />,
  },
  success: {
    wrapper: "border-success/20 bg-success-soft/70 text-navy",
    icon: <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />,
  },
  warning: {
    wrapper: "border-warning/25 bg-warning-soft/60 text-navy",
    icon: <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />,
  },
  danger: {
    wrapper: "border-red-200 bg-red-50 text-navy",
    icon: <ShieldAlert className="size-4 shrink-0 text-red-600" aria-hidden="true" />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone; title?: string }) {
  const config = TONES[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", config.wrapper, className)}
      {...props}
    >
      <span className="mt-0.5">{config.icon}</span>
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="leading-relaxed text-ink/80">{children}</div>
      </div>
    </div>
  );
}
