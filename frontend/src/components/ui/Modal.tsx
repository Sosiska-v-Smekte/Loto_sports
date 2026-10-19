import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Нативный <dialog>: фокус-ловушка, Escape и подложка из коробки. На мобильных — шторка снизу. */
export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={cn(
        "modal m-0 mt-auto w-full max-w-none rounded-t-[28px] bg-surface p-0 text-ink shadow-pop",
        "sm:m-auto sm:max-w-lg sm:rounded-card",
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
            <div>
              <h2 id="modal-title" className="text-xl font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="pressable -mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-muted"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-3">{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
