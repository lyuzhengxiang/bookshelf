# Bookshelf — Social Reading Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a social bookshelf web app where users search books, organize them into shelves, follow other users, see an activity feed, and send recommendations.

**Architecture:** Next.js 15 App Router with Server Components for data fetching and Server Actions for mutations. Clerk owns auth identity; Supabase Postgres owns data. Google Books API provides search/metadata; Open Library provides cover images. No RLS — all Supabase access uses the service role key server-side with app-layer authorization.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Clerk, Supabase Postgres (`@supabase/supabase-js`), Google Books API, Open Library Covers API

---

## File Structure

```
bookshelf/
├── src/
│   ├── app/
│   │   ├── layout.tsx                         # Root layout: ClerkProvider, fonts, global styles
│   │   ├── page.tsx                           # Landing page → /feed if authed
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── feed/page.tsx                      # Activity feed (protected)
│   │   ├── search/page.tsx                    # Book search (protected)
│   │   ├── shelves/page.tsx                   # Current user's shelves (protected)
│   │   ├── book/[googleId]/
│   │   │   ├── page.tsx                       # Book detail (public)
│   │   │   └── book-detail-actions.tsx        # Client actions for book detail
│   │   ├── profile/[username]/page.tsx        # User profile (public)
│   │   ├── recommendations/page.tsx           # Incoming/outgoing recs (protected)
│   │   ├── discover/page.tsx                  # Browse users (protected)
│   │   └── api/
│   │       ├── webhooks/clerk/route.ts        # Clerk webhook → create user in Supabase
│   │       └── books/search/route.ts          # Proxy to Google Books API
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                      # createClient() using service role key
│   │   │   └── types.ts                       # Database row types
│   │   └── books/
│   │       └── google-books.ts                # searchBooks(), getBook(), getCoverUrl()
│   ├── actions/
│   │   ├── book-actions.ts                    # addBook, removeBook, updateStatus, rateBook
│   │   ├── follow-actions.ts                  # followUser, unfollowUser
│   │   ├── recommendation-actions.ts          # sendRecommendation
│   │   └── profile-actions.ts                 # updateBio
│   ├── queries/
│   │   ├── user-queries.ts                    # getUserByClerkId, getUserByUsername
│   │   ├── book-queries.ts                    # getBookByGoogleId, getBookUsers
│   │   ├── shelf-queries.ts                   # getUserBooks, getUserBooksByStatus
│   │   ├── follow-queries.ts                  # getFollowers, getFollowing, isFollowing
│   │   ├── recommendation-queries.ts          # getIncoming, getOutgoing
│   │   └── feed-queries.ts                    # getFeed (union query)
│   ├── components/
│   │   ├── ui/                                # shadcn/ui components (auto-generated)
│   │   ├── navbar.tsx                         # Top nav with auth state
│   │   ├── book-card.tsx                      # Book cover + title + author
│   │   ├── rating-stars.tsx                   # 1-5 star rating input/display
│   │   ├── follow-button.tsx                  # Follow/unfollow toggle
│   │   ├── shelf-selector.tsx                 # Dropdown: want_to_read/reading/read
│   │   ├── book-search-input.tsx              # Search input form
│   │   ├── search-results.tsx                 # Search results with add-to-shelf
│   │   ├── shelf-book-card.tsx                # Shelf book with status/rating/remove
│   │   ├── edit-bio.tsx                       # Inline bio editor
│   │   ├── feed-item.tsx                      # Single feed activity card
│   │   ├── user-card.tsx                      # User avatar + name + follow button
│   │   ├── recommend-dialog.tsx               # Dialog to send a recommendation
│   │   └── pagination.tsx                     # Offset pagination controls
│   └── middleware.ts                          # Clerk auth middleware
├── tests/
│   └── lib/
│       └── books/
│           └── google-books.test.ts           # Cover URL logic, response parsing
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql             # All tables, indexes, constraints
├── .env.local.example                         # Template for env vars
├── vitest.config.ts                           # Test configuration
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.local.example`
- Modify: `tailwind.config.ts` (if generated)

- [ ] **Step 1: Create Next.js 15 project**

```bash
cd /Users/erebos/Desktop
rm -rf bookshelf/.git  # preserve our docs
npx create-next-app@latest bookshelf --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Accept defaults. This scaffolds the project with Next.js 15, TypeScript, Tailwind CSS v4, App Router, and `src/` directory.

- [ ] **Step 2: Move spec and plan docs back into place**

The `create-next-app` command may overwrite the directory. Before running it, back up the `docs/` folder and restore after:

```bash
cp -r /Users/erebos/Desktop/bookshelf/docs /tmp/bookshelf-docs-backup
# (after create-next-app completes)
cp -r /tmp/bookshelf-docs-backup /Users/erebos/Desktop/bookshelf/docs
```

- [ ] **Step 3: Install core dependencies**

```bash
cd /Users/erebos/Desktop/bookshelf
npm install @clerk/nextjs @supabase/supabase-js svix sanitize-html
npm install -D @types/sanitize-html
```

- `@clerk/nextjs` — Clerk auth for Next.js
- `@supabase/supabase-js` — Supabase client (service role key, server-side only)
- `svix` — Clerk webhook signature verification
- `sanitize-html` — Sanitize HTML from Google Books API descriptions

- [ ] **Step 4: Install dev dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 5: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Choose: New York style, Zinc base color, CSS variables. This sets up `src/components/ui/` and configures Tailwind.

- [ ] **Step 6: Add commonly-needed shadcn components**

```bash
npx shadcn@latest add button card input tabs dialog dropdown-menu avatar badge separator skeleton toast
```

- [ ] **Step 7: Create environment variable template**

Create `.env.local.example`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Google Books
GOOGLE_BOOKS_API_KEY=

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/feed
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/feed
```

