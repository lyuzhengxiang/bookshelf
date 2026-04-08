import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/queries/user-queries";
import { getFeed } from "@/queries/feed-queries";
import { FeedItem } from "@/components/feed-item";
import { Pagination } from "@/components/pagination";

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
      <h1 className="mb-6 text-2xl font-bold">Feed</h1>

      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {page === 1
            ? "Nothing here yet. Follow some people to see their activity!"
            : "No more activity."}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        hasMore={items.length === 20}
        basePath="/feed"
      />
    </div>
  );
}
