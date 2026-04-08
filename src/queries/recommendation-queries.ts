import { createClient } from "@/lib/supabase/client";
import type { DbRecommendation, DbUser, DbBook } from "@/lib/supabase/types";

export type RecommendationWithDetails = DbRecommendation & {
  from_user: DbUser;
  to_user: DbUser;
  books: DbBook;
};

export async function getIncomingRecommendations(
  userId: string,
): Promise<RecommendationWithDetails[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recommendations")
    .select(
      "*, from_user:users!from_user_id(*), to_user:users!to_user_id(*), books(*)",
    )
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false });
  return (data as RecommendationWithDetails[]) ?? [];
}

export async function getOutgoingRecommendations(
  userId: string,
): Promise<RecommendationWithDetails[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recommendations")
    .select(
      "*, from_user:users!from_user_id(*), to_user:users!to_user_id(*), books(*)",
    )
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false });
  return (data as RecommendationWithDetails[]) ?? [];
}
