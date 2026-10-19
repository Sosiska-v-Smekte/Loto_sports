import { Plus, SearchX } from "lucide-react";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DateStrip } from "@/components/DateStrip";
import { EventGrid } from "@/components/EventGrid";
import { FeaturedBanner, FeaturedBannerSkeleton } from "@/components/FeaturedBanner";
import { SearchBar } from "@/components/SearchBar";
import { SportChips } from "@/components/SportChips";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { useCities, useEvents, useFeaturedEvent, useSports } from "@/features/events";
import { dayjs } from "@/lib/dates";
import { eventsInCityTitle } from "@/lib/names";

const DEFAULT_CITY = "Москва";

export function HomePage() {
  // Фильтры живут в адресной строке: ссылкой можно поделиться, «назад» возвращает прежний поиск
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const city = params.get("city") ?? DEFAULT_CITY;
  const date = params.get("date");
  const sportId = params.get("sport") ? Number(params.get("sport")) : null;

  const update = useCallback(
    (key: string, value: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  // Без trim: иначе пробел, набранный перед паузой, «съедался» бы при синхронизации с адресом
  const setQuery = useCallback((value: string) => update("q", value || null), [update]);

  const events = useEvents({ q: q || undefined, city, date: date ?? undefined, sport_id: sportId ?? undefined });
  const featured = useFeaturedEvent(city);
  const cities = useCities();
  const sports = useSports();

  const hasFilters = Boolean(q || date || sportId);
  const resetFilters = () => setParams(city === DEFAULT_CITY ? {} : { city }, { replace: true });

  return (
    <div className="page-container max-w-[1180px] pt-6 lg:pt-10">
      <h1 className="text-[clamp(32px,3.9vw,58px)] font-bold leading-[1.05] tracking-[-0.025em]">
        Найдите компанию для спорта сегодня
      </h1>

      <div className="mt-6 lg:mt-8">
        <SearchBar
          query={q}
          onQueryChange={setQuery}
          city={city}
          cities={cities.data ?? [DEFAULT_CITY]}
          onCityChange={(value) => update("city", value === DEFAULT_CITY ? null : value)}
        />
      </div>

      <div className="mt-5">
        <DateStrip value={date} onChange={(value) => update("date", value)} />
      </div>

      <div className="mt-4">
        <SportChips sports={sports.data} value={sportId} onChange={(id) => update("sport", id ? String(id) : null)} />
      </div>

      <div className="mt-7">
        {featured.isPending ? <FeaturedBannerSkeleton /> : featured.data && <FeaturedBanner event={featured.data} />}
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <SectionTitle className="sm:text-[32px]">{eventsInCityTitle(city)}</SectionTitle>
          {date && <p className="mt-1 text-muted">на {dayjs(date).format("D MMMM, dddd")}</p>}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="underline underline-offset-4">
            Сбросить фильтры
          </Button>
        )}
      </div>

      <EventGrid
        events={events.data}
        isPending={events.isPending}
        error={events.error}
        onRetry={() => events.refetch()}
        isStale={events.isPlaceholderData}
        className="mt-5"
        empty={
          <EmptyState
            icon={SearchX}
            title={hasFilters ? "Ничего не нашлось" : "Пока нет событий в этом городе"}
            text={
              hasFilters
                ? "Попробуйте другую дату или направление — или соберите свою компанию."
                : "Станьте первым: создайте активность, и люди рядом смогут присоединиться."
            }
            action={
              <div className="flex flex-wrap justify-center gap-3">
                {hasFilters && (
                  <Button variant="secondary" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                )}
                <ButtonLink to="/events/new" icon={<Plus className="size-5" aria-hidden />}>
                  Создать активность
                </ButtonLink>
              </div>
            }
          />
        }
      />
    </div>
  );
}
