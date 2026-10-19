import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export function NotFoundPage() {
  return (
    <div className="page-container mt-10">
      <EmptyState
        icon={Compass}
        title="Страница не найдена"
        text="Возможно, ссылка устарела. Вернитесь на главную и найдите активность там."
        action={<ButtonLink to="/">На главную</ButtonLink>}
      />
    </div>
  );
}
