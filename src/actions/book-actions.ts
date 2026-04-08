"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentUser } from "@/queries/user-queries";
import { getOrCreateBook } from "@/queries/book-queries";
import type { BookStatus } from "@/lib/supabase/types";
import type { GoogleBookResult } from "@/lib/books/google-books";

export async function addBookToShelf(
  bookData: GoogleBookResult,
  status: BookStatus,
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getOrCreateCurrentUser(clerkId);
  if (!user) throw new Error("User not found");

  const book = await getOrCreateBook(bookData);

  const supabase = createClient();
  const { error } = await supabase.from("user_books").insert({
    user_id: user.id,
    book_id: book.id,
    status,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Book already on your shelf");
    }
    throw new Error(`Failed to add book: ${error.message}`);
  }

  revalidatePath("/shelves");
  revalidatePath(`/book/${bookData.google_books_id}`);
}

export async function removeBookFromShelf(userBookId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getOrCreateCurrentUser(clerkId);
  if (!user) throw new Error("User not found");

  const supabase = createClient();
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", userBookId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to remove book: ${error.message}`);

  revalidatePath("/shelves");
}

export async function updateBookStatus(
  userBookId: string,
  status: BookStatus,
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getOrCreateCurrentUser(clerkId);
  if (!user) throw new Error("User not found");

  const supabase = createClient();
  const updates: Record<string, unknown> = { status };

  if (status === "reading") {
    updates.started_at = new Date().toISOString().split("T")[0];
  } else if (status === "read") {
    updates.finished_at = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("user_books")
    .update(updates)
    .eq("id", userBookId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to update status: ${error.message}`);

  revalidatePath("/shelves");
}

export async function rateBook(userBookId: string, rating: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");

  const user = await getOrCreateCurrentUser(clerkId);
  if (!user) throw new Error("User not found");

  const supabase = createClient();
  const { error } = await supabase
    .from("user_books")
    .update({ rating })
    .eq("id", userBookId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to rate book: ${error.message}`);

  revalidatePath("/shelves");
}
