import { Hand, Plus, SearchX } from "lucide-react";
import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DateStrip } from "@/components/DateStrip";
import { HomeMapSection } from "@/components/EventMap/HomeMapSection";
import { EventGrid } from "@/components/EventGrid";
import { FeaturedBanner, FeaturedBannerSkeleton } from "@/components/FeaturedBanner";
import { SearchBar } from "@/components/SearchBar";
import { SimpleDatePicker } from "@/components/SimpleDatePicker";
import { SimpleHint, SimpleStep } from "@/components/SimpleHint";
import { SportChips } from "@/components/SportChips";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { useAccessibility } from "@/features/accessibility";
import { useAuth } from "@/features/auth";
import { useEvents, useFeaturedEvent, useSports } from "@/features/events";
import { dayjs } from "@/lib/dates";
import { eventsInCityTitle } from "@/lib/names";
import { demandTitle } from "@/components/DemandList";
import { Card } from "@/components/ui/Card";
import { useDemand } from "@/features/planning";

// Город для гостей и пользователей без города в профиле
const GUEST_CITY = "Москва";

export function HomePage() {
  // Фильтры живут в адресной строке: ссылкой можно поделиться, «назад» возвращает прежний поиск
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  // По умолчанию — город из профиля; выбранный в фильтре город хранится в адресе и важнее
  const homeCity = user?.city || GUEST_CITY;
  const chosenCity = params.get("city");
  const city = chosenCity ?? homeCity;
  // Пока профиль грузится, город по умолчанию ещё неизвестен — не запрашиваем чужой город
  const cityReady = Boolean(chosenCity) || !authLoading;
  const q = params.get("q") ?? "";
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

  const events = useEvents({ q: q || undefined, city, date: date ?? undefined, sport_id: sportId ?? undefined }, cityReady);
  const featured = useFeaturedEvent(city, cityReady);
  const sports = useSports();
  const demand = useDemand(city, cityReady);
  const { simple } = useAccessibility().settings;

  const hasFilters = Boolean(q || date || sportId);
  const resetFilters = () => setParams(city === homeCity ? {} : { city }, { replace: true });

  return (
    <div className="page-container max-w-[1180px] pt-6 lg:pt-10">
      <h1 className="text-[clamp(32px,3.9vw,58px)] font-bold leading-[1.05] tracking-[-0.025em]">
        Найдите компанию для спорта сегодня
      </h1>

      <SimpleHint className="mt-5" title="Как записаться на занятие">
        Выберите день, откройте занятие и нажмите «Записаться». Всё остальное можно не трогать.
      </SimpleHint>

      <SimpleStep n={1} title="Где вы будете заниматься?" className="mt-6">
        Город уже выбран. Чтобы сменить его, нажмите на него. Искать по названию необязательно.
      </SimpleStep>
      <div className={simple ? "mt-4" : "mt-6 lg:mt-8"}>
        <SearchBar
          query={q}
          onQueryChange={setQuery}
          city={city}
          onCityChange={(value) => update("city", value === homeCity ? null : value)}
        />
      </div>

      <SimpleStep n={2} title="В какой день?" className="mt-7">
        Нажмите «Сегодня» или «Завтра». Если нужен другой день, выберите его в календаре.
      </SimpleStep>
      <div className="mt-5">
        {simple ? (
          <SimpleDatePicker value={date} onChange={(value) => update("date", value)} />
        ) : (
          <DateStrip value={date} onChange={(value) => update("date", value)} />
        )}
      </div>

      <SimpleStep n={3} title="Какой вид спорта?" className="mt-7">
        Нажмите на нужный. Если не выбирать, покажем все занятия.
      </SimpleStep>
      <div className="mt-4">
        <SportChips sports={sports.data} value={sportId} onChange={(id) => update("sport", id ? String(id) : null)} />
      </div>

      {/* Простой режим: без баннера, подсказки про «Я бы пошёл» и карты — они повторяют основной список */}
      {!simple && (
        <>
          <div className="mt-7">
            {featured.isPending ? <FeaturedBannerSkeleton /> : featured.data && <FeaturedBanner event={featured.data} />}
          </div>

          <Card className="mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-level">
              <Hand className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Не нашли подходящее время? Отметьте «Я бы пошёл»</p>
              <p className="text-muted">
                {demand.data?.[0]
                  ? `Сейчас в этом городе: ${demandTitle(demand.data[0])}.`
                  : "Организовывать самим не нужно: мы соберём тех, кто хочет того же, и сообщим, когда появится встреча."}
              </p>
            </div>
            <ButtonLink to="/interest" variant="secondary">
              Я бы пошёл
            </ButtonLink>
          </Card>

          <div className="mt-6">
            <HomeMapSection events={events.data} city={city} onEventSelect={(id) => navigate(`/events/${id}`)} />
          </div>
        </>
      )}

      <SimpleStep n={4} title="Выберите занятие" className="mt-8">
        Нажмите на большую кнопку «Подробнее и запись» у нужного занятия. Там будут адрес, время и условия.
      </SimpleStep>

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
