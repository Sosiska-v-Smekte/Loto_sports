import { Building2, CheckCircle2, ClipboardCheck, Clock, TriangleAlert, UserRound, Users, Zap } from "lucide-react";
import { SimpleHint } from "@/components/SimpleHint";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { errorMessage } from "@/api/client";
import { eventsApi } from "@/api/endpoints";
import type { Availability, DayKind, DayPart, JoinMode, Level, Venue } from "@/api/types";
import { BackLink } from "@/components/BackLink";
import { CardColorPicker } from "@/components/CardColorPicker";
import { CardPatternPicker } from "@/components/CardPatternPicker";
import { CityCombobox } from "@/components/CityCombobox";
import { SportPicker, type SportChoice } from "@/components/SportPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Pill } from "@/components/ui/Pill";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { useSports } from "@/features/events";
import { useMyOrganization } from "@/features/me";
import { useAvailability, useVenues } from "@/features/planning";
import { mutedColor } from "@/lib/color";
import { dayjs } from "@/lib/dates";
import type { CardPattern } from "@/lib/engraving";
import { DAY_PART_TIME } from "@/lib/interests";
import { JOIN_MODE_HINT, LEVEL_HINT, LEVEL_LABEL } from "@/lib/status";

type Author = "me" | "org";

const LEVELS: Level[] = ["any", "beginner", "amateur", "pro"];

/** Ближайший подходящий день для черновика, собранного из спроса: суббота или первый будний день. */
function nextDay(kind: DayKind | null) {
  let day = dayjs().add(1, "day");
  if (kind === "weekend") while (day.day() !== 6) day = day.add(1, "day");
  if (kind === "weekday") while (day.day() === 0 || day.day() === 6) day = day.add(1, "day");
  return day;
}

