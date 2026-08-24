-- Supabase Database Schema for Film Roulette
-- Profiles, Synchronized Watch Party Rooms, Room Messages & Media Comments

-- 1. Enable UUID and cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username CITEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast username lookup (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));

-- 3. Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'youtube')),
  media_id TEXT NOT NULL,
  season INT DEFAULT 1,
  episode INT DEFAULT 1,
  is_private BOOLEAN DEFAULT TRUE NOT NULL,
  host_only_control BOOLEAN DEFAULT FALSE NOT NULL,
  max_participants INT DEFAULT 4 NOT NULL CHECK (max_participants <= 4 AND max_participants >= 2),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_host ON public.rooms(host_id);

-- 4. Room Messages Table
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room ON public.room_messages(room_id, created_at ASC);

-- 5. Media Comments Table (Public Comments for Movies & TV shows)
CREATE TABLE IF NOT EXISTS public.media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  media_id INT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.media_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_comments_media ON public.media_comments(media_type, media_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_comments_parent ON public.media_comments(parent_id);

-- 6. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms Policies
DROP POLICY IF EXISTS "Rooms are viewable by everyone with code or public" ON public.rooms;
CREATE POLICY "Rooms are viewable by everyone with code or public"
  ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their rooms" ON public.rooms;
CREATE POLICY "Hosts can update their rooms"
  ON public.rooms FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their rooms" ON public.rooms;
CREATE POLICY "Hosts can delete their rooms"
  ON public.rooms FOR DELETE USING (auth.uid() = host_id);

-- Room Messages Policies
DROP POLICY IF EXISTS "Room messages are viewable by room participants" ON public.room_messages;
CREATE POLICY "Room messages are viewable by room participants"
  ON public.room_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can send room messages" ON public.room_messages;
CREATE POLICY "Authenticated users can send room messages"
  ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Media Comments Policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.media_comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.media_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.media_comments;
CREATE POLICY "Authenticated users can insert comments"
  ON public.media_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.media_comments;
CREATE POLICY "Users can update their own comments"
  ON public.media_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.media_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.media_comments FOR DELETE USING (auth.uid() = user_id);

-- 7. Trigger to automatically handle auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_comments;
