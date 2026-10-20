import { Hand, Plus } from "lucide-react";
import type { DemandGroup } from "@/api/types";
import { DAY_KIND_LABEL, DAY_PART_LABEL, peopleCount } from "@/lib/interests";
import { SportIllustration } from "./SportIllustration";
import { ButtonLink } from "./ui/Button";
import { Card } from "./ui/Card";

export const draftLink = (group: DemandGroup) =>
  `/events/new?${new URLSearchParams({
    sport: String(group.sport.id),
    city: group.city,
    kind: group.day_kind,
    part: group.day_part,
  })}`;

export function demandTitle(group: DemandGroup) {
  const when = `${DAY_KIND_LABEL[group.day_kind]} ${DAY_PART_LABEL[group.day_part]}`;
  const sport = group.sport.name.toLowerCase();
  if (group.mine) {
    const others = group.count - 1;
    return others > 0
      ? `Вы и ещё ${peopleCount(others)} ${others % 10 === 1 && others % 100 !== 11 ? "хочет" : "хотят"}: ${sport}, ${when}`
      : `Вы хотите: ${sport}, ${when}. Других желающих пока нет`;
  }
  return `${peopleCount(group.count)} ${group.count % 10 === 1 && group.count % 100 !== 11 ? "хочет" : "хотят"}: ${sport}, ${when}`;
}

interface DemandListProps {
  groups: DemandGroup[];
  limit?: number;
  canCreate?: boolean;
}

export function DemandList({ groups, limit, canCreate = true }: DemandListProps) {
  const shown = limit ? groups.slice(0, limit) : groups;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {shown.map((group) => (
        <li key={`${group.sport.id}-${group.day_kind}-${group.day_part}`}>
          <Card className="flex h-full flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl text-[40px]"
                style={{ backgroundColor: group.sport.color }}
              >
                <SportIllustration sport={group.sport} compact />
              </span>
              <div className="min-w-0">
                <p className="font-semibold leading-snug">{demandTitle(group)}</p>
                {group.districts.length > 0 && (
                  <p className="mt-1 text-sm text-muted">Районы: {group.districts.join(", ")}</p>
                )}
              </div>
            </div>
            {group.mine && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Hand className="size-4" aria-hidden />
                Вы отметили, что хотите пойти
              </p>
            )}
            {canCreate && (
              <ButtonLink
                to={draftLink(group)}
                variant={group.mine ? "primary" : "secondary"}
                size="sm"
                className="mt-auto self-start"
                icon={<Plus className="size-4" aria-hidden />}
              >
                Организовать встречу
              </ButtonLink>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
