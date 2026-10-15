import { cn } from "@/utils/cn";

export type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
export type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-contrast hover:bg-accent-hover shadow-sm border border-transparent",
  secondary: "bg-surface-3 text-text hover:border-border-strong border border-transparent",
  ghost: "text-text-muted hover:text-text hover:bg-surface-2 border border-transparent",
  outline: "border border-border-strong text-text hover:bg-surface-2",
  danger: "bg-danger-soft text-danger border border-transparent hover:opacity-90",
  success: "bg-success-soft text-success border border-transparent hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
  icon: "h-9 w-9 p-0 justify-center",
};

export function buttonClasses(
  { variant = "primary", size = "md" }: { variant?: Variant; size?: Size } = {},
): string {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap",
    variants[variant],
    sizes[size],
  );
}
