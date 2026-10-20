import { CalendarCheck, Eye, LogIn, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { AccessibilityPanel } from "@/components/AccessibilityMenu";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const TILES = [
  { icon: "football", background: "#F6D46A", rotate: "-rotate-3" },
  { icon: "running-shoes", background: "#C3D69A", rotate: "rotate-2" },
  { icon: "volleyball", background: "#AFC3EE", rotate: "rotate-3" },
  { icon: "swim-goggles", background: "#CDB8EE", rotate: "-rotate-2" },
] as const;

const STEPS = [
  { icon: Search, title: "Найдите занятие", text: "Футбол, бег, шахматы, плавание: выберите город, день и направление." },
  { icon: CalendarCheck, title: "Запишитесь", text: "Одной кнопкой или заявкой организатору. Ответ придёт в уведомления." },
  { icon: Users, title: "Приходите в компанию", text: "Адрес, время и условия у вас перед глазами, а напоминание придёт заранее." },
];

/** Стартовая страница для гостей: либо войти, либо зарегистрироваться. События можно посмотреть и без входа. */
export function WelcomePage({ onBrowse }: { onBrowse: () => void }) {
  const [a11yOpen, setA11yOpen] = useState(false);
  return (
    <div className="page-container max-w-[1180px] pt-8 lg:pt-14">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <p className="text-[15px] font-medium uppercase tracking-[0.08em] text-muted">Спортивный клуб</p>
          <h1 className="mt-3 text-[clamp(34px,4.4vw,62px)] font-bold leading-[1.04] tracking-[-0.025em]">
            Найдите компанию для спорта рядом с вами
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Пробежки, матчи, шахматы и секции в вашем городе. Войдите или зарегистрируйтесь, чтобы записываться на активности и
            создавать свои.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/login" size="lg" icon={<LogIn className="size-5" aria-hidden />} className="sm:min-w-[210px]">
              Войти
            </ButtonLink>
            <ButtonLink to="/register" variant="secondary" size="lg" icon={<UserPlus className="size-5" aria-hidden />} className="sm:min-w-[210px]">
              Зарегистрироваться
            </ButtonLink>
          </div>
          <button type="button" onClick={onBrowse} className="mt-5 text-[17px] font-medium text-primary underline underline-offset-4">
            Сначала посмотреть события без входа
          </button>
        </div>

        <div aria-hidden className="grid grid-cols-2 gap-4 sm:gap-5">
          {TILES.map((tile, i) => (
            <div
              key={tile.icon}
              className={`tinted-3d grid aspect-square place-items-center rounded-[28px] shadow-card ${tile.rotate} ${i % 2 ? "translate-y-4" : ""}`}
              style={{ backgroundColor: tile.background }}
            >
              <img src={`/sport-icons/${tile.icon}.webp`} alt="" width={384} height={384} className="illustration size-[68%] object-contain" />
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Как это работает" className="mt-14 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <Card key={step.title} className="flex gap-4 p-5">
            <span className="neu-primary grid size-12 shrink-0 place-items-center rounded-full bg-primary text-xl font-bold text-white">{i + 1}</span>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <step.icon className="size-5 shrink-0 text-primary" aria-hidden />
                {step.title}
              </h2>
              <p className="mt-1 text-[16px] leading-snug text-muted">{step.text}</p>
            </div>
          </Card>
        ))}
      </section>

      <Card className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Eye className="size-6" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Удобно всем</h2>
          <p className="text-muted">
            Есть режимы для слабовидящих, для людей с нарушением цветовосприятия и простой режим для старшего поколения.
            Включить их можно прямо сейчас.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setA11yOpen(true)}>
          Настроить доступность
        </Button>
      </Card>
      <AccessibilityPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />
    </div>
  );
}
