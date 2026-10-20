import { LayoutGrid, ShieldCheck, Ticket, UsersRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// Профиль открывается из меню аватара, поэтому в основной навигации его нет
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Найти активность", shortLabel: "Найти", icon: LayoutGrid },
  { to: "/my", label: "Мои активности", shortLabel: "Мои активности", icon: Ticket },
  { to: "/communities", label: "Сообщества", shortLabel: "Сообщества", icon: UsersRound },
  { to: "/admin", label: "Админка", shortLabel: "Админка", icon: ShieldCheck, adminOnly: true },
];

export const isNavActive = (to: string, pathname: string) =>
  to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
