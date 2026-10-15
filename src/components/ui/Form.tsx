import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export const fieldClasses =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint " +
  "focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent transition-colors";

export function Input({
  className,
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      {label ? <span className="mb-1.5 block text-[13px] font-medium text-text">{label}</span> : null}
      <input id={id} className={cn(fieldClasses, className)} {...props} />
      {hint ? <span className="mt-1 block text-[12px] text-text-faint">{hint}</span> : null}
    </label>
  );
}

export function Textarea({
  className,
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      {label ? <span className="mb-1.5 block text-[13px] font-medium text-text">{label}</span> : null}
      <textarea id={id} className={cn(fieldClasses, "min-h-24 resize-y font-mono text-[13px]", className)} {...props} />
      {hint ? <span className="mt-1 block text-[12px] text-text-faint">{hint}</span> : null}
    </label>
  );
}

export function Select({
  className,
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      {label ? <span className="mb-1.5 block text-[13px] font-medium text-text">{label}</span> : null}
      <select id={id} className={cn(fieldClasses, "appearance-none pr-8 cursor-pointer", className)} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 cursor-pointer group",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      )}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          checked ? "bg-accent border-accent" : "border-border-strong bg-surface-2 group-hover:border-accent",
        )}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="var(--accent-contrast)" strokeWidth="2.2">
            <path d="M2.5 6.2 5 8.6l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-sm leading-5", checked ? "text-text-muted line-through decoration-border-strong" : "text-text")}>
          {label}
        </span>
        {description ? <span className="block text-[12.5px] text-text-faint leading-5">{description}</span> : null}
      </span>
    </label>
  );
}
