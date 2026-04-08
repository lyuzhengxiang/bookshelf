import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserByClerkId } from "@/queries/user-queries";
import { getUserBooksByStatus } from "@/queries/shelf-queries";
import { ShelfBookCard } from "@/components/shelf-book-card";
import type { BookStatus } from "@/lib/supabase/types";

const SHELVES: { status: BookStatus; label: string }[] = [
  { status: "want_to_read", label: "Want to Read" },
  { status: "reading", label: "Reading" },
  { status: "read", label: "Read" },
];

export default async function ShelvesPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const shelves = await Promise.all(
    SHELVES.map(async (shelf) => ({
      ...shelf,
      books: await getUserBooksByStatus(user.id, shelf.status),
    })),
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Shelves</h1>

      <Tabs defaultValue="want_to_read">
        <TabsList>
          {shelves.map((shelf) => (
            <TabsTrigger key={shelf.status} value={shelf.status}>
              {shelf.label} ({shelf.books.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {shelves.map((shelf) => (
          <TabsContent key={shelf.status} value={shelf.status}>
            {shelf.books.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No books yet.
              </p>
            ) : (
              <div className="space-y-3">
                {shelf.books.map((ub) => (
                  <ShelfBookCard key={ub.id} userBook={ub} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
