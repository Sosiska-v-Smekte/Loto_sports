import { MapPin, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { venuesApi } from "@/api/endpoints";
import type { Venue, VenueInput } from "@/api/types";
import { useAction } from "@/features/action";
import { useVenues } from "@/features/planning";
import { CityCombobox } from "../CityCombobox";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { Skeleton } from "../ui/Skeleton";
import { ErrorState } from "../ui/States";

type ZoneDraft = { name: string; group_name: string; capacity: string; buffer_minutes: string };
const emptyZone = (): ZoneDraft => ({ name: "", group_name: "", capacity: "10", buffer_minutes: "0" });

const toZone = (z: ZoneDraft) => ({
  name: z.name.trim(),
  group_name: z.group_name.trim() || null,
  capacity: Number(z.capacity),
  buffer_minutes: Number(z.buffer_minutes) || 0,
});
const zoneValid = (z: ZoneDraft) => z.name.trim().length >= 2 && Number(z.capacity) >= 1 && Number(z.capacity) <= 500;

/** Площадки организации: адрес и зоны, которые бронируются по одной (одно мероприятие на зону одновременно). */
export function VenuesManager({ city }: { city: string }) {
  const venues = useVenues();
  const [adding, setAdding] = useState(false);
  const mine = venues.data?.filter((v) => v.can_manage) ?? [];

  return (
    <section aria-labelledby="venues-title" className="flex flex-col gap-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="venues-title" className="text-lg font-semibold">
            Площадки и зоны
          </h3>
          <p className="text-muted">
            Мероприятие привязывается к зоне. Две группы в одной зоне одновременно невозможны, в разных зонах можно.
          </p>
        </div>
        {!adding && (
          <Button variant="secondary" size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => setAdding(true)}>
            Добавить площадку
          </Button>
        )}
      </div>

      {adding && <VenueForm defaultCity={city} onDone={() => setAdding(false)} />}

      {venues.isPending ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : venues.isError ? (
        <ErrorState error={venues.error} onRetry={() => venues.refetch()} />
      ) : mine.length === 0 && !adding ? (
        <p className="text-muted">Площадок пока нет. Добавьте первую, чтобы привязывать к ней мероприятия.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {mine.map((venue) => (
            <VenueRow key={venue.id} venue={venue} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VenueRow({ venue }: { venue: Venue }) {
  const addZone = useAction((z: VenueInput["zones"][number]) => venuesApi.addZone(venue.id, z), "Зона добавлена");
  const removeZone = useAction(venuesApi.removeZone, "Зона удалена");
  const [draft, setDraft] = useState<ZoneDraft | null>(null);

  return (
    <li className="rounded-2xl border border-line/70 bg-surface-muted p-4">
      <p className="font-semibold">{venue.name}</p>
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="size-4" aria-hidden />
        {venue.address}, {venue.city}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {venue.zones.map((zone) => (
          <li key={zone.id} className="flex min-h-10 items-center gap-2 rounded-full bg-surface py-1 pl-3 pr-1 text-[15px]">
            <Users className="size-4" aria-hidden />
            <span>
              {zone.group_name ? `${zone.group_name}: ` : ""}
              {zone.name} · до {zone.capacity}
              {zone.buffer_minutes > 0 && ` · буфер ${zone.buffer_minutes} мин`}
            </span>
            <button
              type="button"
              aria-label={`Удалить зону ${zone.name}`}
              disabled={removeZone.isPending}
              onClick={() => removeZone.mutate(zone.id)}
              className="pressable grid size-8 place-items-center rounded-full hover:bg-surface-muted"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {draft ? (
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (zoneValid(draft)) addZone.mutate(toZone(draft), { onSuccess: () => setDraft(null) });
          }}
        >
          <ZoneFields value={draft} onChange={setDraft} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={addZone.isPending} disabled={!zoneValid(draft)}>
              Сохранить зону
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
              Отмена
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="ghost" size="sm" className="mt-2" icon={<Plus className="size-4" aria-hidden />} onClick={() => setDraft(emptyZone())}>
          Добавить зону
        </Button>
      )}
    </li>
  );
}

function ZoneFields({ value, onChange }: { value: ZoneDraft; onChange: (z: ZoneDraft) => void }) {
  const bind = (key: keyof ZoneDraft) => ({
    value: value[key],
    onChange: (e: { target: { value: string } }) => onChange({ ...value, [key]: e.target.value }),
  });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="Название зоны" placeholder="Малый зал или Стол №1" required maxLength={120} {...bind("name")} />
      <Input label="Группа" placeholder="Зал настольного тенниса" hint="Необязательно" maxLength={120} {...bind("group_name")} />
      <Input label="Вместимость, чел." type="number" min={1} max={500} required {...bind("capacity")} />
      <Input label="Буфер после, мин" type="number" min={0} max={240} hint="Время на подготовку и уборку" {...bind("buffer_minutes")} />
    </div>
  );
}

function VenueForm({ defaultCity, onDone }: { defaultCity: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [address, setAddress] = useState("");
  const [zones, setZones] = useState<ZoneDraft[]>([{ ...emptyZone(), name: "Основной зал" }]);
  const [touched, setTouched] = useState(false);
  const create = useAction(venuesApi.create, "Площадка добавлена");

  const valid = name.trim().length >= 2 && address.trim().length >= 3 && zones.every(zoneValid);
  const submit = () => {
    setTouched(true);
    if (!valid) return;
    create.mutate({ name: name.trim(), city, address: address.trim(), zones: zones.map(toZone) }, { onSuccess: onDone });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4 rounded-2xl border border-line/70 bg-surface-muted p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Название площадки"
          placeholder="Спортивный центр «Старт»"
          required
          maxLength={120}
          value={name}
          error={touched && name.trim().length < 2 ? "Укажите название" : undefined}
          onChange={(e) => setName(e.target.value)}
        />
        <CityCombobox label="Город" required value={city} onChange={setCity} />
        <div className="sm:col-span-2">
          <Input
            label="Адрес"
            placeholder="ул. Ленина, 10"
            required
            value={address}
            error={touched && address.trim().length < 3 ? "Укажите улицу и дом" : undefined}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <p className="font-medium">Зоны, которые бронируются отдельно</p>
        {zones.map((zone, index) => (
          <div key={index} className="rounded-2xl bg-surface p-3">
            <ZoneFields value={zone} onChange={(z) => setZones((all) => all.map((item, i) => (i === index ? z : item)))} />
            {zones.length > 1 && (
              <Button variant="ghost" size="sm" className="mt-2" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setZones((all) => all.filter((_, i) => i !== index))}>
                Убрать зону
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" className="self-start" icon={<Plus className="size-4" aria-hidden />} onClick={() => setZones((all) => [...all, emptyZone()])}>
          Ещё зона
        </Button>
      </div>
      {touched && !valid && (
        <p role="alert" className="text-sm font-medium text-danger-ink">
          Проверьте названия и вместимость зон.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={create.isPending}>
          Добавить площадку
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
