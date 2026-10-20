import { Hand, Trash2, UsersRound } from "lucide-react";
import { useState } from "react";
import { interestsApi } from "@/api/endpoints";
import type { DayKind, DayPart } from "@/api/types";
import { BackLink } from "@/components/BackLink";
import { CityCombobox } from "@/components/CityCombobox";
import { DemandList } from "@/components/DemandList";
import { SportPicker, type SportChoice } from "@/components/SportPicker";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { useSports } from "@/features/events";
import { useDemand, useMyInterests } from "@/features/planning";
import { DAY_KIND_LABEL, DAY_KIND_TITLE, DAY_PART_LABEL, DAY_PART_TITLE } from "@/lib/interests";

const KINDS: DayKind[] = ["weekday", "weekend"];
const PARTS: DayPart[] = ["morning", "day", "evening"];

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/** «Я бы пошёл»: отметить желание заниматься без записи на событие и увидеть, сколько таких людей рядом. */
export function InterestPage() {
  const { user } = useAuth();
  const sports = useSports();
  const [city, setCity] = useState(user?.city ?? "Москва");
  const [sport, setSport] = useState<SportChoice>(null);
  const [district, setDistrict] = useState("");
  const [kinds, setKinds] = useState<DayKind[]>(["weekend"]);
  const [parts, setParts] = useState<DayPart[]>(["day"]);
  const [touched, setTouched] = useState(false);

  const demand = useDemand(city);
  const mine = useMyInterests(Boolean(user));
  const add = useAction(interestsApi.add, "Отметили. Если появится подходящая встреча, мы сообщим");
  const remove = useAction(interestsApi.remove, "Отметка убрана");

  const errors = {
    sport: sport ? undefined : "Выберите направление или добавьте своё",
    kinds: kinds.length ? undefined : "Выберите будни, выходные или оба варианта",
    parts: parts.length ? undefined : "Выберите хотя бы одно время суток",
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (!valid || !sport) return;
    add.mutate({
      sport_id: "sportId" in sport ? sport.sportId : null,
      sport_name: "customName" in sport ? sport.customName : null,
      city, district: district.trim(),
      day_kinds: kinds,
      day_parts: parts,
    });
  };

  return (
    <div className="page-container max-w-[1000px] pt-4 lg:pt-6">
      <BackLink />
      <h1 className="mt-2 text-[30px] font-bold leading-tight sm:text-[40px]">Я бы пошёл</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">
        Хочется поиграть, но организовывать самому пока не готовы? Отметьте, что вам интересно. Мы соберём таких людей рядом,
        а когда кто-то организует встречу, вы получите приглашение. Автоматически вас никуда не запишут.
      </p>

      <Card className="mt-6 flex flex-col gap-5 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Что и когда вам подходит</h2>
        {!user && (
          <p className="text-muted">
            Чтобы отметить интерес, нужно войти. Посмотреть, что хотят другие, можно и без входа.
          </p>
        )}
        <SportPicker sports={sports.data} value={sport} onChange={setSport} error={touched ? errors.sport : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CityCombobox label="Город" required value={city} onChange={setCity} />
          <Input
            label="Район"
            placeholder="Например: Центральный"
            hint="Необязательно. Его увидят организаторы"
            maxLength={80}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[15px] font-medium">Когда</p>
            <div role="group" aria-label="Дни" className="flex flex-wrap gap-2">
              {KINDS.map((kind) => (
                <Pill key={kind} active={kinds.includes(kind)} onClick={() => setKinds((k) => toggle(k, kind))}>
                  {DAY_KIND_TITLE[kind]}
                </Pill>
              ))}
            </div>
            {touched && errors.kinds && <p role="alert" className="mt-1.5 text-sm font-medium text-danger-ink">{errors.kinds}</p>}
          </div>
          <div>
            <p className="mb-2 text-[15px] font-medium">В какое время суток</p>
            <div role="group" aria-label="Время суток" className="flex flex-wrap gap-2">
              {PARTS.map((part) => (
                <Pill key={part} active={parts.includes(part)} onClick={() => setParts((p) => toggle(p, part))}>
                  {DAY_PART_TITLE[part]}
                </Pill>
              ))}
            </div>
            {touched && errors.parts && <p role="alert" className="mt-1.5 text-sm font-medium text-danger-ink">{errors.parts}</p>}
          </div>
        </div>
        <div>
          {user ? (
            <Button size="lg" loading={add.isPending} icon={<Hand className="size-5" aria-hidden />} onClick={submit}>
              Я бы пошёл
            </Button>
          ) : (
            <ButtonLink to="/login?next=%2Finterest" size="lg">
              Войти и отметить
            </ButtonLink>
          )}
        </div>
      </Card>

      {user && (
        <section className="mt-8" aria-labelledby="mine-title">
          <SectionTitle id="mine-title">Ваши отметки</SectionTitle>
          {mine.isPending ? (
            <Skeleton className="mt-4 h-20 rounded-card" />
          ) : mine.isError ? (
            <ErrorState error={mine.error} onRetry={() => mine.refetch()} className="mt-4" />
          ) : mine.data.length === 0 ? (
            <p className="mt-3 text-muted">Пока ничего не отмечено.</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {mine.data.map((item) => (
                <li
                  key={item.id}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-line/70 bg-surface-muted py-1 pl-4 pr-1 text-[15px]"
                >
                  <span>
                    {item.sport.name}, {item.city}, {DAY_KIND_LABEL[item.day_kind]} {DAY_PART_LABEL[item.day_part]}
                    {item.district && `, ${item.district}`}
                  </span>
                  <button
                    type="button"
                    aria-label={`Убрать отметку: ${item.sport.name}, ${DAY_KIND_LABEL[item.day_kind]} ${DAY_PART_LABEL[item.day_part]}`}
                    onClick={() => remove.mutate(item.id)}
                    className="pressable grid size-9 place-items-center rounded-full hover:bg-surface"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-8" aria-labelledby="demand-title">
        <SectionTitle id="demand-title">Что хотят в городе {city}</SectionTitle>
        <p className="mt-1 text-muted">Если вам подходит, нажмите «Организовать встречу»: черновик уже заполнен.</p>
        <div className="mt-4">
          {demand.isPending ? (
            <Skeleton className="h-32 rounded-card" />
          ) : demand.isError ? (
            <ErrorState error={demand.error} onRetry={() => demand.refetch()} />
          ) : demand.data.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Пока никто не отметился"
              text="Станьте первым: отметьте, что хотели бы пойти, и другие смогут к вам присоединиться."
            />
          ) : (
            <DemandList groups={demand.data} canCreate={Boolean(user)} />
          )}
        </div>
      </section>
    </div>
  );
}
