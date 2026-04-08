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

export function BookDetailActions({
  bookData,
  currentUserBook,
  following,
}: Props) {
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
