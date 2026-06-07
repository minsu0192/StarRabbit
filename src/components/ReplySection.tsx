'use client';

import { useState } from 'react';

interface Reply {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: { nickname: string | null } | null;
}

interface Props {
  reviewId: string;
  initialReplies: Reply[];
  currentUserId: string | null;
  canReply: boolean;
}

export default function ReplySection({ reviewId, initialReplies, currentUserId, canReply }: Props) {
  const [replies, setReplies] = useState(initialReplies);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, comment: text }),
    });
    const result = await res.json() as { error?: string };
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setReplies((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          comment: text.trim(),
          created_at: new Date().toISOString(),
          user_id: currentUserId ?? '',
          profiles: { nickname: '나' },
        },
      ]);
      setText('');
      setOpen(false);
    }
  }

  async function handleDelete(replyId: string) {
    const res = await fetch('/api/reply', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyId }),
    });
    const result = await res.json() as { error?: string };
    if (!result.error) {
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
    }
  }

  const replyCount = replies.length;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {replyCount > 0 ? `댓글 ${replyCount}개` : '댓글'}
        {canReply && <span className="ml-1">{open ? '닫기' : '쓰기'}</span>}
      </button>

      {(open || replyCount > 0) && (
        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-gray-100 dark:border-gray-800">
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-1.5 group">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-gray-500 mr-1.5">
                  {reply.profiles?.nickname ?? '익명'}
                </span>
                <span className="text-[11px] text-gray-700 dark:text-gray-300 break-words">
                  {reply.comment}
                </span>
              </div>
              {reply.user_id === currentUserId && (
                <button
                  onClick={() => handleDelete(reply.id)}
                  className="shrink-0 text-[10px] text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  삭제
                </button>
              )}
            </div>
          ))}

          {open && canReply && (
            <form onSubmit={handleSubmit} className="flex gap-1.5 pt-1">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="댓글 달기..."
                maxLength={300}
                className="flex-1 min-w-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-800 dark:bg-gray-950 focus:outline-none focus:border-amber-300"
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="shrink-0 rounded-md bg-amber-400 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-40"
              >
                {submitting ? '...' : '등록'}
              </button>
            </form>
          )}
          {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
