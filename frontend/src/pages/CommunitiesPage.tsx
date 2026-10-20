import { Building2, MapPin, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Organization } from "@/api/types";
import { Engraving } from "@/components/Engraving";
import { JoinCommunityButton } from "@/components/JoinCommunityButton";
import { MyOrganization } from "@/components/organization/MyOrganization";
import { SportIllustration } from "@/components/SportIllustration";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { useColorSafe } from "@/features/accessibility";
import { useAuth } from "@/features/auth";
import { useMyOrganization } from "@/features/me";
import { useOrganizations } from "@/features/organizations";
import { mutedColor, safeCardColor } from "@/lib/color";
import { membersLabel } from "@/lib/interests";

type Filter = "all" | "running" | "games" | "mine";

// Игровые виды: командные и с мячом, настольные и парные игры
const GAME_SLUGS = new Set(["football", "basketball", "volleyball", "tennis", "table-tennis", "chess", "hockey", "badminton", "billiards", "bowling"]);

const matches = (org: Organization, filter: Filter) => {
  if (filter === "mine") return org.is_member;
  if (filter === "running") return org.sport?.slug === "running" || /\bбег/i.test(org.sports);
  if (filter === "games") return Boolean(org.sport?.slug && GAME_SLUGS.has(org.sport.slug));
  return true;
};

const eventsLabel = (n: number) =>
  `${n} ${n % 10 === 1 && n % 100 !== 11 ? "активное событие" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "активных события" : "активных событий"}`;

