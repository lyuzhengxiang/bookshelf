import { describe, it, expect } from "vitest";
import { getCoverUrl, parseBookResult } from "@/lib/books/google-books";

describe("getCoverUrl", () => {
  it("returns Open Library cover ID URL when coverId is available", () => {
    const url = getCoverUrl(12345, undefined);
    expect(url).toBe("https://covers.openlibrary.org/b/id/12345-L.jpg");
  });

  it("falls back to ISBN cover URL when no coverId", () => {
    const url = getCoverUrl(undefined, "9780143127550");
    expect(url).toBe(
      "https://covers.openlibrary.org/b/isbn/9780143127550-L.jpg",
    );
  });

  it("prefers coverId over ISBN", () => {
    const url = getCoverUrl(12345, "9780143127550");
    expect(url).toBe("https://covers.openlibrary.org/b/id/12345-L.jpg");
  });

  it("returns null when neither coverId nor ISBN", () => {
    const url = getCoverUrl(undefined, undefined);
    expect(url).toBeNull();
  });
});

describe("parseBookResult", () => {
  it("parses an Open Library search doc into our format", () => {
    const doc = {
      key: "/works/OL123W",
      title: "The Great Gatsby",
      author_name: ["F. Scott Fitzgerald"],
      cover_i: 67890,
      isbn: ["9780743273565", "0743273567"],
      number_of_pages_median: 180,
      subject: ["Fiction", "Classic Literature", "American"],
      first_publish_year: 1925,
    };

    const result = parseBookResult(doc);
    expect(result).toEqual({
      google_books_id: "OL123W",
      title: "The Great Gatsby",
      authors: ["F. Scott Fitzgerald"],
      description: null,
      cover_url: "https://covers.openlibrary.org/b/id/67890-L.jpg",
      isbn: "9780743273565",
      page_count: 180,
      categories: ["Fiction", "Classic Literature", "American"],
      published_date: "1925",
    });
  });

  it("handles missing fields gracefully", () => {
    const doc = {
      key: "/works/OL456W",
      title: "Unknown Book",
    };

    const result = parseBookResult(doc);
    expect(result).toEqual({
      google_books_id: "OL456W",
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
