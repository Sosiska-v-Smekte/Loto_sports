import { Ban, CalendarX2, Crown, LogIn } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { eventsApi } from "@/api/endpoints";
import type { SportEvent } from "@/api/types";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { LEVEL_LABEL, participationView } from "@/lib/status";
import { Button, ButtonLink } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Notice } from "../ui/Notice";

const PARTICIPATION_HINT = {
  confirmed: "Ждём вас! Если появятся вопросы — напишите в обсуждении ниже.",
  pending: "Организатор рассмотрит заявку. Статус обновится здесь и в «Моих активностях».",
  rejected: "Организатор не смог принять заявку на это мероприятие. Посмотрите другие активности.",
} as const;

/** Главная кнопка страницы события: её вид полностью зависит от состояния записи. */
export function JoinPanel({ event }: { event: SportEvent }) {
  const { user } = useAuth();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isOpen = event.join_mode === "open";

  const join = useAction(
    () => eventsApi.join(event.id),
    (p) => (p.status === "confirmed" ? "Вы записаны! Мероприятие появилось в «Моих активностях»" : "Заявка отправлена организатору"),
  );

  if (event.status !== "published") {
    return (
      <Notice tone="neutral" icon={Ban} title="Запись закрыта">
        Мероприятие снято с публикации.
      </Notice>
    );
  }
  if (event.can_manage) {
    return (
      <Notice tone="info" icon={Crown} title="Это ваше мероприятие">
        Заявки и участники — в блоке «Управление» ниже.
      </Notice>
    );
  }
  if (event.my_participation) {
    const view = participationView(event.my_participation.status, event.status);
    return (
      <Notice tone={view.tone} icon={view.icon} title={view.label}>
        {PARTICIPATION_HINT[event.my_participation.status]}
      </Notice>
    );
  }
  if (event.is_past) {
    return (
      <Notice tone="neutral" icon={CalendarX2} title="Мероприятие уже прошло">
        Записаться на него больше нельзя.
      </Notice>
    );
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname);
    return (
      <ButtonLink to={`/login?next=${next}`} size="lg" className="w-full" icon={<LogIn className="size-5" aria-hidden />}>
        {isOpen ? "Войти и записаться" : "Войти и подать заявку"}
      </ButtonLink>
    );
  }

  const label = isOpen ? "Записаться" : "Подать заявку";
  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setConfirmOpen(true)}>
        {label}
      </Button>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isOpen ? "Записаться на мероприятие?" : "Отправить заявку?"}
        description={event.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              loading={join.isPending}
              onClick={() => join.mutate(undefined, { onSettled: () => setConfirmOpen(false) })}
            >
              {label}
            </Button>
          </>
        }
      >
        <ul className="flex flex-col gap-3 text-[17px]">
          <li>
            <span className="text-muted">Уровень: </span>
            {LEVEL_LABEL[event.level]}
          </li>
          {event.requirements && (
            <li>
              <span className="text-muted">Что взять и как подготовиться: </span>
              {event.requirements}
            </li>
          )}
          <li className="rounded-2xl bg-surface-muted p-4">
            {isOpen
              ? "Свободная запись: после нажатия вы сразу станете участником."
              : "Запись по заявке: вы станете участником, только когда организатор примет заявку."}
          </li>
        </ul>
      </Modal>
    </>
  );
}