export function CommunitiesPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [params] = useSearchParams();
  const { user } = useAuth();
  const organizations = useOrganizations(q.trim());
  const myOrganization = useMyOrganization(Boolean(user));
  const [applying, setApplying] = useState(params.get("apply") === "1");

  const list = organizations.data?.filter((org) => matches(org, filter)) ?? [];
  // Крупные карточки: два самых многолюдных сообщества; остальные в общем списке ниже
  const featured = [...list].sort((a, b) => b.members_count - a.members_count).slice(0, 2);
  const rest = list.filter((org) => !featured.includes(org));
  const mine = organizations.data?.filter((org) => org.is_member) ?? [];
  const hasOrganization = Boolean(myOrganization.data);

  return (
    <div className="page-container max-w-6xl pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold leading-tight sm:text-[40px]">Сообщества</h1>
      <p className="mt-2 text-lg text-muted">Спортивные клубы, беговые сообщества и организаторы вашего города</p>

      {(hasOrganization || applying) && (
        <div className="mt-5">
          <MyOrganization applying={applying} onApplyingChange={setApplying} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по сообществам и клубам…"
                aria-label="Поиск сообществ"
                className="h-[52px] w-full rounded-full border border-line bg-surface-muted/90 pl-12 pr-5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div role="group" aria-label="Фильтр сообществ" className="no-scrollbar flex gap-2 overflow-x-auto">
              {(
                [
                  ["all", "Все"],
                  ["running", "Бег"],
                  ["games", "Игровые"],
                  ["mine", "Мои клубы"],
                ] as const
              ).map(([value, label]) => (
                <Pill key={value} active={filter === value} onClick={() => setFilter(value)}>
                  {label}
                </Pill>
              ))}
            </div>
          </div>

          {organizations.isPending && <Skeleton className="mt-6 h-56 rounded-card" />}
          {organizations.isError && <ErrorState error={organizations.error} onRetry={() => organizations.refetch()} className="mt-6" />}
          {organizations.data && list.length === 0 && (
            <EmptyState
              className="mt-6"
              icon={Building2}
              title={filter === "mine" ? "Вы пока ни в одном клубе" : "Сообществ не нашлось"}
              text={filter === "mine" ? "Вступите в сообщество кнопкой «Вступить»." : "Попробуйте другой запрос или фильтр."}
            />
          )}

          {featured.length > 0 && (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {featured.map((org) => (
                <li key={org.id}>
                  <FeaturedCard org={org} />
                </li>
              ))}
            </ul>
          )}

          {rest.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-semibold">Все сообщества и организаторы</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((org) => (
                  <li key={org.id}>
                    <CommunityCard org={org} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="flex flex-col gap-5" aria-label="Мои сообщества">
          <Card className="p-5">
            <h2 className="text-xl font-semibold">Мои сообщества</h2>
            {mine.length === 0 ? (
              <p className="mt-2 text-muted">{user ? "Вы пока не состоите ни в одном сообществе." : "Войдите, чтобы вступать в сообщества."}</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {mine.map((org) => (
                  <li key={org.id}>
                    <Link to={`/communities/${org.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      <Avatar name={org.name} id={org.id} src={org.avatar_url} size="md" />
                      <span className="min-w-0 leading-snug">{org.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {!hasOrganization && !applying && <ApplyBanner loggedIn={Boolean(user)} onApply={() => setApplying(true)} />}
        </aside>
      </div>
    </div>
  );
}

function ApplyBanner({ loggedIn, onApply }: { loggedIn: boolean; onApply: () => void }) {
  const colorSafe = useColorSafe();
  const background = colorSafe ? safeCardColor("#F2A9C8") : mutedColor("#F2A9C8");
  return (
    <section aria-labelledby="apply-title" className="tinted-3d rounded-card p-5" style={{ backgroundColor: background }}>
      <h2 id="apply-title" className="text-[22px] font-semibold leading-tight">
        Хотите проводить тренировки от лица клуба?
      </h2>
      <p className="mt-2">Создайте свою страницу и собирайте участников.</p>
      {loggedIn ? (
        <button type="button" onClick={onApply} className="pressable neu-control mt-4 min-h-11 w-full rounded-full border border-line/70 bg-white/80 px-5 font-medium">
          Подать заявку организации
        </button>
      ) : (
        <ButtonLink to="/login?next=%2Fcommunities%3Fapply%3D1" variant="secondary" className="mt-4 w-full">
          Войти и подать заявку
        </ButtonLink>
      )}
    </section>
  );
}

/** Крупная карточка с цветом и иллюстрацией направления. */
function FeaturedCard({ org }: { org: Organization }) {
  const colorSafe = useColorSafe();
  const color = org.sport?.color ?? "#E9CF9F";
  return (
    <article
      className="tinted-3d lift relative isolate flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-card p-5"
      style={{ backgroundColor: colorSafe ? safeCardColor(color) : color }}
    >
      <Engraving pattern={null} />
      <h3 className="max-w-[62%] text-[24px] font-semibold leading-tight">
        <Link to={`/communities/${org.id}`} className="after:absolute after:inset-0 after:content-['']">
          {org.name}
        </Link>
      </h3>
      {org.sport && <SportIllustration sport={org.sport} className="absolute right-3 top-3 text-[120px]" />}
      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tag tone="level" icon={UsersRound} size="md" className="bg-white/75">
          {membersLabel(org.members_count)}
        </Tag>
        {org.is_owner ? (
          <ButtonLink to={`/communities/${org.id}`}>Ваш клуб</ButtonLink>
        ) : (
          <JoinCommunityButton organization={org} />
        )}
      </div>
    </article>
  );
}

function CommunityCard({ org }: { org: Organization }) {
  return (
    <Card className="lift relative flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={org.name} id={org.id} src={org.avatar_url} size="lg" />
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">
            <Link to={`/communities/${org.id}`} className="after:absolute after:inset-0 after:content-['']">
              {org.name}
            </Link>
          </h3>
          <Tag tone="level" className="mt-1">
            {org.sport?.name ?? org.sports.split(",")[0]}
          </Tag>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-[15px] text-muted">
        <MapPin className="size-4 shrink-0" aria-hidden />
        {org.city} · {eventsLabel(org.active_events_count)}
      </p>
      <div className="relative z-10 mt-auto">
        {org.is_member || org.is_owner ? (
          <ButtonLink to={`/communities/${org.id}`} className="w-full">
            Перейти
          </ButtonLink>
        ) : (
          <JoinCommunityButton organization={org} joinLabel="Подписаться" joinVariant="secondary" className="w-full" />
        )}
      </div>
    </Card>
  );
}