- [ ] **Step 8: Configure next.config.ts for image domains**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 9: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 10: Initialize git and commit**

```bash
cd /Users/erebos/Desktop/bookshelf
git init
git add .
git commit -m "feat: scaffold Next.js 15 project with dependencies"
```

---

### Task 2: Supabase Schema & Client

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `src/lib/supabase/client.ts`, `src/lib/supabase/types.ts`

- [ ] **Step 1: Create the migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
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
```

- [ ] **Step 2: Run the migration via Supabase MCP or dashboard**

Execute the SQL in `001_initial_schema.sql` against your Supabase project. Use the Supabase MCP tool or paste into the SQL editor in the Supabase dashboard.

- [ ] **Step 3: Create the Supabase server client**

Create `src/lib/supabase/client.ts`:

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient(supabaseUrl, supabaseKey);
}
```

- [ ] **Step 4: Create database types**

Create `src/lib/supabase/types.ts`:

```ts
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
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/lib/supabase/
git commit -m "feat: add Supabase schema migration and server client"
```

---

### Task 3: Clerk Auth Setup

**Files:**
- Create: `src/middleware.ts`, `src/app/layout.tsx` (modify), `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`, `src/app/api/webhooks/clerk/route.ts`

- [ ] **Step 1: Create Clerk middleware**

Create `src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/book/(.*)",
  "/profile/(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 2: Update root layout with ClerkProvider**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bookshelf",
  description: "A social reading tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 3: Create sign-in page**

Create `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 4: Create sign-up page**

Create `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 5: Create Clerk webhook handler**

Create `src/app/api/webhooks/clerk/route.ts`:

```ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, username, first_name, last_name, image_url } = evt.data;

    const displayName = [first_name, last_name].filter(Boolean).join(" ") || "User";
    const finalUsername = username || `user_${id.slice(-8)}`;

    const supabase = createClient();
    const { error } = await supabase.from("users").insert({
      clerk_id: id,
      username: finalUsername,
      display_name: displayName,
      avatar_url: image_url || "",
    });

    if (error) {
      console.error("Failed to create user:", error);
      return new Response("Failed to create user", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
```

- [ ] **Step 6: Verify the dev server starts**

```bash
cd /Users/erebos/Desktop/bookshelf
npm run dev
```

Open `http://localhost:3000`. You should see the default Next.js page. Clerk sign-in/sign-up pages should render at `/sign-in` and `/sign-up` (they will show errors without valid Clerk keys — that's expected).

- [ ] **Step 7: Commit**

```bash
git add src/middleware.ts src/app/layout.tsx "src/app/(auth)" src/app/api/webhooks/
git commit -m "feat: integrate Clerk auth with middleware, auth pages, and webhook"
```

---

### Task 4: Google Books API Service

**Files:**
- Create: `src/lib/books/google-books.ts`, `src/app/api/books/search/route.ts`, `tests/lib/books/google-books.test.ts`

- [ ] **Step 1: Write failing tests for cover URL logic**

Create `tests/lib/books/google-books.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getCoverUrl, parseBookResult } from "@/lib/books/google-books";

describe("getCoverUrl", () => {
  it("returns Open Library URL when ISBN is available", () => {
    const url = getCoverUrl("9780143127550", undefined);
    expect(url).toBe("https://covers.openlibrary.org/b/isbn/9780143127550-L.jpg");
  });

  it("falls back to Google thumbnail when no ISBN", () => {
    const url = getCoverUrl(undefined, "https://books.google.com/thumb.jpg");
    expect(url).toBe("https://books.google.com/thumb.jpg");
  });

  it("returns null when neither ISBN nor thumbnail", () => {
    const url = getCoverUrl(undefined, undefined);
    expect(url).toBeNull();
  });
});

describe("parseBookResult", () => {
  it("parses a Google Books API volume into our format", () => {
    const volume = {
      id: "abc123",
      volumeInfo: {
        title: "The Great Gatsby",
        authors: ["F. Scott Fitzgerald"],
        description: "A novel about the Jazz Age",
        imageLinks: { thumbnail: "https://books.google.com/thumb.jpg" },
        industryIdentifiers: [{ type: "ISBN_13", identifier: "9780743273565" }],
        pageCount: 180,
        categories: ["Fiction"],
        publishedDate: "1925-04-10",
      },
    };

    const result = parseBookResult(volume);
    expect(result).toEqual({
      google_books_id: "abc123",
      title: "The Great Gatsby",
      authors: ["F. Scott Fitzgerald"],
      description: "A novel about the Jazz Age",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
      isbn: "9780743273565",
      page_count: 180,
      categories: ["Fiction"],
      published_date: "1925-04-10",
    });
  });

  it("handles missing fields gracefully", () => {
    const volume = {
      id: "xyz789",
      volumeInfo: {
        title: "Unknown Book",
      },
    };

    const result = parseBookResult(volume);
    expect(result).toEqual({
      google_books_id: "xyz789",
      title: "Unknown Book",
      authors: [],
      description: null,
      cover_url: null,
      isbn: null,
      page_count: null,
      categories: [],
      published_date: null,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/books/google-books.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the Google Books service**

Create `src/lib/books/google-books.ts`:

```ts
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

export interface GoogleBookResult {
  google_books_id: string;
  title: string;
  authors: string[];
  description: string | null;
  cover_url: string | null;
  isbn: string | null;
  page_count: number | null;
  categories: string[];
  published_date: string | null;
}

export function getCoverUrl(
  isbn: string | undefined,
  googleThumbnail: string | undefined,
): string | null {
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  return googleThumbnail ?? null;
}

function extractIsbn(identifiers?: { type: string; identifier: string }[]): string | null {
  if (!identifiers) return null;
  const isbn13 = identifiers.find((id) => id.type === "ISBN_13");
  const isbn10 = identifiers.find((id) => id.type === "ISBN_10");
  return isbn13?.identifier ?? isbn10?.identifier ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseBookResult(volume: any): GoogleBookResult {
  const info = volume.volumeInfo ?? {};
  const isbn = extractIsbn(info.industryIdentifiers);
  const thumbnail = info.imageLinks?.thumbnail;

  return {
    google_books_id: volume.id,
    title: info.title ?? "Untitled",
    authors: info.authors ?? [],
    description: info.description ?? null,
    cover_url: getCoverUrl(isbn ?? undefined, thumbnail),
    isbn,
    page_count: info.pageCount ?? null,
    categories: info.categories ?? [],
    published_date: info.publishedDate ?? null,
  };
}

export async function searchBooks(query: string): Promise<GoogleBookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=20&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map(parseBookResult);
}

export async function getBook(googleBooksId: string): Promise<GoogleBookResult | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `${GOOGLE_BOOKS_API}/${googleBooksId}?key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Google Books API error: ${res.status}`);
  }

  const data = await res.json();
  return parseBookResult(data);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/books/google-books.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Create the search API route handler**

