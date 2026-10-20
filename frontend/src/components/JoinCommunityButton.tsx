import { Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { organizationsApi } from "@/api/endpoints";
import type { Organization } from "@/api/types";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { Button, type ButtonProps } from "./ui/Button";

interface JoinCommunityButtonProps {
  organization: Organization;
  /** Подписи кнопки: по умолчанию «Вступить» / «Вы состоите» */
  joinLabel?: string;
  size?: ButtonProps["size"];
  className?: string;
  /** Вид кнопки, когда человек ещё не состоит в сообществе */
  joinVariant?: ButtonProps["variant"];
}

/** «Вступить» / «Вы состоите»: вступление без одобрения, выйти можно тем же нажатием. Владельцу кнопка не нужна. */
export function JoinCommunityButton({ organization, joinLabel = "Вступить", size, className, joinVariant = "primary" }: JoinCommunityButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const join = useAction(() => organizationsApi.join(organization.id), `Вы вступили в «${organization.name}»`);
  const leave = useAction(() => organizationsApi.leave(organization.id), "Вы вышли из сообщества");
  if (organization.is_owner) return null;

  const busy = join.isPending || leave.isPending;
  if (organization.is_member) {
    return (
      <Button
        variant="secondary"
        size={size}
        loading={busy}
        className={className}
        aria-label={`Вы состоите в «${organization.name}». Нажмите, чтобы выйти`}
        icon={<Check className="size-4" aria-hidden />}
        onClick={() => leave.mutate(undefined)}
      >
        Вы состоите
      </Button>
    );
  }
  return (
    <Button
      variant={joinVariant}
      size={size}
      loading={busy}
      className={className}
      icon={<Plus className="size-4" aria-hidden />}
      onClick={() => (user ? join.mutate(undefined) : navigate("/login?next=%2Fcommunities"))}
    >
      {joinLabel}
    </Button>
  );
}
