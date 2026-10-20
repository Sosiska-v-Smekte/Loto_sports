import { NotificationList } from "@/components/NotificationList";
import { SimpleHint } from "@/components/SimpleHint";
import { Card } from "@/components/ui/Card";

export function NotificationsPage() {
  return (
    <div className="page-container max-w-2xl pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold leading-tight sm:text-[40px]">Уведомления</h1>
      <p className="mt-2 text-muted">Ответы в обсуждениях, решения по заявкам и напоминания о скором начале.</p>
      <SimpleHint className="mt-4">Здесь приходят ответы на ваши заявки и напоминания о занятиях. Нажмите на сообщение, чтобы открыть занятие.</SimpleHint>
      <Card className="mt-5 p-3 sm:p-4">
        <NotificationList />
      </Card>
    </div>
  );
}
