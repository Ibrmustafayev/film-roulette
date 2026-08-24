"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, WatchRoom, RoomMessage, UserProfile } from "@/lib/supabaseClient";

export interface SyncState {
  currentTime: number;
  isPlaying: boolean;
  timestamp: number;
  senderId: string;
  senderName: string;
}

export interface FloatingEmoji {
  id: string;
  emoji: string;
  senderName: string;
  x: number; // percentage from left
}

export interface Participant {
  id: string;
  username: string;
  avatar_url: string;
  isHost: boolean;
  joinedAt: string;
}

interface UseRoomSyncProps {
  room: WatchRoom;
  currentUser: { id: string; email?: string } | null;
  currentProfile: UserProfile | null;
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
  playMedia: () => void;
  pauseMedia: () => void;
}

export function useRoomSync({
  room,
  currentUser,
  currentProfile,
  getCurrentTime,
  seekTo,
  playMedia,
  pauseMedia,
}: UseRoomSyncProps) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isHost = currentUser?.id === room.host_id;

  // Stable User ID for session
  const currentUserId = useMemo(() => {
    return currentUser?.id || "guest-" + Math.random().toString(36).substring(2, 8);
  }, [currentUser?.id]);

  const currentUsername =
    currentProfile?.username || currentUser?.email?.split("@")[0] || "Guest-" + currentUserId.slice(-4);
  const currentAvatar =
    currentProfile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUserId}`;

  // Store active room code in localStorage for session persistence across F5
  useEffect(() => {
    if (typeof window !== "undefined" && room.code) {
      try {
        localStorage.setItem("active_room_code", room.code);
      } catch {}
    }
  }, [room.code]);

  // Keep latest callbacks in ref to avoid re-triggering subscription effect
  const callbacksRef = useRef({ getCurrentTime, seekTo, playMedia, pauseMedia });
  useEffect(() => {
    callbacksRef.current = { getCurrentTime, seekTo, playMedia, pauseMedia };
  });

  // Broadcast helper
  const broadcast = useCallback(
    (event: string, payload: any) => {
      if (channelRef.current && isConnected) {
        channelRef.current.send({
          type: "broadcast",
          event,
          payload: { ...payload, senderId: currentUserId, senderName: currentUsername },
        });
      }
    },
    [isConnected, currentUserId, currentUsername]
  );

  // Send seek event
  const sendSeek = useCallback(
    (time: number) => {
      if (room.host_only_control && !isHost) return;
      broadcast("SEEK", { currentTime: time });
    },
    [broadcast, room.host_only_control, isHost]
  );

  // Send play event
  const sendPlay = useCallback(
    (time?: number) => {
      if (room.host_only_control && !isHost) return;
      const t = time ?? callbacksRef.current.getCurrentTime();
      broadcast("PLAY", { currentTime: t });
    },
    [broadcast, room.host_only_control, isHost]
  );

  // Send pause event
  const sendPause = useCallback(
    (time?: number) => {
      if (room.host_only_control && !isHost) return;
      const t = time ?? callbacksRef.current.getCurrentTime();
      broadcast("PAUSE", { currentTime: t });
    },
    [broadcast, room.host_only_control, isHost]
  );

  // Host action: Kick participant
  const kickUser = useCallback(
    (targetUserId: string, targetUsername?: string) => {
      if (!isHost) return;
      broadcast("KICK_USER", { targetUserId, targetUsername });
      setParticipants((prev) => prev.filter((p) => p.id !== targetUserId));
    },
    [isHost, broadcast]
  );

  // Host action: Close room
  const closeRoom = useCallback(async () => {
    if (!isHost) return;
    broadcast("ROOM_CLOSED", {});
    try {
      localStorage.removeItem("active_room_code");
      await supabase.from("rooms").update({ is_closed: true }).eq("code", room.code);
    } catch {}
    router.push("/rooms");
  }, [isHost, broadcast, room.code, router]);

  // Send chat message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const newMsg: RoomMessage = {
        id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        room_id: room.id,
        user_id: currentUserId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        profile: {
          id: currentUserId,
          username: currentUsername,
          email: currentUser?.email || "",
          avatar_url: currentAvatar,
        },
      };

      setMessages((prev) => [...prev, newMsg]);
      broadcast("CHAT_MESSAGE", { message: newMsg });

      if (currentUser) {
        try {
          await supabase.from("room_messages").insert({
            room_id: room.id,
            user_id: currentUser.id,
            content: content.trim(),
          });
        } catch {}
      }
    },
    [broadcast, room.id, currentUserId, currentUsername, currentAvatar, currentUser]
  );

  // Trigger floating emoji reaction
  const sendEmojiReaction = useCallback(
    (emoji: string) => {
      const newFloating: FloatingEmoji = {
        id: "emoji-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
        emoji,
        senderName: currentUsername,
        x: Math.floor(Math.random() * 70) + 15,
      };

      setFloatingEmojis((prev) => [...prev, newFloating]);
      broadcast("EMOJI_REACTION", { emoji, x: newFloating.x });

      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((item) => item.id !== newFloating.id));
      }, 2500);
    },
    [broadcast, currentUsername]
  );

  // Connect to Supabase Realtime channel (ROCK SOLID PRESENCE & HOST MANAGEMENT)
  useEffect(() => {
    if (!room.code) return;

    const channelName = `watch_room:${room.code}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUserId },
      },
    });

    channel
      // 1. Playback sync events
      .on("broadcast", { event: "SEEK" }, ({ payload }) => {
        if (typeof payload?.currentTime === "number") {
          const current = callbacksRef.current.getCurrentTime();
          if (Math.abs(current - payload.currentTime) > 1.5) {
            callbacksRef.current.seekTo(payload.currentTime);
          }
        }
      })
      .on("broadcast", { event: "PLAY" }, ({ payload }) => {
        if (typeof payload?.currentTime === "number") {
          const current = callbacksRef.current.getCurrentTime();
          if (Math.abs(current - payload.currentTime) > 1.5) {
            callbacksRef.current.seekTo(payload.currentTime);
          }
        }
        callbacksRef.current.playMedia();
      })
      .on("broadcast", { event: "PAUSE" }, ({ payload }) => {
        if (typeof payload?.currentTime === "number") {
          const current = callbacksRef.current.getCurrentTime();
          if (Math.abs(current - payload.currentTime) > 1.5) {
            callbacksRef.current.seekTo(payload.currentTime);
          }
        }
        callbacksRef.current.pauseMedia();
      })
      .on("broadcast", { event: "SYNC_REQUEST" }, () => {
        if (isHost) {
          channel.send({
            type: "broadcast",
            event: "SYNC_RESPONSE",
            payload: {
              currentTime: callbacksRef.current.getCurrentTime(),
              timestamp: Date.now(),
              senderId: currentUserId,
            },
          });
        }
      })
      .on("broadcast", { event: "SYNC_RESPONSE" }, ({ payload }) => {
        if (typeof payload?.currentTime === "number") {
          callbacksRef.current.seekTo(payload.currentTime);
        }
      })

      // 2. Host Moderation Events (KICK & CLOSE)
      .on("broadcast", { event: "KICK_USER" }, ({ payload }) => {
        if (payload?.targetUserId === currentUserId) {
          try {
            localStorage.removeItem("active_room_code");
          } catch {}
          channel.unsubscribe();
          alert("Otaq sahibi tərəfindən kənarlaşdırıldınız (Kicked by host).");
          router.push("/rooms");
        }
      })
      .on("broadcast", { event: "ROOM_CLOSED" }, () => {
        try {
          localStorage.removeItem("active_room_code");
        } catch {}
        channel.unsubscribe();
        alert("Otaq sahibi tərəfindən bağlandı (Room closed by host).");
        router.push("/rooms");
      })

      // 3. Chat & Emojis
      .on("broadcast", { event: "CHAT_MESSAGE" }, ({ payload }) => {
        if (payload?.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.message.id)) return prev;
            return [...prev, payload.message];
          });
        }
      })
      .on("broadcast", { event: "EMOJI_REACTION" }, ({ payload }) => {
        if (payload?.emoji) {
          const newEmoji: FloatingEmoji = {
            id: "emoji-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
            emoji: payload.emoji,
            senderName: payload.senderName || "Friend",
            x: payload.x || Math.floor(Math.random() * 70) + 15,
          };
          setFloatingEmojis((prev) => [...prev, newEmoji]);
          setTimeout(() => {
            setFloatingEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
          }, 2500);
        }
      })

      // 4. Stable Presence tracking
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userList: Participant[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences && presences[0]) {
            userList.push(presences[0]);
          }
        });

        if (userList.length === 0) {
          userList.push({
            id: currentUserId,
            username: currentUsername,
            avatar_url: currentAvatar,
            isHost,
            joinedAt: new Date().toISOString(),
          });
        }

        setParticipants(userList);

        if (userList.length > room.max_participants) {
          const isUserInList = userList.slice(0, room.max_participants).some((u) => u.id === currentUserId);
          if (!isUserInList && !isHost) {
            setIsRoomFull(true);
          }
        } else {
          setIsRoomFull(false);
        }
      })

      // Subscribe and track presence ONCE upon join
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          await channel.track({
            id: currentUserId,
            username: currentUsername,
            avatar_url: currentAvatar,
            isHost,
            joinedAt: new Date().toISOString(),
          });

          if (!isHost) {
            channel.send({
              type: "broadcast",
              event: "SYNC_REQUEST",
              payload: { requesterId: currentUserId },
            });
          }
        } else if (status === "CLOSED" || status === "TIMED_OUT") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [room.code, room.id, room.max_participants, currentUserId, isHost, router]);

  // Periodic heartbeat sync from Host to prevent drift
  useEffect(() => {
    if (!isHost || !isConnected) return;

    const interval = setInterval(() => {
      const time = callbacksRef.current.getCurrentTime();
      if (typeof time === "number") {
        broadcast("SEEK", { currentTime: time });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isHost, isConnected, broadcast]);

  return {
    participants,
    messages,
    floatingEmojis,
    isConnected,
    isRoomFull,
    isHost,
    notification,
    sendSeek,
    sendPlay,
    sendPause,
    kickUser,
    closeRoom,
    sendMessage,
    sendEmojiReaction,
  };
}
