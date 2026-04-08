import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/rating-stars";
import { getBook } from "@/lib/books/google-books";
import { getBookByGoogleId, getBookUsers } from "@/queries/book-queries";
import { getOrCreateCurrentUser } from "@/queries/user-queries";
import { getUserBook } from "@/queries/shelf-queries";
import { getFollowing } from "@/queries/follow-queries";
import { BookDetailActions } from "./book-detail-actions";

function BookDescription({ html }: { html: string }) {
  const clean = sanitizeHtml(html, {
    allowedTags: ["b", "i", "em", "strong", "p", "br"],
    allowedAttributes: {},
  });
  return (
    <p
      className="text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ googleId: string }>;
}) {
  const { googleId } = await params;

  // Try local DB first, then Google Books API
  const localBook = await getBookByGoogleId(googleId);
  const bookInfo = localBook
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
    const user = await getOrCreateCurrentUser(clerkId);
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
              {bookInfo.authors.length > 0
                ? bookInfo.authors.join(", ")
                : "Unknown author"}
            </p>
          </div>

          {bookInfo.published_date && (
            <p className="text-sm text-muted-foreground">
              Published: {bookInfo.published_date}
            </p>
          )}

          {bookInfo.page_count && (
            <p className="text-sm text-muted-foreground">
              {bookInfo.page_count} pages
            </p>
          )}

          {bookInfo.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bookInfo.categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
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
                    <AvatarFallback>
                      {ub.users.display_name[0]}
                    </AvatarFallback>
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
