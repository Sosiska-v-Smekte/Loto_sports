import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Подпись, подсказка и ошибка поля, связанные с ним через aria-describedby. */
export function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium">
        {label}
        {required && (
          <span className="text-weekend" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const controlClass = (invalid: boolean, extra?: string) =>
  cn(
    "neu-inset w-full border bg-surface-muted text-ink placeholder:text-[#8a7f70] transition-colors",
    "focus:border-primary focus:bg-white focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-primary/25",
    invalid ? "border-danger-ink" : "border-line",
    extra,
  );

type FieldProps = { label: string; hint?: string; error?: string };

export const Input = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, hint, error, required, className, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={controlClass(invalid, cn("min-h-12 rounded-full px-5", className))}
          {...rest}
        />
      )}
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ label, hint, error, required, className, rows = 4, ...rest }, ref) {
    return (
      <FieldShell label={label} hint={hint} error={error} required={required}>
        {({ id, describedBy, invalid }) => (
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={controlClass(invalid, cn("resize-y rounded-[20px] px-5 py-3 leading-relaxed", className))}
            {...rest}
          />
        )}
      </FieldShell>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, FieldProps & SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ label, hint, error, required, className, children, ...rest }, ref) {
    return (
      <FieldShell label={label} hint={hint} error={error} required={required}>
        {({ id, describedBy, invalid }) => (
          <div className="relative">
            <select
              ref={ref}
              id={id}
              required={required}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={controlClass(invalid, cn("min-h-12 appearance-none rounded-full pl-5 pr-12", className))}
              {...rest}
            >
              {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          </div>
        )}
      </FieldShell>
    );
  },
);
