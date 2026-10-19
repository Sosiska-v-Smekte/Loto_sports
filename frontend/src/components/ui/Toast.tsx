import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={20}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-line !bg-surface !text-ink !shadow-pop !font-sans !text-[15px]",
          description: "!text-muted",
          success: "[&_[data-icon]]:!text-primary",
          error: "[&_[data-icon]]:!text-danger-ink",
        },
      }}
    />
  );
}
