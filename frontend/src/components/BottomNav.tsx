import { Bell, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { useUnreadCount } from "@/features/notifications";
import { cn } from "@/lib/cn";
import { isNavActive, NAV_ITEMS, type NavItem } from "./nav";
import { UnreadBadge } from "./NotificationBell";

const NOTIFICATIONS: NavItem = { to: "/notifications", label: "Уведомления", shortLabel: "Уведомления", icon: Bell };

/** Нижний таб-бар для телефонов и планшетов; «Создать» — выделенная кнопка по центру. */
export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const unread = useUnreadCount();
  // Админка на телефоне открывается из меню аватара
  const [find, mine, communities] = NAV_ITEMS.filter((item) => !item.adminOnly);

  const tab = (item: NavItem, badge?: ReactNode) => {
    const active = isNavActive(item.to, pathname);
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        className={cn(
          "pressable flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium sm:text-[12px]",
          active ? "text-primary" : "text-muted",
        )}
      >
        <span className={cn("relative grid h-8 w-12 place-items-center rounded-full", active && "bg-primary-soft")}>
          <item.icon className="size-[22px]" aria-hidden strokeWidth={active ? 2.4 : 2} />
          {badge}
        </span>
        {/* Пять вкладок при крупном тексте: длинная подпись обрезается, а не наезжает на соседнюю */}
        <span className="w-full truncate px-0.5 text-center">{item.shortLabel}</span>
      </NavLink>
    );
  };

  return (
    <nav
      data-mobile-nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-[#f7f2e8]/95 shadow-[0_-6px_20px_-8px_rgb(110_84_46/0.25)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center gap-1 px-2 pt-1.5 pb-1.5">
        {tab(find)}
        {tab(mine)}
        <Link
          to="/events/new"
          aria-label="Создать активность"
          className="pressable mx-1 flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold text-primary"
        >
          <span className="grid size-11 -mt-5 place-items-center neu-primary rounded-full bg-primary text-white ring-4 ring-[#f7f2e8]">
            <Plus className="size-6" aria-hidden />
          </span>
          Создать
        </Link>
        {tab(communities)}
        {user && tab(NOTIFICATIONS, <UnreadBadge count={unread.data} className="absolute -right-0.5 -top-1" />)}
      </div>
    </nav>
  );
}
