import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "neu-primary bg-primary text-white",
  secondary: "neu-control border border-line/70 bg-surface-muted text-ink",
  ghost: "text-ink hover:bg-surface-muted",
  danger: "bg-danger-ink text-white shadow-soft hover:bg-[#6f241b] active:shadow-inset",
  success: "bg-success text-success-ink shadow-soft hover:bg-[#bfd894] active:shadow-inset",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-11 px-4 text-[15px] gap-1.5",
  md: "min-h-12 px-5 text-base gap-2",
  lg: "min-h-14 px-5 text-lg gap-2.5 sm:px-7",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "pressable inline-flex select-none items-center justify-center rounded-full py-2 text-center font-medium leading-tight [&>svg]:shrink-0",
    "disabled:cursor-not-allowed disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, icon, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className as string)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
