export type BookStatus = "want_to_read" | "reading" | "read";

export interface DbUser {
  id: string;
  clerk_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  created_at: string;
}

export interface DbBook {
  id: string;
  google_books_id: string;
  title: string;
  authors: string[];
  description: string | null;
  cover_url: string | null;
  isbn: string | null;
  page_count: number | null;
  categories: string[];
  published_date: string | null;
  created_at: string;
}

export interface DbUserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface DbFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface DbRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  book_id: string;
  message: string | null;
  created_at: string;
}