export function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sports = useSports();
  const organization = useMyOrganization();
  const approvedOrg = organization.data?.status === "approved" ? organization.data : null;

  // Черновик из «Я бы пошёл»: направление, город, будни/выходные и время суток уже известны
  const draftKind = (params.get("kind") as DayKind | null) ?? null;
  const draftPart = (params.get("part") as DayPart | null) ?? null;
  const draftSport = Number(params.get("sport")) || null;

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: nextDay(draftKind).format("YYYY-MM-DD"),
    time: draftPart && DAY_PART_TIME[draftPart] ? DAY_PART_TIME[draftPart] : "19:00",
    endTime: "",
    city: params.get("city") ?? user?.city ?? "Москва",
    address: "",
    placeDetails: "",
    requirements: "",
  });
  const [sport, setSport] = useState<SportChoice>(draftSport ? { sportId: draftSport, name: "" } : null);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [cardColor, setCardColor] = useState<string | null>(null);
  const [cardPattern, setCardPattern] = useState<CardPattern | null>(null);
  const [level, setLevel] = useState<Level>("any");
  const [joinMode, setJoinMode] = useState<JoinMode>("open");
  const [author, setAuthor] = useState<Author>(params.get("as") === "org" ? "org" : "me");
  const [touched, setTouched] = useState(false);

  const venues = useVenues(form.city);
  const venue = venues.data?.find((v) => v.id === venueId) ?? null;
  const zone = venue?.zones.find((z) => z.id === zoneId) ?? null;

  const chosenSport = sport && "sportId" in sport ? (sports.data?.find((s) => s.id === sport.sportId) ?? null) : null;
  const startsAt = dayjs(`${form.date}T${form.time}`);
  const endsAt = form.endTime ? dayjs(`${form.date}T${form.endTime}`) : null;
  const timesReady = startsAt.isValid() && endsAt !== null && endsAt.isAfter(startsAt);
  const availability = useAvailability(
    zone ? zone.id : null,
    timesReady ? startsAt.format("YYYY-MM-DDTHH:mm:00") : null,
    timesReady && endsAt ? endsAt.format("YYYY-MM-DDTHH:mm:00") : null,
  );
  const zoneBusy = zone !== null && availability.data?.free === false;

  const errors = {
    title: form.title.trim().length < 3 ? "Название — минимум 3 символа" : undefined,
    sport: sport ? undefined : "Выберите направление или добавьте своё",
    date: !startsAt.isValid() || !startsAt.isAfter(dayjs()) ? "Выберите дату и время в будущем" : undefined,
    endTime: endsAt && !endsAt.isAfter(startsAt) ? "Окончание должно быть позже начала" : undefined,
    city: form.city ? undefined : "Выберите город из списка",
    address: !zone && form.address.trim().length < 3 ? "Укажите адрес или название площадки" : undefined,
    zone: venue && !zone ? "Выберите зону площадки" : undefined,
    zoneEnd: zone && !endsAt ? "Для площадки укажите время окончания: по нему проверяется, свободна ли зона" : undefined,
    zoneBusy: zoneBusy ? "В выбранное время зона занята" : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) => (touched ? errors[key] : undefined);

  // Название по умолчанию для встречи из «Я бы пошёл», когда справочник направлений загрузился
  const titled = useRef(false);
  useEffect(() => {
    if (titled.current || !draftSport || !chosenSport) return;
    titled.current = true;
    setSport({ sportId: chosenSport.id, name: chosenSport.name });
    setForm((f) => (f.title ? f : { ...f, title: `${chosenSport.name}: общая встреча` }));
  }, [draftSport, chosenSport]);

  const create = useAction(eventsApi.create, "Активность опубликована");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || !sport) {
      document.querySelector<HTMLElement>("[aria-invalid='true'], [role='alert']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    create.mutate(
      {
        title: form.title.trim(),
        description: form.description.trim(),
        sport_id: "sportId" in sport ? sport.sportId : null,
        sport_name: "customName" in sport ? sport.customName : null,
        starts_at: startsAt.format("YYYY-MM-DDTHH:mm:00"),
        ends_at: endsAt ? endsAt.format("YYYY-MM-DDTHH:mm:00") : null,
        zone_id: zone ? zone.id : null,
        city: venue ? venue.city : form.city,
        address: venue ? venue.address : form.address.trim(),
        place_details: form.placeDetails.trim(),
        level,
        requirements: form.requirements.trim(),
        join_mode: joinMode,
        card_color: cardColor,
        card_pattern: cardPattern,
        organization_id: author === "org" && approvedOrg ? approvedOrg.id : null,
      },
      { onSuccess: (event) => navigate(`/events/${event.id}`) },
    );
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="page-container max-w-3xl pt-4 lg:pt-6">
      <BackLink />
      <h1 className="mt-2 text-[30px] font-bold leading-tight sm:text-[40px]">Новая активность</h1>
      <p className="mt-2 text-lg text-muted">Расскажите, что, где и когда — и люди рядом смогут присоединиться.</p>
      <SimpleHint className="mt-4" title="Как создать активность">
        Заполняйте четыре блока сверху вниз. Поля со звёздочкой обязательны. В самом конце нажмите «Опубликовать».
      </SimpleHint>

      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-6">
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Что за активность</h2>
          <SimpleHint>Шаг 1 из 4. Придумайте название и выберите вид спорта. Остальное можно не заполнять.</SimpleHint>
          <Input label="Название" placeholder="Например: Утренняя пробежка в парке" maxLength={120} required error={show("title")} {...field("title")} />
          <SportPicker sports={sports.data} value={sport} onChange={setSport} error={show("sport")} />
          {/* Оформление карточки в простом режиме не нужно: цвет и узор подберутся сами */}
          <div data-simple-hide className="flex flex-col gap-5">
            <CardColorPicker value={cardColor} onChange={setCardColor} sport={chosenSport} />
            <CardPatternPicker
              value={cardPattern}
              onChange={setCardPattern}
              sport={chosenSport}
              background={cardColor ? mutedColor(cardColor) : (chosenSport?.color ?? "#E9DFCC")}
            />
          </div>
          <Textarea label="Описание" placeholder="Как всё будет проходить, сколько длится, кого ждёте" rows={4} maxLength={2000} {...field("description")} />
        </Card>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Когда и где</h2>
          <SimpleHint>Шаг 2 из 4. Выберите день и время начала, затем город и адрес: по адресу занятие появится на карте.</SimpleHint>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Дата" type="date" min={dayjs().format("YYYY-MM-DD")} required error={show("date")} {...field("date")} />
            <Input label="Начало" type="time" required {...field("time")} />
            <Input
              label="Окончание"
              type="time"
              hint={venue ? "Нужно для площадки" : "Необязательно"}
              error={show("endTime")}
              {...field("endTime")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <CityCombobox
              label="Город"
              required
              value={form.city}
              error={show("city")}
              onChange={(city) => {
                setForm((f) => ({ ...f, city }));
                setVenueId(null);
                setZoneId(null);
              }}
            />
            <Select
              label="Площадка"
              hint="Площадка с зонами: система проверит, что зона в это время свободна"
              value={venueId ?? ""}
              onChange={(e) => {
                setVenueId(e.target.value ? Number(e.target.value) : null);
                setZoneId(null);
              }}
            >
              <option value="">Свой адрес</option>
              {venues.data?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
          {venue ? (
            <ZoneChooser
              venue={venue}
              zoneId={zoneId}
              onChange={setZoneId}
              error={show("zone")}
              endError={touched ? errors.zoneEnd : undefined}
              availability={zone ? availability.data : undefined}
              onPickSlot={(slot) =>
                setForm((f) => ({
                  ...f,
                  date: dayjs(slot.starts_at).format("YYYY-MM-DD"),
                  time: dayjs(slot.starts_at).format("HH:mm"),
                  endTime: dayjs(slot.ends_at).format("HH:mm"),
                }))
              }
            />
          ) : (
            <Input
              label="Адрес"
              placeholder="ул. Карла Маркса, 114"
              hint="По этому адресу мероприятие появится на карте — укажите улицу и дом"
              required
              error={show("address")}
              {...field("address")}
            />
          )}
          <Input label="Как найти место" placeholder="Например: встречаемся у фонтана, поле №2" {...field("placeDetails")} />
        </Card>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Для кого</h2>
          <SimpleHint>Шаг 3 из 4. Выберите уровень. Если не уверены, оставьте «для всех».</SimpleHint>
          <ChoiceCards
            legend="Уровень подготовки"
            name="level"
            value={level}
            onChange={setLevel}
            choices={LEVELS.map((value) => ({ value, title: LEVEL_LABEL[value], description: LEVEL_HINT[value] }))}
          />
          <Textarea
            label="Подготовка и инвентарь"
            placeholder="Что взять с собой: форма, обувь, ракетка, вода…"
            rows={3}
            maxLength={2000}
            {...field("requirements")}
          />
        </Card>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Как записываться</h2>
          <SimpleHint>Шаг 4 из 4. «Свободная запись» — любой может прийти. «По заявке» — вы сами решаете, кого принять.</SimpleHint>
          <ChoiceCards
            legend="Режим записи"
            name="join_mode"
            value={joinMode}
            onChange={setJoinMode}
            choices={[
              { value: "open", title: "Свободная запись", description: JOIN_MODE_HINT.open, icon: Zap },
              { value: "approval", title: "По заявке", description: JOIN_MODE_HINT.approval, icon: ClipboardCheck },
            ]}
          />
          {approvedOrg && (
            <ChoiceCards
              legend="От чьего имени"
              name="author"
              value={author}
              onChange={setAuthor}
              choices={[
                { value: "me", title: user?.name ?? "От себя", description: "Вы — частный организатор", icon: UserRound },
                { value: "org", title: approvedOrg.name, description: "Мероприятие появится на странице организации", icon: Building2 },
              ]}
            />
          )}
        </Card>

        {create.isError && (
          <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink">
            {errorMessage(create.error)}
          </p>
        )}
        {touched && !valid && (
          <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink">
            Проверьте поля, отмеченные красным.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="lg" onClick={() => navigate(-1)}>
            Отмена
          </Button>
          <Button type="submit" size="lg" loading={create.isPending}>
            Опубликовать
          </Button>
        </div>
      </form>
    </div>
  );
}

interface ZoneChooserProps {
  venue: Venue;
  zoneId: number | null;
  onChange: (id: number) => void;
  error?: string;
  endError?: string;
  availability: Availability | undefined;
  onPickSlot: (slot: { starts_at: string; ends_at: string }) => void;
}

/** Выбор зоны площадки и проверка, свободна ли она в выбранное время. */
function ZoneChooser({ venue, zoneId, onChange, error, endError, availability, onPickSlot }: ZoneChooserProps) {
  const groups = venue.zones.reduce<Record<string, Venue["zones"]>>((acc, zone) => {
    (acc[zone.group_name ?? ""] ??= []).push(zone);
    return acc;
  }, {});
  const zone = venue.zones.find((z) => z.id === zoneId);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] text-muted">
        {venue.address}, {venue.city}
      </p>
      <div role="group" aria-label="Зона площадки" className="flex flex-col gap-3">
        {Object.entries(groups).map(([group, zones]) => (
          <div key={group || "main"}>
            {group && <p className="mb-1.5 text-sm font-medium text-muted">{group}</p>}
            <div className="flex flex-wrap gap-2">
              {zones.map((z) => (
                <Pill key={z.id} active={z.id === zoneId} onClick={() => onChange(z.id)} icon={<Users className="size-4" aria-hidden />}>
                  {z.name} · до {z.capacity}
                </Pill>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}
      {zone && endError && (
        <p role="alert" className="text-sm font-medium text-danger-ink">
          {endError}
        </p>
      )}
      {zone && availability?.free && (
        <Notice tone="success" icon={CheckCircle2} title="В это время зона свободна">
          {zone.name}: вместимость {zone.capacity} чел.
          {zone.buffer_minutes > 0 && ` После мероприятия ${zone.buffer_minutes} мин. на подготовку.`}
        </Notice>
      )}
      {zone && availability && !availability.free && (
        <Notice
          tone="danger"
          icon={TriangleAlert}
          title="В выбранное время зона занята"
          action={
            availability.suggestion && (
              <Button variant="secondary" size="sm" onClick={() => onPickSlot(availability.suggestion!)}>
                Выбрать это время
              </Button>
            )
          }
        >
          {availability.message}
        </Notice>
      )}
      {zone && availability && availability.busy.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-muted">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Занято в этот день:{" "}
            {availability.busy.map((b) => `${dayjs(b.starts_at).format("HH:mm")}–${dayjs(b.ends_at).format("HH:mm")}`).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
