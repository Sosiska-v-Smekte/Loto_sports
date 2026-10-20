import { CornerDownRight, EyeOff, LogIn, MessageCircleQuestion, Reply, Send, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import { adminApi, eventsApi } from "@/api/endpoints";
import type { Comment, SportEvent } from "@/api/types";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { useComments } from "@/features/events";
import { cn } from "@/lib/cn";
import { formatRelative, formatShortDate } from "@/lib/dates";
import { ReasonModal } from "./ReasonModal";
import { Avatar } from "./ui/Avatar";
import { Button, ButtonLink } from "./ui/Button";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { EmptyState, ErrorState } from "./ui/States";
import { Tag } from "./ui/Tag";

const MAX_LENGTH = 2000;

export function CommentThread({ event }: { event: SportEvent }) {
  const { user } = useAuth();
  const comments = useComments(event.id);
  const [hideTarget, setHideTarget] = useState<Comment | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Ветки в один уровень: исходное сообщение и все ответы на него (в том числе ответы на ответы)
  const threads = useMemo(() => {
    const list = comments.data ?? [];
    return list
      .filter((c) => c.root_id === c.id)
      .map((root) => ({ root, replies: list.filter((c) => c.root_id === root.id && c.id !== root.id) }));
  }, [comments.data]);

  const canReply = Boolean(user) && event.status === "published";
  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    textareaRef.current?.focus({ preventScroll: true });
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const itemProps = (comment: Comment) => ({
    comment,
    onReply: canReply && comment.text !== null ? () => startReply(comment) : undefined,
    onHide: user?.is_admin && !comment.is_hidden ? () => setHideTarget(comment) : undefined,
  });

  return (
    <Card id="discussion" className="scroll-mt-28 p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Обсуждение</h2>
      <p className="mt-1 text-muted">Задайте вопрос — организатор ответит здесь. Сообщения организатора отмечены.</p>

      <div className="mt-4">
        {comments.isPending && (
          <div className="space-y-3" aria-hidden>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}
        {comments.isError && <ErrorState error={comments.error} onRetry={() => comments.refetch()} />}
        {comments.data?.length === 0 && (
          <EmptyState icon={MessageCircleQuestion} title="Пока нет вопросов" text="Спросите организатора, если что-то непонятно." />
        )}
        {threads.length > 0 && (
          <ol className="flex flex-col gap-4">
            {threads.map(({ root, replies }) => (
              <li key={root.id}>
                <Message {...itemProps(root)} />
                {replies.length > 0 && (
                  <ol className="ml-4 mt-2 flex flex-col gap-2 border-l-2 border-line pl-3 sm:ml-8 sm:pl-4" aria-label="Ответы">
                    {replies.map((reply) => (
                      <li key={reply.id}>
                        <Message {...itemProps(reply)} showMention={reply.parent_id !== root.id} />
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <CommentForm event={event} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} textareaRef={textareaRef} />

      <ReasonModal
        open={hideTarget !== null}
        onClose={() => setHideTarget(null)}
        title="Скрыть сообщение?"
        description="Остальные сообщения и ответы останутся. Пользователи увидят «Сообщение скрыто модератором»."
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

interface MessageProps {
  comment: Comment;
  onReply?: () => void;
  onHide?: () => void;
  showMention?: boolean;
}

function Message({ comment, onReply, onHide, showMention }: MessageProps) {
  if (comment.is_hidden && comment.text === null) {
    return (
      <div className="flex items-center gap-2 rounded-[18px] border border-dashed border-line px-4 py-3 italic text-muted">
        <EyeOff className="size-4 shrink-0" aria-hidden />
        Сообщение скрыто модератором
      </div>
    );
  }
  return (
    <article
      className={cn(
        "rounded-[18px] px-4 py-3",
        comment.is_organizer_reply ? "bg-primary-soft" : "bg-surface-muted",
        comment.is_hidden && "opacity-70",
      )}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Avatar name={comment.author.name} id={comment.author.id} src={comment.author.avatar_url} />
        <span className="font-semibold">{comment.author.name}</span>
        {comment.is_organizer_reply && (
          <Tag tone="success" icon={ShieldCheck}>
            Организатор
          </Tag>
        )}
        <time dateTime={comment.created_at} title={formatShortDate(comment.created_at)} className="text-sm text-muted">
          {formatRelative(comment.created_at)}
        </time>
      </header>
      {showMention && comment.reply_to && (
        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <CornerDownRight className="size-4 shrink-0" aria-hidden />
          {/* min-w-0: иначе длинная цитата не сжимается и растягивает страницу на телефоне */}
          <span className="min-w-0 truncate">
            в ответ {comment.reply_to.author_name}
            {comment.reply_to.excerpt && `: «${comment.reply_to.excerpt}»`}
          </span>
        </p>
      )}
      <p className="mt-2 whitespace-pre-line break-words">{comment.text}</p>
      {comment.is_hidden && (
        <p className="mt-2 text-sm font-medium text-danger-ink">
          Скрыто модератором{comment.hidden_reason ? `: ${comment.hidden_reason}` : ""} (видно только администратору)
        </p>
      )}
      {(onReply || onHide) && (
        <div className="-mb-1 mt-1 flex flex-wrap gap-1">
          {onReply && (
            <Button size="sm" variant="ghost" className="!min-h-10 !px-3" onClick={onReply} icon={<Reply className="size-4" aria-hidden />}>
              Ответить
            </Button>
          )}
          {onHide && (
            <Button size="sm" variant="ghost" className="!min-h-10 !px-3 text-danger-ink" onClick={onHide} icon={<EyeOff className="size-4" aria-hidden />}>
              Скрыть
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

interface CommentFormProps {
  event: SportEvent;
  replyTo: Comment | null;
  onCancelReply: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

function CommentForm({ event, replyTo, onCancelReply, textareaRef }: CommentFormProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [text, setText] = useState("");
  const send = useAction(
    ({ value, parentId }: { value: string; parentId: number | null }) => eventsApi.addComment(event.id, value, parentId),
    "Сообщение опубликовано",
  );

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

  const value = text.trim();
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!value || send.isPending) return;
    send.mutate(
      { value, parentId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setText("");
          onCancelReply();
        },
      },
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  const label = replyTo ? "Ваш ответ" : event.can_manage ? "Написать участникам" : "Ваш вопрос организатору";

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
      <label htmlFor="comment" className="font-medium">
        {label}
      </label>
      {replyTo && (
        <div className="flex items-start gap-3 rounded-2xl border-l-4 border-primary bg-surface-muted px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Ответ для {replyTo.author.name}</p>
            <p className="truncate text-sm text-muted">«{replyTo.text}»</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Отменить ответ"
            className="pressable -mr-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-line/60"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      )}
      <textarea
        id="comment"
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={MAX_LENGTH}
        aria-describedby="comment-hint"
        placeholder={event.can_manage ? "Например: «Мячи и манишки будут на месте»" : "Например: «Можно прийти без опыта?»"}
        className="w-full resize-y rounded-[20px] border border-line bg-white/80 px-5 py-3 leading-relaxed placeholder:text-[#9a8f80] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
      <div className="flex items-center justify-between gap-3">
        <p id="comment-hint" className="text-sm text-muted">
          <span className="tabular-nums">
            {text.length}/{MAX_LENGTH}
          </span>
          <span className="hidden sm:inline"> · Ctrl+Enter — отправить</span>
        </p>
        <Button type="submit" loading={send.isPending} disabled={!value} icon={<Send className="size-4" aria-hidden />}>
          Отправить
        </Button>
      </div>
    </form>
  );
}
