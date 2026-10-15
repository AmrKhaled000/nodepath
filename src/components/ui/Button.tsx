import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { buttonClasses, type Size, type Variant } from "./buttonStyles";
import { cn } from "@/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonClasses({ variant, size }), className)}
      {...props}
    />
  );
});

/** Router link that looks exactly like a Button (avoids <button> inside <a>). */
export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "to" | "className" | "children">) {
  return (
    <Link to={to} className={cn(buttonClasses({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}
