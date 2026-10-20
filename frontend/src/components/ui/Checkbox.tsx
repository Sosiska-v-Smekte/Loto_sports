import { Check } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  children: ReactNode;
  error?: string;
}

/** Флажок с крупной зоной нажатия: нажимается и сам квадрат, и вся подпись. Ссылки в подписи работают отдельно. */
export function Checkbox({ children, error, className, id, ...rest }: CheckboxProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
          <input
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            className={cn(
              "peer absolute inset-0 size-full cursor-pointer appearance-none rounded-md border-2 bg-white transition-colors",
              "checked:border-primary checked:bg-primary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary",
              error ? "border-danger-ink" : "border-[#b9ad98]",
            )}
            {...rest}
          />
          <Check className="pointer-events-none relative size-4 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
        </span>
        <label htmlFor={inputId} className="cursor-pointer text-[15px] leading-snug">
          {children}
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-1 pl-9 text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
