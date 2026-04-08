-- Create custom types
CREATE TYPE book_status AS ENUM ('want_to_read', 'reading', 'read');

-- Users table (synced from Clerk via webhook)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text NOT NULL DEFAULT '',
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Books table (cached from Google Books API)
CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_books_id text UNIQUE NOT NULL,
  title text NOT NULL,
  authors text[] NOT NULL DEFAULT '{}',
  description text,
  cover_url text,
  isbn text,
  page_count int,
  categories text[] NOT NULL DEFAULT '{}',
  published_date text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User-book relationships (shelves)
CREATE TABLE user_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status book_status NOT NULL DEFAULT 'want_to_read',
  rating int CHECK (rating >= 1 AND rating <= 5),
  started_at date,
  finished_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- Follows
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Recommendations
CREATE TABLE recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user_id != to_user_id)
);

-- Indexes for feed performance
CREATE INDEX idx_user_books_user_created ON user_books(user_id, created_at DESC);
CREATE INDEX idx_recommendations_from_created ON recommendations(from_user_id, created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_books_google_id ON books(google_books_id);
