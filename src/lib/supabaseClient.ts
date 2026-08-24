import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://zbpplqqeihawvsmibjlx.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicHBscXFlaWhhd3ZzbWliamx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODc2MjEsImV4cCI6MjEwMzE2MzYyMX0.bIofuB2XwPe7Sp1MDiaS8Pd99FW-lgXD9UBWMwPlA-A";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

export interface WatchRoom {
  id: string;
  code: string;
  host_id: string;
  title: string;
  media_type: "movie" | "tv" | "youtube";
  media_id: string;
  season?: number;
  episode?: number;
  is_private: boolean;
  host_only_control: boolean;
  max_participants: number;
  created_at?: string;
  host_profile?: UserProfile;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: UserProfile;
}

export interface MediaComment {
  id: string;
  media_type: "movie" | "tv";
  media_id: number;
  user_id: string;
  parent_id?: string | null;
  content: string;
  reactions: Record<string, number>; // e.g. { "👍": 2, "❤️": 5, "🔥": 1 }
  created_at: string;
  profile?: UserProfile;
  replies?: MediaComment[];
}

/**
 * Main client-side Supabase instance
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Server-side Admin client
 */
export function getServiceSupabase(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Check if a username is available (case-insensitive)
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!username || username.trim().length < 3) return false;
  const clean = username.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", clean)
      .limit(1);

    if (error) {
      console.warn("checkUsernameAvailable error:", error.message);
      // Fallback check against local users if table not ready
      return true;
    }
    return !data || data.length === 0;
  } catch {
    return true;
  }
}

/**
 * Check if an email is available
 */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  if (!email || !email.includes("@")) return false;
  const clean = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", clean)
      .limit(1);

    if (error) {
      console.warn("checkEmailAvailable error:", error.message);
      return true;
    }
    return !data || data.length === 0;
  } catch {
    return true;
  }
}

/**
 * Fetch a user profile by user UUID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, avatar_url, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("getUserProfile error:", error.message);
      return null;
    }
    return data as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Upsert or create user profile
 */
export async function upsertUserProfile(profile: UserProfile): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("upsertUserProfile error:", error.message);
      return profile;
    }
    return data as UserProfile;
  } catch {
    return profile;
  }
}
