import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUnreadCount } from "@/features/notifications";
import { cn } from "@/lib/cn";
import { NotificationList } from "./NotificationList";

export function UnreadBadge({ count, className }: { count: number | undefined; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "grid min-w-5 place-items-center rounded-full bg-weekend px-1 text-[11px] font-semibold leading-5 text-white tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Колокольчик в шапке на десктопе: выпадающий список последних уведомлений. На телефоне — пункт таб-бара. */
export function NotificationBell() {
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = unread.data ? `Уведомления, непрочитанных: ${unread.data}` : "Уведомления";

  return (
    <div ref={ref} data-desktop-nav className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        className="neu-control pressable relative grid size-11 place-items-center rounded-full border border-white/70 bg-surface-muted xl:size-[50px]"
      >
        <Bell className="size-5" aria-hidden />
        <UnreadBadge count={unread.data} className="absolute -right-1 -top-1" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Уведомления"
          className="absolute right-0 top-[calc(100%+8px)] w-[380px] origin-top-right rounded-2xl border border-line bg-surface p-3 shadow-pop"
        >
          <NotificationList showTitle limit={15} onNavigate={() => setOpen(false)} className="max-h-[60vh] overflow-y-auto" />
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="mt-2 flex min-h-11 items-center justify-center rounded-xl font-medium text-primary hover:bg-surface-muted"
          >
            Все уведомления
          </Link>
        </div>
      )}
    </div>
  );
}
