"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ThumbsUp, Heart, Flame, Reply, Send, User, CornerDownRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { supabase, MediaComment } from "@/lib/supabaseClient";

interface CommentsProps {
  mediaType: "movie" | "tv";
  mediaId: number;
  title?: string;
}

const REACTION_EMOJIS = ["👍", "❤️", "🔥"] as const;

export function Comments({ mediaType, mediaId, title }: CommentsProps) {
  const { locale, user, profile, setAuthModalOpen } = useStore();
  const t = getTranslations(locale);

  const [comments, setComments] = useState<MediaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Fetch comments for current media
  const loadComments = useCallback(async () => {
    if (!mediaId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("media_comments")
        .select(`
          id,
          media_type,
          media_id,
          user_id,
          parent_id,
          content,
          reactions,
          created_at,
          profiles:user_id (id, username, email, avatar_url)
        `)
        .eq("media_type", mediaType)
        .eq("media_id", mediaId)
        .order("created_at", { ascending: true });

      if (data && !error) {
        // Build nested thread structure
        const formatted: MediaComment[] = data.map((item: any) => ({
          id: item.id,
          media_type: item.media_type,
          media_id: item.media_id,
          user_id: item.user_id,
          parent_id: item.parent_id,
          content: item.content,
          reactions: item.reactions || {},
          created_at: item.created_at,
          profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          replies: [],
        }));

        const roots: MediaComment[] = [];
        const map = new Map<string, MediaComment>();

        formatted.forEach((c) => map.set(c.id, c));
        formatted.forEach((c) => {
          if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.replies!.push(c);
          } else {
            roots.push(c);
          }
        });

        setComments(roots);
      }
    } catch (err) {
      console.warn("loadComments fallback:", err);
    } finally {
      setLoading(false);
    }
  }, [mediaType, mediaId]);

  useEffect(() => {
    loadComments();

    // Subscribe to realtime updates for this media
    const channel = supabase
      .channel(`media_comments:${mediaType}:${mediaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "media_comments",
          filter: `media_id=eq.${mediaId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [mediaType, mediaId, loadComments]);

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

    try {
      const { data, error } = await supabase
        .from("media_comments")
        .insert({
          media_type: mediaType,
          media_id: mediaId,
          user_id: user.id,
          content,
          reactions: {},
        })
        .select()
        .single();

      if (data && !error) {
        const optimistic: MediaComment = {
          id: data.id,
          media_type: mediaType,
          media_id: mediaId,
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
        setComments((prev) => [optimistic, ...prev]);
      } else {
        // In-memory optimistic update
        const optimistic: MediaComment = {
          id: "cmt-" + Date.now(),
          media_type: mediaType,
          media_id: mediaId,
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
        setComments((prev) => [optimistic, ...prev]);
      }
      setNewCommentText("");
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply to a parent comment
  const handleSendReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const content = replyText.trim();
    setReplyingToId(null);
    setReplyText("");

    try {
      const { data, error } = await supabase
        .from("media_comments")
        .insert({
          media_type: mediaType,
          media_id: mediaId,
          user_id: user.id,
          parent_id: parentId,
          content,
          reactions: {},
        })
        .select()
        .single();

      if (!error && data) {
        loadComments();
      } else {
        // Optimistic reply
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              const rep: MediaComment = {
                id: "rep-" + Date.now(),
                media_type: mediaType,
                media_id: mediaId,
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
              return { ...c, replies: [...(c.replies || []), rep] };
            }
            return c;
          })
        );
      }
    } catch {
      /* ignore */
    }
  };

  // Toggle emoji reaction
  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const currentCount = c.reactions[emoji] || 0;
          const nextReactions = { ...c.reactions, [emoji]: currentCount + 1 };
          return { ...c, reactions: nextReactions };
        }
        if (c.replies && c.replies.some((r) => r.id === commentId)) {
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

  return (
    <section className="mt-8 border-t border-ink-4 pt-8" id="media-comments-section">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-live" />
          <h3 className="text-body font-semibold text-ink-9">
            {locale === "az" ? "Şərhlər və Rəylər" : locale === "ru" ? "Комментарии" : "Public Comments"}
          </h3>
          <span className="rounded-xs bg-ink-2 px-2 py-0.5 text-xs text-ink-6 border border-ink-4">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmitComment} className="mb-6 space-y-2">
        <div className="relative">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              user
                ? locale === "az"
                  ? "Film haqqında fikirlərinizi bölüşün..."
                  : "Share your thoughts on this movie..."
                : locale === "az"
                ? "Şərh yazmaq üçün daxil olun..."
                : "Log in to leave a comment..."
            }
            rows={2}
            className="inp w-full resize-none p-3 text-xs leading-relaxed"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-6">
            {!user && (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="text-live hover:underline"
              >
                {locale === "az" ? "Giriş et" : "Log In"}
              </button>
            )}
          </span>
          <button
            type="submit"
            disabled={submitting || !newCommentText.trim()}
            className="ctl ctl-primary h-8 px-4 text-xs font-medium flex items-center gap-1.5"
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            <span>{locale === "az" ? "Şərh Yaz" : "Post Comment"}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-ink-6">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-live mb-2" />
            <span>{locale === "az" ? "Şərhlər yüklənir..." : "Loading comments..."}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-6 border border-dashed border-ink-4 rounded-xs p-4">
            <p>
              {locale === "az"
                ? "Hələ heç bir şərh yazılmayıb. İlk şərhi siz yazın!"
                : "No comments yet. Be the first to share your thoughts!"}
            </p>
          </div>
        ) : (
          comments.map((cmt) => (
            <div
              key={cmt.id}
              className="space-y-2.5 rounded-xs border border-ink-4 bg-ink-2/40 p-4 transition-colors hover:border-ink-5"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-ink-3 flex items-center justify-center text-[10px] font-bold text-live">
                    {cmt.profile?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-semibold text-ink-8">
                    {cmt.profile?.username || "User"}
                  </span>
                </div>
                <span className="text-[11px] text-ink-6">
                  {new Date(cmt.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* Comment Body */}
              <p className="text-xs text-ink-9 leading-relaxed">{cmt.content}</p>

              {/* Action Bar (Reactions & Reply) */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  {REACTION_EMOJIS.map((emoji) => {
                    const count = cmt.reactions[emoji] || 0;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReaction(cmt.id, emoji)}
                        className={`inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-[11px] border transition-colors ${
                          count > 0
                            ? "border-live/30 bg-live/10 text-live"
                            : "border-ink-4 bg-ink-1 text-ink-6 hover:text-ink-8"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-semibold">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setReplyingToId(replyingToId === cmt.id ? null : cmt.id)
                  }
                  className="inline-flex items-center gap-1 text-[11px] text-ink-6 hover:text-ink-9 transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  <span>{locale === "az" ? "Cavabla" : "Reply"}</span>
                </button>
              </div>

              {/* Reply Box if active */}
              {replyingToId === cmt.id && (
                <div className="pt-2 pl-4 border-l-2 border-live/40 space-y-2">
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
                      className="ctl ctl-primary h-7 px-2.5 text-[11px]"
                    >
                      {locale === "az" ? "Göndər" : "Send"}
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {cmt.replies && cmt.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-ink-4 space-y-2.5">
                  {cmt.replies.map((rep) => (
                    <div key={rep.id} className="space-y-1 bg-ink-1/60 p-2.5 rounded-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-ink-8">
                          {rep.profile?.username || "User"}
                        </span>
                        <span className="text-ink-6">
                          {new Date(rep.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-ink-9 leading-relaxed">{rep.content}</p>
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
