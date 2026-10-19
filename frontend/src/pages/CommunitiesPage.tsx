import { Building2, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useOrganizations } from "@/features/organizations";

export function CommunitiesPage() {
  const [q, setQ] = useState("");
  const organizations = useOrganizations(q.trim());

  return (
    <div className="page-container max-w-5xl pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold sm:text-[40px]">Сообщества</h1>
      <p className="mt-2 text-lg text-muted">Клубы и секции, прошедшие проверку. У каждого — свои регулярные активности.</p>
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Название, направление или город"
          aria-label="Поиск сообществ"
          className="h-[52px] w-full rounded-full border border-line bg-surface-muted/90 pl-12 pr-5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {organizations.isPending && Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-40 rounded-card" />)}
        {organizations.isError && (
          <ErrorState error={organizations.error} onRetry={() => organizations.refetch()} className="md:col-span-2" />
        )}
        {organizations.data?.length === 0 && (
          <EmptyState icon={Building2} title="Сообществ не нашлось" text="Попробуйте другой запрос." className="md:col-span-2" />
        )}
        {organizations.data?.map((org) => (
          <Card key={org.id} className="lift relative p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              <Link to={`/communities/${org.id}`} className="after:absolute after:inset-0 after:content-['']">
                {org.name}
              </Link>
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-muted">
              <MapPin className="size-4" aria-hidden />
              {org.city} · {org.sports}
            </p>
            <p className="mt-3 line-clamp-3">{org.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
