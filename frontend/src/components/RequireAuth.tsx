import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { ButtonLink } from "./ui/Button";
import { LoadingBlock } from "./ui/Skeleton";
import { EmptyState } from "./ui/States";

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingBlock className="page-container mt-10" />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (admin && !user.is_admin) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          icon={ShieldAlert}
          title="Раздел только для администратора"
          text="Войдите под аккаунтом администратора, чтобы открыть модерацию."
          action={<ButtonLink to="/login">Сменить аккаунт</ButtonLink>}
        />
      </div>
    );
  }
  return <>{children}</>;
}
