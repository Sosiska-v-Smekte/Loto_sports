import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { UserBrief } from "@/api/types";
import { cn } from "@/lib/cn";
import { Avatar } from "../ui/Avatar";

interface PersonRowProps {
  user: UserBrief;
  meta?: ReactNode;
  actions?: ReactNode;
  /** Приглушённая строка без ссылки — для людей, которые не участвуют (отклонённые заявки) */
  muted?: boolean;
}

export function PersonRow({ user, meta, actions, muted = false }: PersonRowProps) {
  const content = (
    <>
      <Avatar name={user.name} id={user.id} src={user.avatar_url} size="md" className={cn(muted && "opacity-50 grayscale")} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{user.name}</span>
        {meta && <span className="block text-sm text-muted">{meta}</span>}
      </span>
    </>
  );
  return (
    <li className={cn("flex flex-wrap items-center gap-3 py-3", muted && "text-muted")}>
      {muted ? (
        <span className="flex min-w-0 flex-1 items-center gap-3">{content}</span>
      ) : (
        <Link to={`/users/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-full hover:underline">
          {content}
        </Link>
      )}
      {actions && <div className="flex gap-2">{actions}</div>}
    </li>
  );
}
