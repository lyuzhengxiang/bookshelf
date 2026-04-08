import { describe, it, expect } from "vitest";
import { getCoverUrl, parseBookResult } from "@/lib/books/google-books";

describe("getCoverUrl", () => {
  it("returns Open Library URL when ISBN is available", () => {
    const url = getCoverUrl("9780143127550", undefined);
    expect(url).toBe(
      "https://covers.openlibrary.org/b/isbn/9780143127550-L.jpg",
    );
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
        industryIdentifiers: [
          { type: "ISBN_13", identifier: "9780743273565" },
        ],
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
      cover_url:
        "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
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