Create `src/app/api/books/search/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/books/google-books";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchBooks(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Book search error:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/books/ src/app/api/books/ tests/
git commit -m "feat: add Google Books API service with cover fallback and search route"
```

---

### Task 5: Database Query Layer

**Files:**
- Create: `src/queries/user-queries.ts`, `src/queries/book-queries.ts`, `src/queries/shelf-queries.ts`, `src/queries/follow-queries.ts`, `src/queries/recommendation-queries.ts`, `src/queries/feed-queries.ts`

- [ ] **Step 1: Create user queries**

Create `src/queries/user-queries.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { DbUser } from "@/lib/supabase/types";

export async function getUserByClerkId(clerkId: string): Promise<DbUser | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();
  return data;
}

export async function getUserByUsername(username: string): Promise<DbUser | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getAllUsers(): Promise<DbUser[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
```

- [ ] **Step 2: Create book queries**

Create `src/queries/book-queries.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { DbBook } from "@/lib/supabase/types";

export async function getBookByGoogleId(googleBooksId: string): Promise<DbBook | null> {
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

  // Upsert to handle concurrent inserts safely
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
```

- [ ] **Step 3: Create shelf queries**

Create `src/queries/shelf-queries.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { BookStatus, DbUserBook, DbBook } from "@/lib/supabase/types";

export type UserBookWithBook = DbUserBook & { books: DbBook };

export async function getUserBooks(userId: string): Promise<UserBookWithBook[]> {
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
```

- [ ] **Step 4: Create follow queries**

Create `src/queries/follow-queries.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { DbUser } from "@/lib/supabase/types";

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();
  return !!data;
}

export async function getFollowers(userId: string): Promise<DbUser[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower:users!follower_id(*)")
    .eq("following_id", userId);

  return (data?.map((d) => (d as { follower: DbUser }).follower) ?? []);
}

export async function getFollowing(userId: string): Promise<DbUser[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("following:users!following_id(*)")
    .eq("follower_id", userId);

  return (data?.map((d) => (d as { following: DbUser }).following) ?? []);
}

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count ?? 0;
}
```

- [ ] **Step 5: Create recommendation queries**

Create `src/queries/recommendation-queries.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { DbRecommendation, DbUser, DbBook } from "@/lib/supabase/types";

export type RecommendationWithDetails = DbRecommendation & {
  from_user: DbUser;
  to_user: DbUser;
  books: DbBook;
};

export async function getIncomingRecommendations(
  userId: string,
): Promise<RecommendationWithDetails[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recommendations")
    .select("*, from_user:users!from_user_id(*), to_user:users!to_user_id(*), books(*)")
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false });
  return (data as RecommendationWithDetails[]) ?? [];
}

export async function getOutgoingRecommendations(
  userId: string,
): Promise<RecommendationWithDetails[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recommendations")
    .select("*, from_user:users!from_user_id(*), to_user:users!to_user_id(*), books(*)")
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false });
  return (data as RecommendationWithDetails[]) ?? [];
}
```

- [ ] **Step 6: Create feed queries**

Create `src/queries/feed-queries.ts`:

```ts
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

export async function getFeed(userId: string, page: number = 1): Promise<FeedItem[]> {
  const supabase = createClient();
  const offset = (page - 1) * PAGE_SIZE;

  // Get IDs of users this person follows
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = followData?.map((f) => f.following_id) ?? [];
  if (followingIds.length === 0) return [];

  // Fetch enough items from each source to cover merged offset + page.
  // We need (offset + PAGE_SIZE) from each source, then merge, sort,
  // and slice to get the correct page from the union.
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
    .select("id, message, created_at, from_user:users!from_user_id(*), to_user:users!to_user_id(id, username, display_name), books(*)")
    .in("from_user_id", followingIds)
    .order("created_at", { ascending: false })
    .range(0, fetchLimit - 1);

  // Merge and sort
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
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(offset, offset + PAGE_SIZE);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/queries/
git commit -m "feat: add database query layer for all entities"
```

---

### Task 6: Server Actions

