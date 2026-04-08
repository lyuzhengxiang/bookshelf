const OL_SEARCH_API = "https://openlibrary.org/search.json";

export interface GoogleBookResult {
  google_books_id: string; // stores Open Library work key (e.g. "OL123W")
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
  coverId: number | undefined,
  isbn: string | undefined,
): string | null {
  if (coverId) {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseBookResult(doc: any): GoogleBookResult {
  const isbn = doc.isbn?.[0] ?? null;
  const coverId = doc.cover_i;
  const workKey = doc.key?.replace("/works/", "") ?? doc.key ?? `ol_${doc.cover_i}`;

  return {
    google_books_id: workKey,
    title: doc.title ?? "Untitled",
    authors: doc.author_name ?? [],
    description: null, // OL search doesn't return descriptions
    cover_url: getCoverUrl(coverId, isbn),
    isbn,
    page_count: doc.number_of_pages_median ?? null,
    categories: doc.subject?.slice(0, 5) ?? [],
    published_date: doc.first_publish_year?.toString() ?? null,
  };
}

export async function searchBooks(
  query: string,
): Promise<GoogleBookResult[]> {
  const url = `${OL_SEARCH_API}?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,isbn,number_of_pages_median,subject,first_publish_year`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open Library API error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.docs) return [];

  return data.docs.map(parseBookResult);
}

export async function getBook(
  workKey: string,
): Promise<GoogleBookResult | null> {
  // Fetch work details
  const url = `https://openlibrary.org/works/${workKey}.json`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Open Library API error: ${res.status}`);
  }

  const data = await res.json();

  // Get author names
  const authorKeys =
    data.authors?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.author?.key ?? a.key,
    ) ?? [];
  const authorNames = await Promise.all(
    authorKeys.slice(0, 5).map(async (key: string) => {
      try {
        const r = await fetch(`https://openlibrary.org${key}.json`);
        if (!r.ok) return "Unknown";
        const d = await r.json();
        return d.name ?? "Unknown";
      } catch {
        return "Unknown";
      }
    }),
  );

  const description =
    typeof data.description === "string"
      ? data.description
      : data.description?.value ?? null;

  const coverId = data.covers?.[0];

  return {
    google_books_id: workKey,
    title: data.title ?? "Untitled",
    authors: authorNames,
    description,
    cover_url: getCoverUrl(coverId, undefined),
    isbn: null,
    page_count: null,
    categories: data.subjects?.slice(0, 5) ?? [],
    published_date: null,
  };
}
