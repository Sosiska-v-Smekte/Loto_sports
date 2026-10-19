import { Plus } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { isNavActive, NAV_ITEMS } from "./nav";

/** Нижний таб-бар для телефонов и планшетов; «Создать» — выделенная кнопка по центру. */
export function BottomNav() {
  const { pathname } = useLocation();
  // Админка на телефоне открывается из меню аватара
  const [find, mine, communities] = NAV_ITEMS.filter((item) => !item.adminOnly);

  const tab = (item: (typeof NAV_ITEMS)[number]) => {
    const active = isNavActive(item.to, pathname);
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        className={cn(
          "pressable flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[12px] font-medium",
          active ? "text-primary" : "text-muted",
        )}
      >
        <span className={cn("grid h-8 w-12 place-items-center rounded-full", active && "bg-primary-soft")}>
          <item.icon className="size-[22px]" aria-hidden strokeWidth={active ? 2.4 : 2} />
        </span>
        {item.shortLabel}
      </NavLink>
    );
  };

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#f7f2e8]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center gap-1 px-2 pt-1.5 pb-1.5">
        {tab(find)}
        {tab(mine)}
        <Link
          to="/events/new"
          aria-label="Создать активность"
          className="pressable mx-1 flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold text-primary"
        >
          <span className="grid size-11 -mt-5 place-items-center rounded-full bg-primary text-white shadow-pop ring-4 ring-[#f7f2e8]">
            <Plus className="size-6" aria-hidden />
          </span>
          Создать
        </Link>
        {tab(communities)}
      </div>
    </nav>
  );
}