**Files:**
- Create: `src/actions/book-actions.ts`, `src/actions/follow-actions.ts`, `src/actions/recommendation-actions.ts`, `src/actions/profile-actions.ts`

- [ ] **Step 1: Create book actions**

Create `src/actions/book-actions.ts`:

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { getUserByClerkId } from "@/queries/user-queries";
import { getOrCreateBook } from "@/queries/book-queries";
import type { BookStatus } from "@/lib/supabase/types";
import type { GoogleBookResult } from "@/lib/books/google-books";

export async function addBookToShelf(bookData: GoogleBookResult, status: BookStatus) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);
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

  const user = await getUserByClerkId(clerkId);
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

export async function updateBookStatus(userBookId: string, status: BookStatus) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);
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

  const user = await getUserByClerkId(clerkId);
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
```

- [ ] **Step 2: Create follow actions**

Create `src/actions/follow-actions.ts`:

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/client";
import { getUserByClerkId } from "@/queries/user-queries";

export async function followUser(targetUserId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);
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

  const user = await getUserByClerkId(clerkId);
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
```

- [ ] **Step 3: Create recommendation actions**

Create `src/actions/recommendation-actions.ts`:

```ts
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

  if (error) throw new Error(`Failed to send recommendation: ${error.message}`);

  revalidatePath("/recommendations");
}
```

- [ ] **Step 4: Create profile actions**

Create `src/actions/profile-actions.ts`:

```ts
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
```

- [ ] **Step 5: Commit**

```bash
git add src/actions/
git commit -m "feat: add server actions for books, follows, recommendations, and profile"
```

---

### Task 7: Shared Components

**Files:**
- Create: `src/components/navbar.tsx`, `src/components/book-card.tsx`, `src/components/rating-stars.tsx`, `src/components/follow-button.tsx`, `src/components/shelf-selector.tsx`, `src/components/book-search-input.tsx`, `src/components/feed-item.tsx`, `src/components/user-card.tsx`, `src/components/recommend-dialog.tsx`, `src/components/pagination.tsx`

- [ ] **Step 1: Create the Navbar component**

Create `src/components/navbar.tsx`:

```tsx
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Bookshelf
        </Link>

        <SignedIn>
          <div className="flex items-center gap-6">
            <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground">
              Feed
            </Link>
            <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
              Search
            </Link>
            <Link href="/shelves" className="text-sm text-muted-foreground hover:text-foreground">
              My Shelves
            </Link>
            <Link href="/recommendations" className="text-sm text-muted-foreground hover:text-foreground">
              Recs
            </Link>
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground">
              Discover
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </SignedOut>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create the BookCard component**

Create `src/components/book-card.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface BookCardProps {
  googleBooksId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
}

