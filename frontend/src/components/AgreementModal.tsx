import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

export type AgreementKind = "terms" | "cookies";

const TEXTS: Record<AgreementKind, { title: string; paragraphs: string[] }> = {
  terms: {
    title: "Пользовательское соглашение",
    paragraphs: [
      "Это учебный прототип сервиса «Спортивный клуб». Текст соглашения здесь заглушка: в рабочей версии тут будут условия использования сервиса.",
      "Регистрируясь, вы подтверждаете, что вам есть 14 лет, что указанные данные верны, и что вы будете уважительно относиться к другим участникам и организаторам.",
      "Организатор отвечает за информацию о своём мероприятии. Администратор может снять мероприятие или организацию с публикации, если они нарушают правила.",
    ],
  },
  cookies: {
    title: "Файлы cookie и данные в браузере",
    paragraphs: [
      "Сервис хранит в вашем браузере только необходимое: ключ входа, выбранные настройки доступности и вспомогательные настройки интерфейса. Рекламных и аналитических cookie нет.",
      "Это заглушка для прототипа. В рабочей версии здесь будет полный перечень файлов и срок их хранения.",
    ],
  },
};

export function AgreementModal({ kind, onClose }: { kind: AgreementKind | null; onClose: () => void }) {
  const text = kind ? TEXTS[kind] : null;
  return (
    <Modal open={Boolean(text)} onClose={onClose} title={text?.title ?? ""} footer={<Button onClick={onClose}>Понятно</Button>}>
      <div className="flex flex-col gap-3 text-[16px] leading-relaxed">
        {text?.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Modal>
  );
}
