"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isHost = currentUser?.id === room.host_id;

  const currentUserId = currentUser?.id || "guest-" + Math.random().toString(36).substring(2, 7);
  const currentUsername =
    currentProfile?.username || currentUser?.email?.split("@")[0] || "Guest-" + currentUserId.slice(-4);
  const currentAvatar =
    currentProfile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUserId}`;

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
      broadcast("PLAY", { currentTime: time ?? getCurrentTime() });
    },
    [broadcast, room.host_only_control, isHost, getCurrentTime]
  );

  // Send pause event
  const sendPause = useCallback(
    (time?: number) => {
      if (room.host_only_control && !isHost) return;
      broadcast("PAUSE", { currentTime: time ?? getCurrentTime() });
    },
    [broadcast, room.host_only_control, isHost, getCurrentTime]
  );

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

      // Save to Supabase DB if user is authenticated
      if (currentUser) {
        try {
          await supabase.from("room_messages").insert({
            room_id: room.id,
            user_id: currentUser.id,
            content: content.trim(),
          });
        } catch {
          /* ignore */
        }
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
        x: Math.floor(Math.random() * 70) + 15, // between 15% and 85%
      };

      setFloatingEmojis((prev) => [...prev, newFloating]);
      broadcast("EMOJI_REACTION", { emoji, x: newFloating.x });

      // Auto remove floating emoji after animation completes (2.5s)
      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((item) => item.id !== newFloating.id));
      }, 2500);
    },
    [broadcast, currentUsername]
  );

  // Connect to Supabase Realtime channel
  useEffect(() => {
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
          const current = getCurrentTime();
          if (Math.abs(current - payload.currentTime) > 1.5) {
            seekTo(payload.currentTime);
          }
        }
      })
      .on("broadcast", { event: "PLAY" }, ({ payload }) => {
        if (typeof payload?.currentTime === "number") {
          const current = getCurrentTime();
          if (Math.abs(current - payload.currentTime) > 1.5) {
            seekTo(payload.currentTime);
          }
        }
        playMedia();
      })
      .on("broadcast", { event: "PAUSE" }, ({ payload }) => {
        if (typeof payload?.currentTime === "number") {
          const current = getCurrentTime();
          if (Math.abs(current - payload.currentTime) > 1.5) {
            seekTo(payload.currentTime);
          }
        }
        pauseMedia();
      })
      .on("broadcast", { event: "SYNC_REQUEST" }, () => {
        if (isHost) {
          channel.send({
            type: "broadcast",
            event: "SYNC_RESPONSE",
            payload: {
              currentTime: getCurrentTime(),
              timestamp: Date.now(),
              senderId: currentUserId,
            },
          });
        }
      })
      .on("broadcast", { event: "SYNC_RESPONSE" }, ({ payload }) => {
        if (typeof payload?.currentTime === "number") {
          seekTo(payload.currentTime);
        }
      })

      // 2. Chat & Emojis
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

      // 3. Presence tracking
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userList: Participant[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences && presences[0]) {
            userList.push(presences[0]);
          }
        });

        setParticipants(userList);

        // Check if room is full (max 4 participants)
        if (userList.length > room.max_participants) {
          const isUserInList = userList.slice(0, room.max_participants).some((u) => u.id === currentUserId);
          if (!isUserInList && !isHost) {
            setIsRoomFull(true);
          }
        } else {
          setIsRoomFull(false);
        }
      })

      // Subscribe and track presence
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

          // If joining non-host, request sync state from host
          if (!isHost) {
            channel.send({
              type: "broadcast",
              event: "SYNC_REQUEST",
              payload: { requesterId: currentUserId },
            });
          }
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [
    room.code,
    room.id,
    room.max_participants,
    currentUserId,
    currentUsername,
    currentAvatar,
    isHost,
    getCurrentTime,
    seekTo,
    playMedia,
    pauseMedia,
  ]);

  // Periodic heartbeat sync from Host to prevent drift
  useEffect(() => {
    if (!isHost || !isConnected) return;

    const interval = setInterval(() => {
      const time = getCurrentTime();
      if (typeof time === "number") {
        broadcast("SEEK", { currentTime: time });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isHost, isConnected, getCurrentTime, broadcast]);

  return {
    participants,
    messages,
    floatingEmojis,
    isConnected,
    isRoomFull,
    isHost,
    sendSeek,
    sendPlay,
    sendPause,
    sendMessage,
    sendEmojiReaction,
  };
}
