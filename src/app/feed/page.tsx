import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/queries/user-queries";
import { getFeed } from "@/queries/feed-queries";
import { FeedItem } from "@/components/feed-item";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const items = await getFeed(user.id, page);

  return (
    <div>
      <h1 className="mb-8 text-4xl font-bold uppercase tracking-tighter">
        Feed
      </h1>

      {items.length === 0 ? (
        <div className="border-4 border-dashed border-gray-300 py-20 text-center">
          <p className="text-sm uppercase tracking-widest text-gray-400">
            {page === 1
              ? "Nothing here yet. Follow people to see activity."
              : "No more activity."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 py-8">
        {page > 1 && (
          <a
            href={`/feed?page=${page - 1}`}
            className="border-3 border-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
          >
            Prev
          </a>
        )}
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Page {page}
        </span>
        {items.length === 20 && (
          <a
            href={`/feed?page=${page + 1}`}
            className="border-3 border-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
          >
            Next
          </a>
        )}
      </div>
    </div>
  );
}
