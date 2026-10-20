import { EyeOff, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { adminApi } from "@/api/endpoints";
import type { SportEvent } from "@/api/types";
import { useAction } from "@/features/action";
import { ReasonModal } from "../ReasonModal";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type Mode = "unpublish" | "delete" | null;

export function AdminModeration({ event }: { event: SportEvent }) {
  const [mode, setMode] = useState<Mode>(null);
  const unpublish = useAction(
    (reason: string) => adminApi.unpublishEvent(event.id, reason),
    "Мероприятие снято с публикации. Организатор увидит причину",
  );
  const remove = useAction((reason: string) => adminApi.deleteEvent(event.id, reason), "Мероприятие удалено");

  if (event.status === "deleted") return null;
  const action = mode === "delete" ? remove : unpublish;

  return (
    <Card className="border-info-ink/30 bg-info/40 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <ShieldCheck className="size-6" aria-hidden />
        Модерация
      </h2>
      <p className="mt-1 text-muted">Причина будет видна организатору. Записи участников сохранятся.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {event.status === "published" && (
          <Button variant="secondary" icon={<EyeOff className="size-5" aria-hidden />} onClick={() => setMode("unpublish")}>
            Снять с публикации
          </Button>
        )}
        <Button variant="danger" icon={<Trash2 className="size-5" aria-hidden />} onClick={() => setMode("delete")}>
          Удалить
        </Button>
      </div>
      <ReasonModal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === "delete" ? "Удалить мероприятие?" : "Снять с публикации?"}
        description={
          mode === "delete"
            ? "Мероприятие пропадёт из всех списков. Записаться на него будет нельзя."
            : "Мероприятие исчезнет из ленты и поиска. Организатор и записавшиеся увидят причину."
        }
        confirmLabel={mode === "delete" ? "Удалить" : "Снять с публикации"}
        danger={mode === "delete"}
        loading={action.isPending}
        onConfirm={(reason) => action.mutate(reason, { onSuccess: () => setMode(null) })}
      />
    </Card>
  );
}
