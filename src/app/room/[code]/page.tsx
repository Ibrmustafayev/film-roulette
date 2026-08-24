import { notFound } from "next/navigation";
import { WatchPartyRoom } from "@/components/WatchPartyRoom";
import { getServiceSupabase, WatchRoom } from "@/lib/supabaseClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cleanCode = code?.toUpperCase();

  if (!cleanCode || cleanCode.length !== 6) {
    notFound();
  }

  let room: WatchRoom | null = null;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", cleanCode)
      .single();

    if (data) {
      room = data as WatchRoom;
    }
  } catch (err) {
    console.warn("Room fetch server fallback:", err);
  }

  // Fallback room object if created in memory/local session
  if (!room) {
    room = {
      id: "room-" + cleanCode,
      code: cleanCode,
      host_id: "host-default",
      title: "Film Roulette Watch Party",
      media_type: "movie",
      media_id: "550", // Fight Club as demo default
      season: 1,
      episode: 1,
      is_private: true,
      host_only_control: false,
      max_participants: 4,
    };
  }

  return <WatchPartyRoom initialRoom={room} />;
}
