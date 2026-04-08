import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/client";
import type { DbUser } from "@/lib/supabase/types";

export async function getUserByClerkId(
  clerkId: string,
): Promise<DbUser | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();
  return data;
}

/**
 * Gets the Supabase user for the current Clerk user.
 * If the webhook hasn't created the user yet, creates them on the fly.
 */
export async function getOrCreateCurrentUser(
  clerkId: string,
): Promise<DbUser | null> {
  const existing = await getUserByClerkId(clerkId);
  if (existing) return existing;

  // Webhook hasn't fired yet — create user from Clerk data
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    "User";
  const username = clerkUser.username || `user_${clerkId.slice(-8)}`;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        clerk_id: clerkId,
        username,
        display_name: displayName,
        avatar_url: clerkUser.imageUrl || "",
      },
      { onConflict: "clerk_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to create user:", error);
    return null;
  }
  return data;
}

export async function getUserByUsername(
  username: string,
): Promise<DbUser | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getAllUsers(): Promise<DbUser[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
