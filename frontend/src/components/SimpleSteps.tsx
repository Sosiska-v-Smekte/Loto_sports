import { CalendarCheck, MousePointerClick, Search } from "lucide-react";

const STEPS = [
  { icon: Search, title: "Выберите занятие", text: "Ниже — все события в вашем городе. Можно выбрать день и вид спорта." },
  { icon: MousePointerClick, title: "Нажмите «Подробнее и запись»", text: "Откроется страница с адресом, временем и условиями." },
  { icon: CalendarCheck, title: "Нажмите «Записаться»", text: "Или «Подать заявку» — тогда организатор ответит в уведомлениях." },
];

/** Подсказка «как это работает» для простого режима. */
export function SimpleSteps() {
  return (
    <section data-simple-only aria-label="Как записаться" className="neu-raised mt-6 flex-col gap-3 rounded-card bg-surface p-4 sm:gap-4 sm:p-6">
      <h2 className="text-xl font-semibold sm:text-[22px]">Как записаться на занятие</h2>
      {/* На телефоне только заголовки шагов: подсказка не должна занимать весь первый экран */}
      <ol className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-center gap-3 sm:items-start">
            <span className="neu-primary grid size-10 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-white sm:size-12 sm:text-xl">
              {i + 1}
            </span>
            <span>
              <span className="flex items-center gap-2 text-lg font-semibold leading-snug">
                <step.icon className="hidden size-5 shrink-0 text-primary sm:block" aria-hidden />
                {step.title}
              </span>
              <span className="mt-1 hidden text-[17px] leading-snug text-muted sm:block">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
