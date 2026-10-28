import * as React from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-semibold text-navy", className)}
      {...props}
    />
  );
}

export function FieldHint({
  id,
  invalid,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { invalid?: boolean }) {
  return (
    <p id={id} className={cn("text-xs", invalid ? "text-red-600" : "text-muted", className)} {...props}>
      {children}
    </p>
  );
}
