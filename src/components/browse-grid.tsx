"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface BrowseBook {
  key: string;
  title: string;
  authors: string[];
  cover_id: number | null;
  cover_url: string | null;
}

interface PageData {
  books: BrowseBook[];
  subject: string;
}

export function BrowseGrid() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/books/browse?page=${page}`);
      const data = await res.json();
      if (data.books.length === 0) {
        setHasMore(false);
      } else {
        setPages((prev) => [...prev, { books: data.books, subject: data.subject }]);
        setPage((p) => p + 1);
        setHasMore(data.hasMore);
      }
    } catch {
      setHasMore(false);
    }
    setLoading(false);
  }, [page, loading, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Load first batch immediately
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {pages.map((pageData, pageIdx) => (
        <div key={pageIdx} className="mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-4 border-b-4 border-black pb-2">
            {pageData.subject}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {pageData.books.map((book) => (
              <Link
                key={`${pageIdx}-${book.key}`}
                href={`/book/${book.key}`}
                className="group block"
              >
                <div className="border-2 border-black overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                  <div className="relative aspect-[2/3] w-full bg-gray-100">
                    {book.cover_url ? (
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-black text-white p-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="border-t-2 border-black p-2 bg-white">
                    <h3 className="font-bold text-[10px] uppercase tracking-tight line-clamp-1 group-hover:underline">
                      {book.title}
                    </h3>
                    <p className="text-[8px] text-gray-500 uppercase line-clamp-1">
                      {book.authors.join(", ") || "Unknown"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="py-8 text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-gray-400 animate-pulse">
            Loading...
          </span>
        </div>
      )}

      {!hasMore && pages.length > 0 && (
        <div className="py-8 text-center border-t-4 border-dashed border-gray-300 mt-8">
          <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
            You&apos;ve reached the end
          </span>
        </div>
      )}
    </div>
  );
}
