const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

export interface GoogleBookResult {
  google_books_id: string;
  title: string;
  authors: string[];
  description: string | null;
  cover_url: string | null;
  isbn: string | null;
  page_count: number | null;
  categories: string[];
  published_date: string | null;
}

export function getCoverUrl(
  isbn: string | undefined,
  googleThumbnail: string | undefined,
): string | null {
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  return googleThumbnail ?? null;
}

function extractIsbn(
  identifiers?: { type: string; identifier: string }[],
): string | null {
  if (!identifiers) return null;
  const isbn13 = identifiers.find((id) => id.type === "ISBN_13");
  const isbn10 = identifiers.find((id) => id.type === "ISBN_10");
  return isbn13?.identifier ?? isbn10?.identifier ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseBookResult(volume: any): GoogleBookResult {
  const info = volume.volumeInfo ?? {};
  const isbn = extractIsbn(info.industryIdentifiers);
  const thumbnail = info.imageLinks?.thumbnail;

  return {
    google_books_id: volume.id,
    title: info.title ?? "Untitled",
    authors: info.authors ?? [],
    description: info.description ?? null,
    cover_url: getCoverUrl(isbn ?? undefined, thumbnail),
    isbn,
    page_count: info.pageCount ?? null,
    categories: info.categories ?? [],
    published_date: info.publishedDate ?? null,
  };
}

export async function searchBooks(
  query: string,
): Promise<GoogleBookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=20&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map(parseBookResult);
}

export async function getBook(
  googleBooksId: string,
): Promise<GoogleBookResult | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `${GOOGLE_BOOKS_API}/${googleBooksId}?key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Google Books API error: ${res.status}`);
  }

  const data = await res.json();
  return parseBookResult(data);
}
