import { NextRequest, NextResponse } from "next/server";

const SUBJECTS = [
  "fiction",
  "fantasy",
  "science_fiction",
  "romance",
  "mystery",
  "thriller",
  "history",
  "biography",
  "philosophy",
  "psychology",
  "poetry",
  "art",
  "science",
  "adventure",
  "horror",
  "classic",
  "humor",
  "travel",
  "cooking",
  "music",
];

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10);
  const limit = 20;
  const offset = page * limit;

  // Cycle through subjects as pages increase
  const subjectIndex = page % SUBJECTS.length;
  const subject = SUBJECTS[subjectIndex];

  try {
    const res = await fetch(
      `https://openlibrary.org/subjects/${subject}.json?limit=${limit}&offset=${offset > 60 ? 0 : offset}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return NextResponse.json({ books: [], subject }, { status: 200 });
    }

    const data = await res.json();
    const books = (data.works ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (work: any) => ({
        key: work.key?.replace("/works/", "") ?? "",
        title: work.title ?? "Untitled",
        authors: work.authors?.map((a: { name: string }) => a.name) ?? [],
        cover_id: work.cover_id ?? null,
        cover_url: work.cover_id
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : null,
      }),
    );

    return NextResponse.json({
      books,
      subject: subject.replace(/_/g, " "),
      hasMore: books.length === limit,
    });
  } catch {
    return NextResponse.json({ books: [], subject, hasMore: false });
  }
}
