import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { UserBrief } from "@/api/types";
import { Avatar } from "../ui/Avatar";

export function PersonRow({ user, meta, actions }: { user: UserBrief; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <Link to={`/users/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-full hover:underline">
        <Avatar name={user.name} id={user.id} src={user.avatar_url} size="md" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{user.name}</span>
          {meta && <span className="block text-sm text-muted">{meta}</span>}
        </span>
      </Link>
      {actions && <div className="flex gap-2">{actions}</div>}
    </li>
  );
}
