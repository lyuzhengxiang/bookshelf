"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { getUserByClerkId } from "@/queries/user-queries";
import { getOrCreateBook } from "@/queries/book-queries";
import type { GoogleBookResult } from "@/lib/books/google-books";

export async function sendRecommendation(
  toUserId: string,
  bookData: GoogleBookResult,
  message?: string,
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  if (user.id === toUserId) throw new Error("Cannot recommend to yourself");

  const book = await getOrCreateBook(bookData);

  const supabase = createClient();
  const { error } = await supabase.from("recommendations").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    book_id: book.id,
    message: message || null,
  });

  if (error)
    throw new Error(`Failed to send recommendation: ${error.message}`);

  revalidatePath("/recommendations");
}
