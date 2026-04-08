import { createClient } from "@/lib/supabase/client";
import type { BookStatus, DbUserBook, DbBook } from "@/lib/supabase/types";

export type UserBookWithBook = DbUserBook & { books: DbBook };

export async function getUserBooks(
  userId: string,
): Promise<UserBookWithBook[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_books")
    .select("*, books(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as UserBookWithBook[]) ?? [];
}

export async function getUserBooksByStatus(
  userId: string,
  status: BookStatus,
): Promise<UserBookWithBook[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_books")
    .select("*, books(*)")
    .eq("user_id", userId)
    .eq("status", status)
    .order("created_at", { ascending: false });
  return (data as UserBookWithBook[]) ?? [];
}

export async function getUserBook(
  userId: string,
  bookId: string,
): Promise<DbUserBook | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .single();
  return data;
}

export async function getUserBookCounts(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_books")
    .select("status")
    .eq("user_id", userId);

  const counts = { want_to_read: 0, reading: 0, read: 0 };
  for (const row of data ?? []) {
    counts[row.status as BookStatus]++;
  }
  return counts;
}
