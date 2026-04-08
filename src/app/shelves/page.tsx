import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/queries/user-queries";
import { getUserBooks } from "@/queries/shelf-queries";
import { ShelfBookCard } from "@/components/shelf-book-card";
import type { BookStatus } from "@/lib/supabase/types";

const SHELVES: { status: BookStatus; label: string }[] = [
  { status: "want_to_read", label: "WANT TO READ" },
  { status: "reading", label: "READING" },
  { status: "read", label: "READ" },
];

export default async function ShelvesPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const allBooks = await getUserBooks(user.id);
  const { shelf: activeShelf } = await searchParams;
  const currentStatus = (activeShelf as BookStatus) || "want_to_read";
  const filteredBooks = allBooks.filter((ub) => ub.status === currentStatus);

  return (
    <div>
      <h1 className="mb-8 text-4xl font-bold uppercase tracking-tighter">
        My Shelves
      </h1>

      <div className="flex gap-0 mb-8">
        {SHELVES.map((shelf) => {
          const count = allBooks.filter((b) => b.status === shelf.status).length;
          return (
            <a
              key={shelf.status}
              href={`/shelves?shelf=${shelf.status}`}
              className={`border-3 border-black px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                currentStatus === shelf.status
                  ? "bg-black text-white"
                  : "hover:bg-black hover:text-white"
              } ${shelf.status !== "want_to_read" ? "-ml-[3px]" : ""}`}
            >
              {shelf.label} ({count})
            </a>
          );
        })}
      </div>

      {filteredBooks.length === 0 ? (
        <p className="py-12 text-center text-sm uppercase tracking-widest text-gray-400">
          No books yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBooks.map((ub) => (
            <ShelfBookCard key={ub.id} userBook={ub} />
          ))}
        </div>
      )}
    </div>
  );
}
