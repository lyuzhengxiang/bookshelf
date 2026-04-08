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
