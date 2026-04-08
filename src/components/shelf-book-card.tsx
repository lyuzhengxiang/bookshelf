"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { ShelfSelector } from "@/components/shelf-selector";
import {
  updateBookStatus,
  rateBook,
  removeBookFromShelf,
} from "@/actions/book-actions";
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
          <Link
            href={`/book/${book.google_books_id}`}
            className="font-medium hover:underline"
          >
            {book.title}
          </Link>
          <p className="text-sm text-muted-foreground">
            {book.authors.join(", ")}
          </p>
          <div className="mt-2">
            <RatingStars rating={userBook.rating} onRate={handleRate} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <ShelfSelector
            currentStatus={userBook.status}
            onSelect={handleStatusChange}
          />
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
