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
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
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
            <span className="text-xs text-muted-foreground">
              {timeAgo(item.created_at)}
            </span>
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
