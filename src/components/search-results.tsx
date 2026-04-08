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
      const res = await fetch(
        `/api/books/search?q=${encodeURIComponent(query)}`,
      );
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

      {loading && (
        <p className="text-center text-muted-foreground">Searching...</p>
      )}

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
                  disabled={
                    addingId === book.google_books_id || isPending
                  }
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
