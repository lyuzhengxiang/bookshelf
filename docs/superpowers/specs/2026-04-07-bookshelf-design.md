# Bookshelf — Social Reading Tracker

## Overview

A social bookshelf web app for a class demo. Users sign up, search for books, organize them into shelves, follow other users, and see what their friends are reading. The app emphasizes a minimal, modern aesthetic and a server-first architecture.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Auth:** Clerk (email/password + Google OAuth)
- **Database:** Supabase Postgres (via `@supabase/ssr`)
- **Book Data:** Google Books API (search/metadata) + Open Library Covers API (cover images)
- **Deployment:** Vercel (when ready)

## Architecture

```
Browser → Next.js App Router
            ├── Server Components (pages, layouts) → Supabase Postgres
            ├── Server Actions (mutations) → Supabase Postgres
            ├── Route Handlers (API) → Google Books API
            └── Clerk Middleware → Auth on every request
```

Clerk owns auth identity. Supabase owns data. Clerk's `userId` is synced into a `users` table via a Clerk webhook on sign-up. All Supabase queries filter by this `userId`.

## Data Model

### users

| Column       | Type         | Notes                |
|-------------|-------------|----------------------|
| id          | uuid, PK    |                      |
| clerk_id    | text, unique | Clerk's user ID      |
| username    | text, unique |                      |
| display_name| text         |                      |
| avatar_url  | text         |                      |
| bio         | text, nullable |                    |
| created_at  | timestamptz  |                      |

### books

| Column          | Type         | Notes                      |
|----------------|-------------|----------------------------|
| id             | uuid, PK    |                            |
| google_books_id| text, unique | Deduplicate across users   |
| title          | text         |                            |
| authors        | text[]       | Array of author names      |
| description    | text, nullable |                          |
| cover_url      | text, nullable | Open Library cover URL    |
| isbn           | text, nullable |                          |
| page_count     | int, nullable  |                          |
| categories     | text[]       |                            |
| published_date | text, nullable |                          |
| created_at     | timestamptz  |                            |

### user_books

| Column      | Type         | Notes                              |
|------------|-------------|-------------------------------------|
| id         | uuid, PK    |                                     |
| user_id    | uuid, FK    | → users                            |
| book_id    | uuid, FK    | → books                            |
| status     | enum         | 'want_to_read', 'reading', 'read' |
| rating     | int, nullable| 1-5                                |
| started_at | date, nullable |                                   |
| finished_at| date, nullable |                                   |
| created_at | timestamptz  |                                     |

Unique constraint on `(user_id, book_id)`.

### follows

| Column       | Type         | Notes    |
|-------------|-------------|----------|
| id          | uuid, PK    |          |
| follower_id | uuid, FK    | → users  |
| following_id| uuid, FK    | → users  |
| created_at  | timestamptz  |          |

Unique constraint on `(follower_id, following_id)`. CHECK constraint: `follower_id != following_id`.

### recommendations

| Column       | Type         | Notes    |
|-------------|-------------|----------|
| id          | uuid, PK    |          |
| from_user_id| uuid, FK    | → users  |
| to_user_id  | uuid, FK    | → users  |
| book_id     | uuid, FK    | → books  |
| message     | text, nullable |        |
| created_at  | timestamptz  |          |

## Pages

| Route                 | Description                                              |
|-----------------------|----------------------------------------------------------|
| `/`                   | Landing page (hero + featured books) → `/feed` if authed |
| `/feed`               | Activity feed from followed users                        |
| `/search`             | Search books via Google Books API, add to shelves        |
| `/shelves`            | Current user's shelves (Want to Read / Reading / Read)   |
| `/book/[googleId]`    | Book detail by `google_books_id` — info, who else has it, add/rate. If the book isn't in the local DB yet, fetch from Google Books API and display (don't persist until user adds it). |
| `/profile/[username]` | User profile — shelves, stats, follow button             |
| `/recommendations`    | Incoming/outgoing book recommendations                   |
| `/discover`           | Browse users to follow                                   |
| `/sign-in`, `/sign-up`| Clerk-managed auth pages                                 |

## Core Interactions (Server Actions)

- Add/remove book from shelf, change shelf status
- Rate a book (1-5 stars)
- Follow/unfollow a user
- Send a book recommendation to a user
- Update profile bio

## Feed Logic

The feed shows activity **from users you follow**. It unions:
- `user_books` entries (someone you follow added/rated a book)
- `recommendations` **sent by** people you follow (not recommendations sent *to* you — those appear on `/recommendations`)

Ordered by `created_at` DESC, offset-paginated (page size 20).

Recommended indexes: `user_books(user_id, created_at)`, `recommendations(from_user_id, created_at)`, `follows(follower_id)`.

## Visual Style

Minimal and modern — clean white space, crisp typography, subtle animations. Inspired by Notion/Linear aesthetic.

## Auth Flow

- Clerk handles sign-up/sign-in (email + Google OAuth)
- On first sign-up, a Clerk webhook fires to create a corresponding row in the `users` table
- Clerk middleware protects authenticated routes
- Public routes: `/`, `/sign-in`, `/sign-up`, `/profile/[username]`, `/book/[id]`

## MCP Integrations

- **Supabase MCP:** Database management, schema creation, migrations
- **Clerk:** Auth provider (configured via environment variables, not MCP)

## Book API Strategy

- **Google Books API** (primary): Search and metadata. Requires a free API key from Google Cloud Console.
- **Open Library Covers API** (supplement): Direct cover image URLs via `https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg`. No key needed.
- When a user adds a book, we store it in the `books` table to avoid repeated API calls.
- **Cover fallback:** Use Open Library cover URL when ISBN is available; fall back to Google Books `imageLinks.thumbnail` when ISBN is missing.

## Data Model Notes

- **RLS:** Not used. All Supabase access uses the service role key server-side. Authorization is enforced in Server Actions (check Clerk `userId` before mutations).
- **FK cascades:** All FKs on `user_books`, `follows`, and `recommendations` use `ON DELETE CASCADE` from `users` and `books`.
- **Rating constraint:** `CHECK (rating >= 1 AND rating <= 5)` on `user_books.rating`.
- **Self-recommendation prevention:** Enforced at the application layer in the recommend Server Action.
- **Array defaults:** `authors` and `categories` default to `'{}'` (empty array), never NULL.
- **Status transitions:** No constraints — users can move directly between any status (e.g., `want_to_read` → `read`).

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
GOOGLE_BOOKS_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Scope Boundaries (Out of scope for v1)

- Comments / reviews / discussion threads
- Reading groups / clubs
- Real-time notifications
- Book progress tracking (page-by-page)
- Custom shelves (only the three default statuses)
- Direct messaging between users
