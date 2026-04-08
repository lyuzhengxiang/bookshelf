"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentUser } from "@/queries/user-queries";

export async function followUser(targetUserId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getOrCreateCurrentUser(clerkId);
  if (!user) throw new Error("User not found");

  if (user.id === targetUserId) throw new Error("Cannot follow yourself");

  const supabase = createClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetUserId,
  });

  if (error) {
    if (error.code === "23505") return; // Already following
    throw new Error(`Failed to follow: ${error.message}`);
  }

  revalidatePath("/feed");
  revalidatePath("/discover");
}

export async function unfollowUser(targetUserId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getOrCreateCurrentUser(clerkId);
  if (!user) throw new Error("User not found");

  const supabase = createClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);

  if (error) throw new Error(`Failed to unfollow: ${error.message}`);

  revalidatePath("/feed");
  revalidatePath("/discover");
}
