import { createClient } from "@/lib/supabase/client";
import type { DbBook } from "@/lib/supabase/types";

export async function getBookByGoogleId(
  googleBooksId: string,
): Promise<DbBook | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("books")
    .select("*")
    .eq("google_books_id", googleBooksId)
    .single();
  return data;
}

export async function getOrCreateBook(bookData: {
  google_books_id: string;
  title: string;
  authors: string[];
  description: string | null;
  cover_url: string | null;
  isbn: string | null;
  page_count: number | null;
  categories: string[];
  published_date: string | null;
}): Promise<DbBook> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("books")
    .upsert(bookData, { onConflict: "google_books_id" })
    .select()
    .single();

  if (error) throw new Error(`Failed to create book: ${error.message}`);
  return data;
}

export async function getBookUsers(bookId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_books")
    .select("*, users(*)")
    .eq("book_id", bookId);
  return data ?? [];
}
