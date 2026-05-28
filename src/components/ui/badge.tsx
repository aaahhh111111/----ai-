import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "muted" | "warning";
  className?: string;
}) {
  const variants = {
    default: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    muted: "bg-slate-100 text-slate-600",
    warning: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
