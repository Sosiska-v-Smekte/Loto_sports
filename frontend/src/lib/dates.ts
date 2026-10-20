import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ru";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("ru");

export { dayjs };

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
// В русской локали dayjs сокращает месяцы с точкой («окт.»), нужно без неё
const shortMonth = (d: Dayjs) => d.format("MMM").replace(".", "");

/** «Сегодня, 19:00», «Завтра, 12:00», «Ср, 21 окт, 18:30». */
export function formatEventDate(iso: string): string {
  const d = dayjs(iso);
  const time = d.format("HH:mm");
  const today = dayjs().startOf("day");
  const diff = d.startOf("day").diff(today, "day");
  if (diff === 0) return `Сегодня, ${time}`;
  if (diff === 1) return `Завтра, ${time}`;
  const year = d.year() === today.year() ? "" : ` ${d.year()}`;
  return `${capitalize(d.format("dd"))}, ${d.date()} ${shortMonth(d)}${year}, ${time}`;
}

/** «Понедельник, 19 октября · 19:00–21:00». */
export function formatEventDateLong(startsAt: string, endsAt: string | null): string {
  const start = dayjs(startsAt);
  const day = capitalize(start.format("dddd, D MMMM"));
  // \u2060 не даёт разорвать «19:00–20:00» на две строки, а неразрывный пробел держит «·» при времени
  const end = endsAt ? `\u2060–\u2060${dayjs(endsAt).format("HH:mm")}` : "";
  return `${day}\u00a0· ${start.format("HH:mm")}${end}`;
}

export function formatRelative(iso: string): string {
  return dayjs(iso).fromNow();
}

export function formatShortDate(iso: string): string {
  const d = dayjs(iso);
  return `${d.date()} ${shortMonth(d)} ${d.year()}, ${d.format("HH:mm")}`;
}

export const toIsoDate = (d: Dayjs) => d.format("YYYY-MM-DD");

/** «19 Окт, 18:00» — коротко для строк расписания. */
export function formatShortWhen(iso: string): string {
  const d = dayjs(iso);
  return `${d.date()} ${capitalize(shortMonth(d))}, ${d.format("HH:mm")}`;
}
