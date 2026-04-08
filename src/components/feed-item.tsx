import Link from "next/link";
import Image from "next/image";
import { RatingStars } from "@/components/rating-stars";
import type { FeedItem as FeedItemType } from "@/queries/feed-queries";

const STATUS_LABELS: Record<string, string> = {
  want_to_read: "WANTS TO READ",
  reading: "IS READING",
  read: "FINISHED",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "NOW";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H`;
  const days = Math.floor(hours / 24);
  return `${days}D`;
}

export function FeedItem({ item }: { item: FeedItemType }) {
  return (
    <div className="border-3 border-black p-0 flex overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      <Link
        href={`/book/${item.book.google_books_id}`}
        className="flex-shrink-0"
      >
        <div className="relative h-32 w-20 bg-gray-100">
          {item.book.cover_url && (
            <Image
              src={item.book.cover_url}
              alt={item.book.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          )}
        </div>
      </Link>

      <div className="flex-1 border-l-3 border-black p-3">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/profile/${item.user.username}`}
              className="font-bold text-xs uppercase tracking-wider hover:underline"
            >
              {item.user.display_name}
            </Link>
            <span className="ml-2 text-[10px] text-gray-500 uppercase">
              {item.type === "book_added"
                ? STATUS_LABELS[item.status ?? "want_to_read"]
                : `REC'D TO ${item.to_user?.display_name?.toUpperCase()}`}
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-400">
            {timeAgo(item.created_at)}
          </span>
        </div>

        <Link
          href={`/book/${item.book.google_books_id}`}
          className="block mt-2"
        >
          <p className="font-bold text-sm uppercase tracking-tight hover:underline">
            {item.book.title}
          </p>
          <p className="text-[10px] text-gray-500 uppercase">
            {item.book.authors.join(", ")}
          </p>
        </Link>

        {item.rating && (
          <div className="mt-1">
            <RatingStars rating={item.rating} readonly />
          </div>
        )}

        {item.type === "recommendation" && item.message && (
          <p className="mt-2 text-xs italic text-gray-500 border-l-4 border-black pl-2">
            {item.message}
          </p>
        )}
      </div>
    </div>
  );
}
