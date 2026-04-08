"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { RatingStars } from "@/components/rating-stars";
import {
  updateBookStatus,
  rateBook,
  removeBookFromShelf,
} from "@/actions/book-actions";
import type { BookStatus } from "@/lib/supabase/types";
import type { UserBookWithBook } from "@/queries/shelf-queries";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "WANT",
  reading: "READING",
  read: "READ",
};

export function ShelfBookCard({ userBook }: { userBook: UserBookWithBook }) {
  const [isPending, startTransition] = useTransition();
  const book = userBook.books;

  const handleStatusChange = (status: BookStatus) => {
    startTransition(async () => {
      await updateBookStatus(userBook.id, status);
    });
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
    <div className="border-3 border-black flex overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      <Link href={`/book/${book.google_books_id}`} className="flex-shrink-0">
        <div className="relative h-36 w-24 bg-gray-100">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-black text-white p-2">
              <span className="text-[8px] font-bold uppercase text-center">
                {book.title}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 border-l-3 border-black p-3 flex flex-col justify-between">
        <div>
          <Link
            href={`/book/${book.google_books_id}`}
            className="font-bold text-sm uppercase tracking-tight hover:underline"
          >
            {book.title}
          </Link>
          <p className="text-[10px] text-gray-500 uppercase">
            {book.authors.join(", ")}
          </p>
          <div className="mt-2">
            <RatingStars rating={userBook.rating} onRate={handleRate} />
          </div>
        </div>

        <div className="flex gap-1 mt-2">
          {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isPending}
              className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-2 border-black transition-colors ${
                status === userBook.status
                  ? "bg-black text-white"
                  : "hover:bg-black hover:text-white"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors ml-auto"
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
}
