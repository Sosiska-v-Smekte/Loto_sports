import { Building2, ClipboardCheck, UserRound, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { errorMessage } from "@/api/client";
import { eventsApi } from "@/api/endpoints";
import type { JoinMode, Level } from "@/api/types";
import { BackLink } from "@/components/BackLink";
import { SportPicker, type SportChoice } from "@/components/SportPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceCards } from "@/components/ui/ChoiceCards";
import { Input, Textarea } from "@/components/ui/Field";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { useSports } from "@/features/events";
import { useMyOrganization } from "@/features/me";
import { dayjs } from "@/lib/dates";
import { JOIN_MODE_HINT, LEVEL_HINT, LEVEL_LABEL } from "@/lib/status";

type Author = "me" | "org";

const LEVELS: Level[] = ["any", "beginner", "amateur", "pro"];

export function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sports = useSports();
  const organization = useMyOrganization();
  const approvedOrg = organization.data?.status === "approved" ? organization.data : null;

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: dayjs().add(1, "day").format("YYYY-MM-DD"),
    time: "19:00",
    endTime: "",
    city: user?.city ?? "Москва",
    address: "",
    placeDetails: "",
    requirements: "",
  });
  const [sport, setSport] = useState<SportChoice>(null);
  const [level, setLevel] = useState<Level>("any");
  const [joinMode, setJoinMode] = useState<JoinMode>("open");
  const [author, setAuthor] = useState<Author>(params.get("as") === "org" ? "org" : "me");
  const [touched, setTouched] = useState(false);

  const startsAt = dayjs(`${form.date}T${form.time}`);
  const endsAt = form.endTime ? dayjs(`${form.date}T${form.endTime}`) : null;
  const errors = {
    title: form.title.trim().length < 3 ? "Название — минимум 3 символа" : undefined,
    sport: sport ? undefined : "Выберите направление или добавьте своё",
    date: !startsAt.isValid() || !startsAt.isAfter(dayjs()) ? "Выберите дату и время в будущем" : undefined,
    endTime: endsAt && !endsAt.isAfter(startsAt) ? "Окончание должно быть позже начала" : undefined,
    city: form.city.trim().length < 2 ? "Укажите город" : undefined,
    address: form.address.trim().length < 3 ? "Укажите адрес или название площадки" : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) => (touched ? errors[key] : undefined);

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
        city: form.city.trim(),
        address: form.address.trim(),
        place_details: form.placeDetails.trim(),
        level,
        requirements: form.requirements.trim(),
        join_mode: joinMode,
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

      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-6">
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Что за активность</h2>
          <Input label="Название" placeholder="Например: Утренняя пробежка в парке" maxLength={120} required error={show("title")} {...field("title")} />
          <SportPicker sports={sports.data} value={sport} onChange={setSport} error={show("sport")} />
          <Textarea label="Описание" placeholder="Как всё будет проходить, сколько длится, кого ждёте" rows={4} maxLength={2000} {...field("description")} />
        </Card>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Когда и где</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Дата" type="date" min={dayjs().format("YYYY-MM-DD")} required error={show("date")} {...field("date")} />
            <Input label="Начало" type="time" required {...field("time")} />
            <Input label="Окончание" type="time" hint="Необязательно" error={show("endTime")} {...field("endTime")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Input label="Город" required error={show("city")} {...field("city")} />
            <Input label="Адрес или площадка" placeholder="Парк Горького, главный вход" required error={show("address")} {...field("address")} />
          </div>
          <Input label="Как найти место" placeholder="Например: встречаемся у фонтана, поле №2" {...field("placeDetails")} />
        </Card>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Для кого</h2>
          <ChoiceCards
            legend="Уровень подготовки"
            name="level"
            value={level}
            onChange={setLevel}
            columns={4}
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
