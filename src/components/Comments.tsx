"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Heart,
  Flame,
  Reply,
  Send,
  User,
  Loader2,
  LogIn,
  Sparkles,
  Smile,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import {
  supabase,
  MediaComment,
  fetchMediaComments,
  saveMediaComment,
} from "@/lib/supabaseClient";

interface CommentsProps {
  mediaType: "movie" | "tv";
  mediaId: number | string;
  title?: string;
}

const EMOJI_SHORTCUTS = ["🍿", "🔥", "❤️", "😂", "👏", "👍"];
const REACTION_EMOJIS = ["👍", "❤️", "🔥"] as const;

function formatTimeAgo(isoString: string, locale: string): string {
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return locale === "az" ? "İndi" : locale === "ru" ? "Только что" : "Just now";
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return locale === "az" ? `${m} dəq əvvəl` : locale === "ru" ? `${m} мин назад` : `${m}m ago`;
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return locale === "az" ? `${h} saat əvvəl` : locale === "ru" ? `${h} ч назад` : `${h}h ago`;
    }
    const d = Math.floor(diff / 86400);
    return locale === "az" ? `${d} gün əvvəl` : locale === "ru" ? `${d} д назад` : `${d}d ago`;
  } catch {
    return "";
  }
}

export function Comments({ mediaType, mediaId, title }: CommentsProps) {
  const { locale, user, profile, setAuthModalOpen } = useStore();
  const t = getTranslations(locale);

  const [comments, setComments] = useState<MediaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const cleanMediaId = String(mediaId);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!cleanMediaId) return;
    setLoading(true);

    try {
      const data = await fetchMediaComments(mediaType, cleanMediaId);

      // Build nested thread tree
      const roots: MediaComment[] = [];
      const map = new Map<string, MediaComment>();

      const clone = data.map((c) => ({ ...c, replies: [] as MediaComment[] }));
      clone.forEach((c) => map.set(c.id, c));
      clone.forEach((c) => {
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.replies!.push(c);
        } else {
          roots.push(c);
        }
      });

      setComments(roots);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [mediaType, cleanMediaId]);

  useEffect(() => {
    loadComments();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel(`comments_${mediaType}_${cleanMediaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "media_comments",
          filter: `media_id=eq.${cleanMediaId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [mediaType, cleanMediaId, loadComments]);

  // Insert emoji shortcut
  const handleAddEmoji = (emoji: string) => {
    setNewCommentText((prev) => prev + (prev.length > 0 && !prev.endsWith(" ") ? " " : "") + emoji);
  };

  // Submit top-level comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setSubmitting(true);
    const content = newCommentText.trim();
    const newComment: MediaComment = {
      id: "cmt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      media_type: mediaType,
      media_id: cleanMediaId,
      user_id: user.id,
      content,
      reactions: {},
      created_at: new Date().toISOString(),
      profile: profile || {
        id: user.id,
        username: user.email?.split("@")[0] || "User",
        email: user.email || "",
      },
      replies: [],
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");

    try {
      await saveMediaComment(newComment);
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply
  const handleSendReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const content = replyText.trim();
    const newReply: MediaComment = {
      id: "rep-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      media_type: mediaType,
      media_id: cleanMediaId,
      user_id: user.id,
      parent_id: parentId,
      content,
      reactions: {},
      created_at: new Date().toISOString(),
      profile: profile || {
        id: user.id,
        username: user.email?.split("@")[0] || "User",
        email: user.email || "",
      },
    };

    setReplyingToId(null);
    setReplyText("");

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        return c;
      })
    );

    try {
      await saveMediaComment(newReply);
    } catch {}
  };

  // Toggle reaction
  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const currentCount = c.reactions[emoji] || 0;
          return { ...c, reactions: { ...c.reactions, [emoji]: currentCount + 1 } };
        }
        if (c.replies) {
          const updatedReplies = c.replies.map((r) => {
            if (r.id === commentId) {
              const currentCount = r.reactions[emoji] || 0;
              return { ...r, reactions: { ...r.reactions, [emoji]: currentCount + 1 } };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      })
    );

    try {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        const nextReactions = {
          ...comment.reactions,
          [emoji]: (comment.reactions[emoji] || 0) + 1,
        };
        await supabase
          .from("media_comments")
          .update({ reactions: nextReactions })
          .eq("id", commentId);
      }
    } catch {}
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <section className="mt-10 border-t border-ink-4 pt-8" id="media-comments-section">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-5 w-5 text-live" />
          <h3 className="text-body font-bold text-ink-9">
            {locale === "az"
              ? "Şərhlər və İcmallar"
              : locale === "ru"
              ? "Комментарии и Отзывы"
              : "Discussion & Reviews"}
          </h3>
          <span className="rounded-full bg-live/10 text-live border border-live/30 px-2.5 py-0.5 text-xs font-bold">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Modern Comment Input Box / Guest View Banner */}
      {user ? (
        <form
          onSubmit={handleSubmitComment}
          className="mb-8 rounded-xl border border-ink-4 bg-ink-2/80 p-4 shadow-lifted transition-all focus-within:border-live/60 focus-within:ring-1 focus-within:ring-live/40"
        >
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div className="h-8 w-8 shrink-0 rounded-full bg-live/15 text-live border border-live/30 flex items-center justify-center text-xs font-bold overflow-hidden">
              {profile?.username ? profile.username.charAt(0).toUpperCase() : "U"}
            </div>

            {/* Input textarea */}
            <div className="flex-1 space-y-3">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                maxLength={1000}
                placeholder={
                  locale === "az"
                    ? `${profile?.username || "İstifadəçi"} olaraq film haqqında fikirlərinizi yazın...`
                    : "Share your thoughts on this movie/show..."
                }
                rows={3}
                className="w-full bg-transparent text-xs text-ink-9 placeholder:text-ink-6 focus:outline-none resize-none leading-relaxed"
              />

              {/* Emoji shortcut bar & Submit action row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-4/60 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-ink-6 hidden sm:inline">
                    {locale === "az" ? "Reaksiyalar:" : "Reactions:"}
                  </span>
                  {EMOJI_SHORTCUTS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleAddEmoji(emoji)}
                      className="rounded-xs p-1 text-sm hover:bg-ink-3 transition-transform active:scale-125"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-ink-6 font-mono">
                    {newCommentText.length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !newCommentText.trim()}
                    id="submit-comment-btn"
                    className="ctl ctl-primary h-8 px-4 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{locale === "az" ? "Şərh Yaz" : "Post Comment"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Guest View Sleek Banner */
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-ink-4 bg-ink-2/60 p-4 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-ink-3 border border-ink-4 flex items-center justify-center text-ink-6">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-small font-semibold text-ink-9">
                {locale === "az" ? "Açıq Müzakirə Platforması" : "Public Discussion Platform"}
              </h4>
              <p className="text-label text-ink-6">
                {locale === "az"
                  ? "Şərh yazmaq və rəylərə reaksiya bildirmək üçün hesabınıza daxil olun."
                  : "Sign in to post comments, join discussions, and react to reviews."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            id="comments-guest-login-btn"
            className="ctl ctl-primary h-8 px-4 text-xs font-medium flex items-center gap-1.5 shrink-0"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{locale === "az" ? "Daxil Ol / Qeydiyyat" : "Log In / Register"}</span>
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-ink-6">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-live mb-2" />
            <span>{locale === "az" ? "Şərhlər yüklənir..." : "Loading comments..."}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center text-xs text-ink-6 border border-dashed border-ink-4 rounded-xl p-6 bg-ink-2/30">
            <Sparkles className="mx-auto h-6 w-6 text-live/60 mb-2" />
            <p className="font-medium text-ink-8 mb-1">
              {locale === "az" ? "Hələ heç bir şərh yazılmayıb." : "No comments yet."}
            </p>
            <p className="text-label text-ink-6">
              {locale === "az"
                ? "Film haqqında ilk fikri siz bölüşün!"
                : "Be the first one to share your review!"}
            </p>
          </div>
        ) : (
          comments.map((cmt) => (
            <div
              key={cmt.id}
              className="space-y-3 rounded-xl border border-ink-4 bg-ink-2/50 p-4 transition-colors hover:border-ink-5 shadow-xs"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-live/15 text-live border border-live/30 flex items-center justify-center text-xs font-bold overflow-hidden">
                    {cmt.profile?.username ? cmt.profile.username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-9">
                      {cmt.profile?.username || "User"}
                    </span>
                    <span className="text-[11px] text-ink-6">•</span>
                    <span className="text-[11px] text-ink-6">
                      {formatTimeAgo(cmt.created_at, locale)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment Body */}
              <p className="text-xs text-ink-9 leading-relaxed whitespace-pre-wrap pl-9">
                {cmt.content}
              </p>

              {/* Action Bar (Reactions & Reply) */}
              <div className="flex items-center justify-between pt-1 pl-9 text-xs">
                <div className="flex items-center gap-1.5">
                  {REACTION_EMOJIS.map((emoji) => {
                    const count = cmt.reactions[emoji] || 0;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReaction(cmt.id, emoji)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] border transition-colors ${
                          count > 0
                            ? "border-live/40 bg-live/10 text-live font-semibold"
                            : "border-ink-4 bg-ink-1 text-ink-6 hover:text-ink-8"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span>{count}</span>}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setReplyingToId(replyingToId === cmt.id ? null : cmt.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-ink-6 hover:text-ink-9 transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  <span>{locale === "az" ? "Cavabla" : "Reply"}</span>
                </button>
              </div>

              {/* Reply Box if active */}
              {replyingToId === cmt.id && (
                <div className="pt-2 pl-9 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={locale === "az" ? "Cavabınızı yazın..." : "Write a reply..."}
                      className="inp flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendReply(cmt.id)}
                      className="ctl ctl-primary h-7 px-3 text-xs"
                    >
                      {locale === "az" ? "Göndər" : "Send"}
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {cmt.replies && cmt.replies.length > 0 && (
                <div className="mt-3 pl-6 border-l-2 border-ink-4/80 space-y-2.5">
                  {cmt.replies.map((rep) => (
                    <div key={rep.id} className="space-y-1.5 bg-ink-1/60 p-3 rounded-lg border border-ink-4/40">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-ink-3 text-live flex items-center justify-center text-[10px] font-bold">
                            {rep.profile?.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="font-semibold text-ink-9">
                            {rep.profile?.username || "User"}
                          </span>
                        </div>
                        <span className="text-ink-6">
                          {formatTimeAgo(rep.created_at, locale)}
                        </span>
                      </div>
                      <p className="text-xs text-ink-9 leading-relaxed pl-7">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