export function BookCard({ googleBooksId, title, authors, coverUrl }: BookCardProps) {
  return (
    <Link href={`/book/${googleBooksId}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex gap-4 p-4">
          <div className="relative h-32 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No cover
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-semibold group-hover:underline">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {authors.length > 0 ? authors.join(", ") : "Unknown author"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: Create the RatingStars component**

Create `src/components/rating-stars.tsx`:

```tsx
"use client";

import { useState } from "react";

interface RatingStarsProps {
  rating: number | null;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export function RatingStars({ rating, onRate, readonly = false }: RatingStarsProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-lg ${readonly ? "cursor-default" : "cursor-pointer"} ${
            star <= (hover || rating || 0)
              ? "text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create the FollowButton component**

Create `src/components/follow-button.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/actions/follow-actions";

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
}

export function FollowButton({ targetUserId, isFollowing }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    });
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
```

- [ ] **Step 5: Create the ShelfSelector component**

Create `src/components/shelf-selector.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { BookStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
};

interface ShelfSelectorProps {
  currentStatus?: BookStatus;
  onSelect: (status: BookStatus) => Promise<void>;
}

export function ShelfSelector({ currentStatus, onSelect }: ShelfSelectorProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? "..." : currentStatus ? STATUS_LABELS[currentStatus] : "Add to Shelf"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => startTransition(() => onSelect(status))}
          >
            {STATUS_LABELS[status]}
            {status === currentStatus && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 6: Create the BookSearchInput component**

Create `src/components/book-search-input.tsx`:

```tsx
"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";

interface BookSearchInputProps {
  onSearch: (query: string) => void;
}

export function BookSearchInput({ onSearch }: BookSearchInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim()) {
        onSearch(value.trim());
      }
    },
    [value, onSearch],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Input
        type="search"
        placeholder="Search for books..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full"
      />
    </form>
  );
}
```

- [ ] **Step 7: Create the FeedItem component**

Create `src/components/feed-item.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import type { FeedItem as FeedItemType } from "@/queries/feed-queries";

const STATUS_LABELS: Record<string, string> = {
  want_to_read: "wants to read",
  reading: "is reading",
  read: "finished reading",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FeedItem({ item }: { item: FeedItemType }) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-4">
        <Link href={`/profile/${item.user.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={item.user.avatar_url} />
            <AvatarFallback>{item.user.display_name[0]}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={`/profile/${item.user.username}`}
                className="font-medium hover:underline"
              >
                {item.user.display_name}
              </Link>
              <span className="ml-1 text-sm text-muted-foreground">
                {item.type === "book_added"
                  ? STATUS_LABELS[item.status ?? "want_to_read"]
                  : `recommended a book to ${item.to_user?.display_name}`}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
          </div>

          <Link
            href={`/book/${item.book.google_books_id}`}
            className="mt-2 flex gap-3"
          >
            <div className="relative h-16 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
              {item.book.cover_url && (
                <Image
                  src={item.book.cover_url}
                  alt={item.book.title}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              )}
            </div>
            <div>
              <p className="font-medium hover:underline">{item.book.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.book.authors.join(", ")}
              </p>
            </div>
          </Link>

          {item.rating && (
            <div className="mt-2">
              <RatingStars rating={item.rating} readonly />
            </div>
          )}

          {item.type === "recommendation" && item.message && (
            <p className="mt-2 text-sm italic text-muted-foreground">
              &ldquo;{item.message}&rdquo;
            </p>
          )}

          {item.status && (
            <Badge variant="secondary" className="mt-2">
              {STATUS_LABELS[item.status]}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 8: Create the UserCard component**

Create `src/components/user-card.tsx`:

```tsx
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/follow-button";

interface UserCardProps {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string | null;
  isFollowing: boolean;
  showFollowButton?: boolean;
}

export function UserCard({
  id,
  username,
  displayName,
  avatarUrl,
  bio,
  isFollowing,
  showFollowButton = true,
}: UserCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Link href={`/profile/${username}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${username}`} className="font-medium hover:underline">
            {displayName}
          </Link>
          <p className="text-sm text-muted-foreground">@{username}</p>
          {bio && <p className="mt-1 line-clamp-1 text-sm">{bio}</p>}
        </div>
        {showFollowButton && (
          <FollowButton targetUserId={id} isFollowing={isFollowing} />
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 9: Create the RecommendDialog component**

Create `src/components/recommend-dialog.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendRecommendation } from "@/actions/recommendation-actions";
import type { GoogleBookResult } from "@/lib/books/google-books";
import type { DbUser } from "@/lib/supabase/types";

interface RecommendDialogProps {
  bookData: GoogleBookResult;
  following: DbUser[];
}

export function RecommendDialog({ bookData, following }: RecommendDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    if (!selectedUserId) return;
    startTransition(async () => {
      await sendRecommendation(selectedUserId, bookData, message || undefined);
      setOpen(false);
      setMessage("");
      setSelectedUserId("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Recommend
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recommend &ldquo;{bookData.title}&rdquo;</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Send to</label>
            <select
              className="mt-1 w-full rounded-md border p-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select a user...</option>
              {following.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name} (@{user.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Message (optional)</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="You'd love this book!"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSend} disabled={isPending || !selectedUserId} className="w-full">
            {isPending ? "Sending..." : "Send Recommendation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 10: Create the Pagination component**

Create `src/components/pagination.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  basePath: string;
}

export function Pagination({ currentPage, hasMore, basePath }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      {currentPage > 1 && (
        <Button variant="outline" asChild>
          <Link href={`${basePath}?page=${currentPage - 1}`}>Previous</Link>
        </Button>
      )}
      <span className="text-sm text-muted-foreground">Page {currentPage}</span>
      {hasMore && (
        <Button variant="outline" asChild>
          <Link href={`${basePath}?page=${currentPage + 1}`}>Next</Link>
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 11: Commit**

```bash
git add src/components/
git commit -m "feat: add shared UI components (navbar, book card, rating, follow, feed, etc.)"
```

---

### Task 8: Landing Page

**Files:**
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`

- [ ] **Step 1: Add Navbar to root layout**

Update `src/app/layout.tsx` — add the Navbar inside `<body>`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bookshelf",
  description: "A social reading tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Create landing page**

Replace `src/app/page.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/feed");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Track what you read.
        <br />
        <span className="text-muted-foreground">Share what you love.</span>
      </h1>
      <p className="mt-6 max-w-lg text-lg text-muted-foreground">
        Organize your books into shelves, follow friends, and discover your next great read.
      </p>
      <div className="mt-10 flex gap-4">
        <Button size="lg" asChild>
          <Link href="/sign-up">Get Started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add landing page with auth redirect"
```

---

### Task 9: Search Page

**Files:**
- Create: `src/app/search/page.tsx`, `src/components/search-results.tsx`

- [ ] **Step 1: Create search results client component**

Create `src/components/search-results.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { BookCard } from "@/components/book-card";
import { BookSearchInput } from "@/components/book-search-input";
import { Button } from "@/components/ui/button";
import { addBookToShelf } from "@/actions/book-actions";
import type { GoogleBookResult } from "@/lib/books/google-books";
import type { BookStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
};

export function SearchResults() {
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (book: GoogleBookResult, status: BookStatus) => {
    setAddingId(book.google_books_id);
    startTransition(async () => {
      try {
        await addBookToShelf(book, status);
      } catch (err) {
        console.error(err);
      }
      setAddingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <BookSearchInput onSearch={handleSearch} />

      {loading && <p className="text-center text-muted-foreground">Searching...</p>}

      <div className="space-y-4">
        {results.map((book) => (
          <div key={book.google_books_id} className="flex items-start gap-4">
            <div className="flex-1">
              <BookCard
                googleBooksId={book.google_books_id}
                title={book.title}
                authors={book.authors}
                coverUrl={book.cover_url}
              />
            </div>
            <div className="flex flex-shrink-0 flex-col gap-1 pt-4">
              {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  disabled={addingId === book.google_books_id || isPending}
                  onClick={() => handleAdd(book, status)}
                >
                  {STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the search page**

Create `src/app/search/page.tsx`:

```tsx
import { SearchResults } from "@/components/search-results";

export default function SearchPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Search Books</h1>
      <SearchResults />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/search/ src/components/search-results.tsx
git commit -m "feat: add book search page with Google Books integration"
```

---

### Task 10: Shelves Page

**Files:**
- Create: `src/app/shelves/page.tsx`, `src/components/shelf-book-card.tsx`

- [ ] **Step 1: Create shelf book card with actions**

Create `src/components/shelf-book-card.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { ShelfSelector } from "@/components/shelf-selector";
import { updateBookStatus, rateBook, removeBookFromShelf } from "@/actions/book-actions";
import type { BookStatus } from "@/lib/supabase/types";
import type { UserBookWithBook } from "@/queries/shelf-queries";

export function ShelfBookCard({ userBook }: { userBook: UserBookWithBook }) {
  const [isPending, startTransition] = useTransition();
  const book = userBook.books;

  const handleStatusChange = async (status: BookStatus) => {
    await updateBookStatus(userBook.id, status);
  };

  const handleRate = (rating: number) => {
    startTransition(async () => {
      await rateBook(userBook.id, rating);
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removeBookFromShelf(userBook.id);
    });
  };

  return (
    <Card>
      <CardContent className="flex gap-4 p-4">
        <Link href={`/book/${book.google_books_id}`}>
          <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
                alt={book.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                No cover
              </div>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/book/${book.google_books_id}`} className="font-medium hover:underline">
            {book.title}
          </Link>
          <p className="text-sm text-muted-foreground">{book.authors.join(", ")}</p>
          <div className="mt-2">
            <RatingStars rating={userBook.rating} onRate={handleRate} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <ShelfSelector currentStatus={userBook.status} onSelect={handleStatusChange} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
            className="text-destructive"
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create shelves page**

Create `src/app/shelves/page.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserByClerkId } from "@/queries/user-queries";
import { getUserBooksByStatus } from "@/queries/shelf-queries";
import { ShelfBookCard } from "@/components/shelf-book-card";
import type { BookStatus } from "@/lib/supabase/types";

const SHELVES: { status: BookStatus; label: string }[] = [
  { status: "want_to_read", label: "Want to Read" },
  { status: "reading", label: "Reading" },
  { status: "read", label: "Read" },
];

export default async function ShelvesPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const shelves = await Promise.all(
    SHELVES.map(async (shelf) => ({
      ...shelf,
      books: await getUserBooksByStatus(user.id, shelf.status),
    })),
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Shelves</h1>

      <Tabs defaultValue="want_to_read">
        <TabsList>
          {shelves.map((shelf) => (
            <TabsTrigger key={shelf.status} value={shelf.status}>
              {shelf.label} ({shelf.books.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {shelves.map((shelf) => (
          <TabsContent key={shelf.status} value={shelf.status}>
            {shelf.books.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No books yet.</p>
            ) : (
              <div className="space-y-3">
                {shelf.books.map((ub) => (
                  <ShelfBookCard key={ub.id} userBook={ub} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/shelves/ src/components/shelf-book-card.tsx
git commit -m "feat: add shelves page with status tabs and book management"
```

---

### Task 11: Book Detail Page

**Files:**
- Create: `src/app/book/[googleId]/page.tsx`, `src/app/book/[googleId]/book-detail-actions.tsx`

- [ ] **Step 1: Create book detail page**

Create `src/app/book/[googleId]/page.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/rating-stars";
import sanitizeHtml from "sanitize-html";
import { getBook } from "@/lib/books/google-books";
import { getBookByGoogleId, getBookUsers } from "@/queries/book-queries";
import { getUserByClerkId } from "@/queries/user-queries";
import { getUserBook } from "@/queries/shelf-queries";
import { getFollowing } from "@/queries/follow-queries";
import { BookDetailActions } from "./book-detail-actions";

function BookDescription({ html }: { html: string }) {
  const clean = sanitizeHtml(html, {
    allowedTags: ["b", "i", "em", "strong", "p", "br"],
    allowedAttributes: {},
  });
  return <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: clean }} />;
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ googleId: string }>;
}) {
  const { googleId } = await params;

  // Try local DB first, then Google Books API
  let localBook = await getBookByGoogleId(googleId);
  let bookInfo = localBook
    ? {
        google_books_id: localBook.google_books_id,
        title: localBook.title,
        authors: localBook.authors,
        description: localBook.description,
        cover_url: localBook.cover_url,
        isbn: localBook.isbn,
        page_count: localBook.page_count,
        categories: localBook.categories,
        published_date: localBook.published_date,
      }
    : await getBook(googleId);

  if (!bookInfo) notFound();

  // Get current user's shelf status if logged in
  const { userId: clerkId } = await auth();
  let currentUserBook = null;
  let following: Awaited<ReturnType<typeof getFollowing>> = [];

  if (clerkId) {
    const user = await getUserByClerkId(clerkId);
    if (user && localBook) {
      currentUserBook = await getUserBook(user.id, localBook.id);
    }
    if (user) {
      following = await getFollowing(user.id);
    }
  }

  // Get other users who have this book
  const bookUsers = localBook ? await getBookUsers(localBook.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 sm:flex-row">
        {/* Cover */}
        <div className="relative h-72 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {bookInfo.cover_url ? (
            <Image
              src={bookInfo.cover_url}
              alt={bookInfo.title}
              fill
              className="object-cover"
              sizes="192px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No cover
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{bookInfo.title}</h1>
            <p className="mt-1 text-lg text-muted-foreground">
              {bookInfo.authors.length > 0 ? bookInfo.authors.join(", ") : "Unknown author"}
            </p>
          </div>

          {bookInfo.published_date && (
            <p className="text-sm text-muted-foreground">Published: {bookInfo.published_date}</p>
          )}

          {bookInfo.page_count && (
            <p className="text-sm text-muted-foreground">{bookInfo.page_count} pages</p>
          )}

          {bookInfo.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bookInfo.categories.map((cat) => (
                <Badge key={cat} variant="secondary">{cat}</Badge>
              ))}
            </div>
          )}

          {currentUserBook && (
            <div>
              <RatingStars rating={currentUserBook.rating} readonly />
            </div>
          )}

          <BookDetailActions
            bookData={bookInfo}
            currentUserBook={currentUserBook}
            following={following}
          />
        </div>
      </div>

      {bookInfo.description && (
        <>
          <Separator />
          <div>
            <h2 className="mb-2 text-lg font-semibold">Description</h2>
            <BookDescription html={bookInfo.description} />
          </div>
        </>
      )}

      {bookUsers.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-4 text-lg font-semibold">Readers</h2>
            <div className="flex flex-wrap gap-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {bookUsers.map((ub: any) => (
                <Link key={ub.id} href={`/profile/${ub.users.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={ub.users.avatar_url} />
                    <AvatarFallback>{ub.users.display_name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create book detail actions client component**

Create `src/app/book/[googleId]/book-detail-actions.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { ShelfSelector } from "@/components/shelf-selector";
import { RatingStars } from "@/components/rating-stars";
import { RecommendDialog } from "@/components/recommend-dialog";
import { Button } from "@/components/ui/button";
import {
  addBookToShelf,
  updateBookStatus,
  rateBook,
  removeBookFromShelf,
} from "@/actions/book-actions";
import type { BookStatus, DbUserBook, DbUser } from "@/lib/supabase/types";
import type { GoogleBookResult } from "@/lib/books/google-books";

interface Props {
  bookData: GoogleBookResult;
  currentUserBook: DbUserBook | null;
  following: DbUser[];
}

export function BookDetailActions({ bookData, currentUserBook, following }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleShelfSelect = async (status: BookStatus) => {
    if (currentUserBook) {
      await updateBookStatus(currentUserBook.id, status);
    } else {
      await addBookToShelf(bookData, status);
    }
  };

  const handleRate = (rating: number) => {
    if (!currentUserBook) return;
    startTransition(async () => {
      await rateBook(currentUserBook.id, rating);
    });
  };

  const handleRemove = () => {
    if (!currentUserBook) return;
    startTransition(async () => {
      await removeBookFromShelf(currentUserBook.id);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ShelfSelector
        currentStatus={currentUserBook?.status}
        onSelect={handleShelfSelect}
      />

      {currentUserBook && (
        <>
          <RatingStars rating={currentUserBook.rating} onRate={handleRate} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
            className="text-destructive"
          >
            Remove
          </Button>
        </>
      )}

      {following.length > 0 && (
        <RecommendDialog bookData={bookData} following={following} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/book/"
git commit -m "feat: add book detail page with shelf actions and recommendations"
```

---

### Task 12: Feed Page

**Files:**
- Create: `src/app/feed/page.tsx`

- [ ] **Step 1: Create feed page**

Create `src/app/feed/page.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/queries/user-queries";
import { getFeed } from "@/queries/feed-queries";
import { FeedItem } from "@/components/feed-item";
import { Pagination } from "@/components/pagination";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const items = await getFeed(user.id, page);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Feed</h1>

      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {page === 1
            ? "Nothing here yet. Follow some people to see their activity!"
            : "No more activity."}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        hasMore={items.length === 20}
        basePath="/feed"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/feed/
git commit -m "feat: add activity feed page with pagination"
```

---

### Task 13: Profile Page

**Files:**
- Create: `src/app/profile/[username]/page.tsx`, `src/components/edit-bio.tsx`

- [ ] **Step 1: Create edit bio client component**

Create `src/components/edit-bio.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBio } from "@/actions/profile-actions";

export function EditBio({ currentBio }: { currentBio: string | null }) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(currentBio ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateBio(bio);
      setEditing(false);
    });
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-muted-foreground">{currentBio || "No bio yet."}</p>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Tell people about yourself..."
        className="max-w-sm"
      />
      <Button size="sm" onClick={handleSave} disabled={isPending}>
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create profile page**

Create `src/app/profile/[username]/page.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "@/components/follow-button";
import { BookCard } from "@/components/book-card";
import { EditBio } from "@/components/edit-bio";
import { getUserByClerkId, getUserByUsername } from "@/queries/user-queries";
import { getUserBooks } from "@/queries/shelf-queries";
import { isFollowing } from "@/queries/follow-queries";
import { getFollowerCount, getFollowingCount } from "@/queries/follow-queries";
import { getUserBookCounts } from "@/queries/shelf-queries";
import type { BookStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profileUser = await getUserByUsername(username);
  if (!profileUser) notFound();

  const { userId: clerkId } = await auth();
  let currentUser = null;
  let following = false;
  let isOwnProfile = false;

  if (clerkId) {
    currentUser = await getUserByClerkId(clerkId);
    if (currentUser) {
      isOwnProfile = currentUser.id === profileUser.id;
      if (!isOwnProfile) {
        following = await isFollowing(currentUser.id, profileUser.id);
      }
    }
  }

  const [userBooks, followerCount, followingCount, bookCounts] = await Promise.all([
    getUserBooks(profileUser.id),
    getFollowerCount(profileUser.id),
    getFollowingCount(profileUser.id),
    getUserBookCounts(profileUser.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profileUser.avatar_url} />
          <AvatarFallback className="text-2xl">{profileUser.display_name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{profileUser.display_name}</h1>
            {currentUser && !isOwnProfile && (
              <FollowButton targetUserId={profileUser.id} isFollowing={following} />
            )}
          </div>
          <p className="text-muted-foreground">@{profileUser.username}</p>

          <div className="mt-2">
            {isOwnProfile ? (
              <EditBio currentBio={profileUser.bio} />
            ) : (
              profileUser.bio && <p className="text-muted-foreground">{profileUser.bio}</p>
            )}
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <span><strong>{followerCount}</strong> followers</span>
            <span><strong>{followingCount}</strong> following</span>
            <span><strong>{bookCounts.read}</strong> books read</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Shelves */}
      <Tabs defaultValue="want_to_read">
        <TabsList>
          {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
            <TabsTrigger key={status} value={status}>
              {STATUS_LABELS[status]} ({bookCounts[status]})
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
          <TabsContent key={status} value={status}>
            <div className="grid gap-4 sm:grid-cols-2">
              {userBooks
                .filter((ub) => ub.status === status)
                .map((ub) => (
                  <BookCard
                    key={ub.id}
                    googleBooksId={ub.books.google_books_id}
                    title={ub.books.title}
                    authors={ub.books.authors}
                    coverUrl={ub.books.cover_url}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/profile/" src/components/edit-bio.tsx
git commit -m "feat: add user profile page with shelves, stats, and bio editing"
```

---

### Task 14: Recommendations Page

**Files:**
- Create: `src/app/recommendations/page.tsx`

- [ ] **Step 1: Create recommendations page**

Create `src/app/recommendations/page.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookCard } from "@/components/book-card";
import { getUserByClerkId } from "@/queries/user-queries";
import {
  getIncomingRecommendations,
  getOutgoingRecommendations,
} from "@/queries/recommendation-queries";

export default async function RecommendationsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const [incoming, outgoing] = await Promise.all([
    getIncomingRecommendations(user.id),
    getOutgoingRecommendations(user.id),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Recommendations</h1>

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">Incoming ({incoming.length})</TabsTrigger>
          <TabsTrigger value="outgoing">Sent ({outgoing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          {incoming.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No recommendations yet.</p>
          ) : (
            <div className="space-y-4">
              {incoming.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Link href={`/profile/${rec.from_user.username}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rec.from_user.avatar_url} />
                          <AvatarFallback>{rec.from_user.display_name[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <span className="text-sm">
                        <Link href={`/profile/${rec.from_user.username}`} className="font-medium hover:underline">
                          {rec.from_user.display_name}
                        </Link>
                        {" recommended"}
                      </span>
                    </div>
                    <BookCard
                      googleBooksId={rec.books.google_books_id}
                      title={rec.books.title}
                      authors={rec.books.authors}
                      coverUrl={rec.books.cover_url}
                    />
                    {rec.message && (
                      <p className="mt-3 text-sm italic text-muted-foreground">
                        &ldquo;{rec.message}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing">
          {outgoing.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">You haven&apos;t sent any recommendations yet.</p>
          ) : (
            <div className="space-y-4">
              {outgoing.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 text-sm">
                      Sent to{" "}
                      <Link href={`/profile/${rec.to_user.username}`} className="font-medium hover:underline">
                        {rec.to_user.display_name}
                      </Link>
                    </div>
                    <BookCard
                      googleBooksId={rec.books.google_books_id}
                      title={rec.books.title}
                      authors={rec.books.authors}
                      coverUrl={rec.books.cover_url}
                    />
                    {rec.message && (
                      <p className="mt-3 text-sm italic text-muted-foreground">
                        &ldquo;{rec.message}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/recommendations/
git commit -m "feat: add recommendations page with incoming/outgoing tabs"
```

---

### Task 15: Discover Page

**Files:**
- Create: `src/app/discover/page.tsx`

- [ ] **Step 1: Create discover page**

Create `src/app/discover/page.tsx`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId, getAllUsers } from "@/queries/user-queries";
import { getFollowing } from "@/queries/follow-queries";
import { UserCard } from "@/components/user-card";

export default async function DiscoverPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const currentUser = await getUserByClerkId(clerkId);
  if (!currentUser) redirect("/sign-in");

  const [allUsers, followingList] = await Promise.all([
    getAllUsers(),
    getFollowing(currentUser.id),
  ]);

  const followingIds = new Set(followingList.map((u) => u.id));
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);

  const usersWithFollowStatus = otherUsers.map((u) => ({
    ...u,
    isFollowing: followingIds.has(u.id),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Discover People</h1>

      {usersWithFollowStatus.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No other users yet.</p>
      ) : (
        <div className="space-y-3">
          {usersWithFollowStatus.map((user) => (
            <UserCard
              key={user.id}
              id={user.id}
              username={user.username}
              displayName={user.display_name}
              avatarUrl={user.avatar_url}
              bio={user.bio}
              isFollowing={user.isFollowing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/discover/
git commit -m "feat: add discover page for browsing and following users"
```

---

### Task 16: Final Polish & Verification

**Files:**
- Modify: `src/app/globals.css` (if needed)

- [ ] **Step 1: Verify all routes compile**

```bash
cd /Users/erebos/Desktop/bookshelf
npm run build
```

Fix any TypeScript or import errors that surface.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Manual smoke test**

Start the dev server and manually verify:

```bash
npm run dev
```

1. Landing page loads at `/`
2. Sign-up/sign-in pages render
3. After auth, redirected to `/feed`
4. Search works and returns results
5. Can add a book to shelf
6. Shelves page shows books in correct tabs
7. Book detail page shows info
8. Profile page shows user info and shelves
9. Discover page lists other users
10. Follow/unfollow works
11. Recommendations can be sent and viewed

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final polish and build verification"
```
