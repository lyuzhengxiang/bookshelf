import { createClient } from "@/lib/supabase/client";
import type { DbUser } from "@/lib/supabase/types";

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();
  return !!data;
}

export async function getFollowers(userId: string): Promise<DbUser[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower:users!follower_id(*)")
    .eq("following_id", userId);

  return (
    data?.map((d) => (d as unknown as { follower: DbUser }).follower) ?? []
  );
}

export async function getFollowing(userId: string): Promise<DbUser[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("following:users!following_id(*)")
    .eq("follower_id", userId);

  return (
    data?.map((d) => (d as unknown as { following: DbUser }).following) ?? []
  );
}

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count ?? 0;
}
