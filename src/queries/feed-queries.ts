import { createClient } from "@/lib/supabase/client";

export interface FeedItem {
  id: string;
  type: "book_added" | "recommendation";
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  book: {
    id: string;
    google_books_id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
  };
  status?: string;
  rating?: number | null;
  message?: string | null;
  to_user?: {
    id: string;
    username: string;
    display_name: string;
  };
  created_at: string;
}

const PAGE_SIZE = 20;

export async function getFeed(
  userId: string,
  page: number = 1,
): Promise<FeedItem[]> {
  const supabase = createClient();
  const offset = (page - 1) * PAGE_SIZE;

  // Get IDs of users this person follows
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = followData?.map((f) => f.following_id) ?? [];
  if (followingIds.length === 0) return [];

  // Fetch enough items from each source to cover merged offset + page
  const fetchLimit = offset + PAGE_SIZE;

  // Fetch book activity from followed users
  const { data: bookActivity } = await supabase
    .from("user_books")
    .select("id, status, rating, created_at, users(*), books(*)")
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .range(0, fetchLimit - 1);

  // Fetch recommendations from followed users
  const { data: recActivity } = await supabase
    .from("recommendations")
    .select(
      "id, message, created_at, from_user:users!from_user_id(*), to_user:users!to_user_id(id, username, display_name), books(*)",
    )
    .in("from_user_id", followingIds)
    .order("created_at", { ascending: false })
    .range(0, fetchLimit - 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: FeedItem[] = (bookActivity ?? []).map((item: any) => ({
    id: item.id,
    type: "book_added" as const,
    user: {
      id: item.users.id,
      username: item.users.username,
      display_name: item.users.display_name,
      avatar_url: item.users.avatar_url,
    },
    book: {
      id: item.books.id,
      google_books_id: item.books.google_books_id,
      title: item.books.title,
      authors: item.books.authors,
      cover_url: item.books.cover_url,
    },
    status: item.status,
    rating: item.rating,
    created_at: item.created_at,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recItems: FeedItem[] = (recActivity ?? []).map((item: any) => ({
    id: item.id,
    type: "recommendation" as const,
    user: {
      id: item.from_user.id,
      username: item.from_user.username,
      display_name: item.from_user.display_name,
      avatar_url: item.from_user.avatar_url,
    },
    book: {
      id: item.books.id,
      google_books_id: item.books.google_books_id,
      title: item.books.title,
      authors: item.books.authors,
      cover_url: item.books.cover_url,
    },
    message: item.message,
    to_user: item.to_user,
    created_at: item.created_at,
  }));

  // Merge, sort by created_at DESC, then apply offset pagination on the union
  return [...items, ...recItems]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(offset, offset + PAGE_SIZE);
}
