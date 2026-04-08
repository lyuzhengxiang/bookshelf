"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { getUserByClerkId } from "@/queries/user-queries";

export async function updateBio(bio: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ bio })
    .eq("id", user.id);

  if (error) throw new Error(`Failed to update bio: ${error.message}`);

  revalidatePath(`/profile/${user.username}`);
}
