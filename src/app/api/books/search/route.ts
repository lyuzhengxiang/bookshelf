import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/books/google-books";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchBooks(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Book search error:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 },
    );
  }
}
