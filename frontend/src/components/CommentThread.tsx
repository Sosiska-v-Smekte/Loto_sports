import { EyeOff, LogIn, MessageCircleQuestion, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { adminApi, eventsApi } from "@/api/endpoints";
import type { Comment, SportEvent } from "@/api/types";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { useComments } from "@/features/events";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/dates";
import { ReasonModal } from "./ReasonModal";
import { Avatar } from "./ui/Avatar";
import { Button, ButtonLink } from "./ui/Button";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { EmptyState, ErrorState } from "./ui/States";
import { Tag } from "./ui/Tag";

export function CommentThread({ event }: { event: SportEvent }) {
  const { user } = useAuth();
  const comments = useComments(event.id);
  const [hideTarget, setHideTarget] = useState<Comment | null>(null);
  const { hash } = useLocation();
  const loaded = comments.isSuccess;

  // Переход по ссылке «Обсуждение» из админки: прокручиваем, когда сообщения уже отрисованы
  useEffect(() => {
    if (loaded && hash === "#discussion") document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" });
  }, [loaded, hash]);
  const hide = useAction(
    ({ id, reason }: { id: number; reason: string }) => adminApi.hideComment(id, reason),
    "Сообщение скрыто, остальные остались на месте",
  );

  return (
    <Card id="discussion" className="scroll-mt-28 p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Обсуждение</h2>
      <p className="mt-1 text-muted">Задайте вопрос — организатор ответит здесь. Ответы организатора отмечены.</p>

      <div className="mt-4">
        {comments.isPending && (
          <div className="space-y-3" aria-hidden>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}
        {comments.isError && <ErrorState error={comments.error} onRetry={() => comments.refetch()} />}
        {comments.data?.length === 0 && (
          <EmptyState icon={MessageCircleQuestion} title="Вопросов пока нет" text="Будьте первым — спросите про место, уровень или что взять с собой." />
        )}
        {comments.data && comments.data.length > 0 && (
          <ol className="flex flex-col gap-3">
            {comments.data.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                canHide={Boolean(user?.is_admin) && !comment.is_hidden}
                onHide={() => setHideTarget(comment)}
              />
            ))}
          </ol>
        )}
      </div>

      <CommentForm event={event} />

      <ReasonModal
        open={hideTarget !== null}
        onClose={() => setHideTarget(null)}
        title="Скрыть сообщение?"
        description="Остальные сообщения останутся. Пользователи увидят «Сообщение скрыто модератором»."
        confirmLabel="Скрыть"
        danger
        loading={hide.isPending}
        onConfirm={(reason) =>
          hideTarget && hide.mutate({ id: hideTarget.id, reason }, { onSuccess: () => setHideTarget(null) })
        }
      />
    </Card>
  );
}

function CommentItem({ comment, canHide, onHide }: { comment: Comment; canHide: boolean; onHide: () => void }) {
  if (comment.is_hidden && comment.text === null) {
    return (
      <li className="flex items-center gap-2 rounded-[18px] border border-dashed border-line px-4 py-3 italic text-muted">
        <EyeOff className="size-4 shrink-0" aria-hidden />
        Сообщение скрыто модератором
      </li>
    );
  }
  return (
    <li
      className={cn(
        "rounded-[18px] px-4 py-3",
        comment.is_organizer_reply ? "ml-4 border-l-4 border-primary bg-primary-soft sm:ml-10" : "bg-surface-muted",
        comment.is_hidden && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Avatar name={comment.author.name} id={comment.author.id} src={comment.author.avatar_url} />
        <span className="font-semibold">{comment.author.name}</span>
        {comment.is_organizer_reply && (
          <Tag tone="success" icon={ShieldCheck}>
            Ответ организатора
          </Tag>
        )}
        <span className="text-sm text-muted">{formatRelative(comment.created_at)}</span>
        {canHide && (
          <Button size="sm" variant="ghost" className="ml-auto !min-h-9 text-danger-ink" onClick={onHide} icon={<EyeOff className="size-4" aria-hidden />}>
            Скрыть
          </Button>
        )}
      </div>
      <p className="mt-2 whitespace-pre-line break-words">{comment.text}</p>
      {comment.is_hidden && (
        <p className="mt-2 text-sm font-medium text-danger-ink">
          Скрыто модератором{comment.hidden_reason ? `: ${comment.hidden_reason}` : ""} (видно только администратору)
        </p>
      )}
    </li>
  );
}

function CommentForm({ event }: { event: SportEvent }) {
  const { user } = useAuth();
  const location = useLocation();
  const [text, setText] = useState("");
  const send = useAction((value: string) => eventsApi.addComment(event.id, value), "Сообщение опубликовано");

  if (event.status !== "published") return null;
  if (!user) {
    return (
      <ButtonLink
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        variant="secondary"
        className="mt-5"
        icon={<LogIn className="size-5" aria-hidden />}
      >
        Войдите, чтобы задать вопрос
      </ButtonLink>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) send.mutate(text.trim(), { onSuccess: () => setText("") });
  };

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
      <label htmlFor="comment" className="font-medium">
        {event.can_manage ? "Ответить участникам" : "Ваш вопрос организатору"}
      </label>
      <textarea
        id="comment"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={event.can_manage ? "Например: «Мячи и манишки будут на месте»" : "Например: «Можно прийти без опыта?»"}
        className="w-full resize-y rounded-[20px] border border-line bg-white/80 px-5 py-3 leading-relaxed placeholder:text-[#9a8f80] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
      <Button type="submit" className="self-end" loading={send.isPending} disabled={!text.trim()} icon={<Send className="size-4" aria-hidden />}>
        Отправить
      </Button>
    </form>
  );
}
