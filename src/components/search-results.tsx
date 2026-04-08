"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { addBookToShelf } from "@/actions/book-actions";
import type { GoogleBookResult } from "@/lib/books/google-books";
import type { BookStatus } from "@/lib/supabase/types";

const STATUSES: { value: BookStatus; label: string }[] = [
  { value: "want_to_read", label: "WANT" },
  { value: "reading", label: "READING" },
  { value: "read", label: "READ" },
];

export function SearchResults() {
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/books/search?q=${encodeURIComponent(query.trim())}`,
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
    <div>
      <form onSubmit={handleSearch} className="flex gap-0">
        <input
          type="search"
          placeholder="SEARCH BOOKS..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-4 border-black px-4 py-3 text-sm font-bold uppercase tracking-wider placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-black text-white border-4 border-black px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
        >
          GO
        </button>
      </form>

      {loading && (
        <p className="mt-8 text-center text-sm uppercase tracking-widest text-gray-400">
          Searching...
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {results.map((book) => (
          <div key={book.google_books_id} className="group">
            <Link href={`/book/${book.google_books_id}`}>
              <div className="border-3 border-black overflow-hidden hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                <div className="relative aspect-[2/3] w-full bg-gray-100">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-black text-white p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                        {book.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="border-t-3 border-black p-2 bg-white">
                  <h3 className="font-bold text-xs uppercase tracking-tight line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase line-clamp-1">
                    {book.authors.join(", ") || "Unknown"}
                  </p>
                </div>
              </div>
            </Link>
            <div className="mt-1 flex gap-0.5">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  disabled={addingId === book.google_books_id || isPending}
                  onClick={() => handleAdd(book, s.value)}
                  className="flex-1 border-2 border-black px-1 py-1 text-[9px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors disabled:opacity-30"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
