import { CalendarCheck, MousePointerClick, Search } from "lucide-react";

const STEPS = [
  { icon: Search, title: "Выберите занятие", text: "Ниже — все события в вашем городе. Можно выбрать день и вид спорта." },
  { icon: MousePointerClick, title: "Нажмите «Подробнее и запись»", text: "Откроется страница с адресом, временем и условиями." },
  { icon: CalendarCheck, title: "Нажмите «Записаться»", text: "Или «Подать заявку» — тогда организатор ответит в уведомлениях." },
];

/** Подсказка «как это работает» для простого режима. */
export function SimpleSteps() {
  return (
    <section data-simple-only aria-label="Как записаться" className="neu-raised mt-6 flex-col gap-4 rounded-card bg-surface p-5 sm:p-6">
      <h2 className="text-[22px] font-semibold">Как записаться на занятие</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="neu-primary grid size-12 shrink-0 place-items-center rounded-full bg-primary text-xl font-bold text-white">
              {i + 1}
            </span>
            <span>
              <span className="flex items-center gap-2 text-lg font-semibold">
                <step.icon className="hidden size-5 shrink-0 text-primary sm:block" aria-hidden />
                {step.title}
              </span>
              <span className="mt-1 block text-[17px] leading-snug text-muted">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
