import { Check, Inbox, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { eventsApi } from "@/api/endpoints";
import type { Participants } from "@/api/types";
import { useAction } from "@/features/action";
import { formatRelative } from "@/lib/dates";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/States";
import { Tabs } from "../ui/Tabs";
import { PersonRow } from "./PersonRow";

type Tab = "requests" | "participants" | "rejected";

/** Блок организатора: заявки с кнопками «Принять»/«Отклонить», подтверждённые участники и отдельно отклонённые. */
export function ManagePanel({ participants }: { participants: Participants }) {
  const [tab, setTab] = useState<Tab>(participants.pending.length > 0 ? "requests" : "participants");

  const approve = useAction((id: number) => eventsApi.approve(id), "Заявка принята — человек добавлен в участники");
  const reject = useAction((id: number) => eventsApi.reject(id), "Заявка отклонена");
  const busyId = approve.isPending ? approve.variables : reject.isPending ? reject.variables : null;

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Управление</h2>
      <p className="mt-1 text-muted">Это видите только вы как организатор.</p>
      <Tabs
        className="mt-4"
        label="Управление участниками"
        value={tab}
        onChange={setTab}
        items={[
          { value: "requests", label: "Заявки", count: participants.pending.length },
          { value: "participants", label: "Участники", count: participants.confirmed.length },
          // Отклонённые — не участники: отдельная вкладка, которая не открыта по умолчанию
          ...(participants.rejected.length > 0
            ? [{ value: "rejected" as const, label: "Отклонённые", count: participants.rejected.length }]
            : []),
        ]}
      />

      {tab === "requests" &&
        (participants.pending.length === 0 ? (
          <EmptyState icon={Inbox} title="Новых заявок нет" text="Когда кто-то подаст заявку, она появится здесь." className="mt-4" />
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {participants.pending.map((p) => (
              <PersonRow
                key={p.id}
                user={p.user}
                meta={`Заявка ${formatRelative(p.created_at)}`}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      icon={<Check className="size-4" aria-hidden />}
                      loading={busyId === p.id && approve.isPending}
                      disabled={busyId !== null}
                      onClick={() => approve.mutate(p.id)}
                    >
                      Принять
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<X className="size-4" aria-hidden />}
                      loading={busyId === p.id && reject.isPending}
                      disabled={busyId !== null}
                      onClick={() => reject.mutate(p.id)}
                    >
                      Отклонить
                    </Button>
                  </>
                }
              />
            ))}
          </ul>
        ))}

      {tab === "participants" &&
        (participants.confirmed.length === 0 ? (
          <EmptyState icon={UsersRound} title="Пока никого" text="Участники появятся здесь после записи или принятия заявки." className="mt-4" />
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {participants.confirmed.map((p) => (
              <PersonRow key={p.id} user={p.user} meta={`Записан(а) ${formatRelative(p.decided_at ?? p.created_at)}`} />
            ))}
          </ul>
        ))}

      {tab === "rejected" && (
        <>
          <p className="mt-4 rounded-2xl bg-surface-muted px-4 py-3 text-muted">
            Эти люди не участвуют в мероприятии и не видны другим. Список нужен только вам для истории.
          </p>
          <ul className="mt-2 divide-y divide-line">
            {participants.rejected.map((p) => (
              <PersonRow
                key={p.id}
                user={p.user}
                muted
                meta={`Заявка отклонена ${formatRelative(p.decided_at ?? p.created_at)}`}
              />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
