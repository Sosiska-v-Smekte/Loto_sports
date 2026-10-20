import { useState } from "react";
import { meApi } from "@/api/endpoints";
import type { SportLevel, UserSport } from "@/api/types";
import { useAction } from "@/features/action";
import { useSports } from "@/features/events";
import { SPORT_LEVEL_LABEL } from "@/lib/status";
import { SportIllustration } from "./SportIllustration";
import { Button } from "./ui/Button";
import { Pill } from "./ui/Pill";
import { Modal } from "./ui/Modal";

interface SportsModalProps {
  open: boolean;
  onClose: () => void;
  current: UserSport[];
}

const LEVELS: SportLevel[] = ["beginner", "amateur", "pro"];

/** «Мои спортивные направления»: отметьте, чем занимаетесь, и укажите свой уровень. */
export function SportsModal({ open, onClose, current }: SportsModalProps) {
  const sports = useSports();
  const [levels, setLevels] = useState<Record<number, SportLevel>>(() =>
    Object.fromEntries(current.map((c) => [c.sport.id, c.level])),
  );
  const save = useAction(meApi.setSports, "Направления сохранены");

  const toggle = (id: number) =>
    setLevels((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "amateur";
      return next;
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Мои спортивные направления"
      description="Выберите, чем вы занимаетесь, и укажите свой уровень. Это видно в вашем профиле."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            loading={save.isPending}
            onClick={() =>
              save.mutate(
                Object.entries(levels).map(([id, level]) => ({ sport_id: Number(id), level })),
                { onSuccess: onClose },
              )
            }
          >
            Сохранить
          </Button>
        </>
      }
    >
      <div role="group" aria-label="Направления" className="flex flex-wrap gap-2">
        {sports.data?.map((sport) => (
          <Pill
            key={sport.id}
            active={Boolean(levels[sport.id])}
            onClick={() => toggle(sport.id)}
            icon={<SportIllustration sport={sport} compact className="text-[22px]" />}
          >
            {sport.name}
          </Pill>
        ))}
      </div>
      {Object.keys(levels).length > 0 && (
        <ul className="mt-5 flex flex-col gap-3">
          {sports.data
            ?.filter((s) => levels[s.id])
            .map((sport) => (
              <li key={sport.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{sport.name}</span>
                <div role="group" aria-label={`Уровень: ${sport.name}`} className="flex flex-wrap gap-1.5">
                  {LEVELS.map((level) => (
                    <Pill
                      key={level}
                      active={levels[sport.id] === level}
                      className="min-h-9 px-3 text-sm"
                      onClick={() => setLevels((prev) => ({ ...prev, [sport.id]: level }))}
                    >
                      {SPORT_LEVEL_LABEL[level]}
                    </Pill>
                  ))}
                </div>
              </li>
            ))}
        </ul>
      )}
    </Modal>
  );
}
