import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCurrentUser, getAllUsers } from "@/queries/user-queries";
import { getFollowing } from "@/queries/follow-queries";
import { UserCard } from "@/components/user-card";

export default async function DiscoverPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const currentUser = await getOrCreateCurrentUser(clerkId);
  if (!currentUser) redirect("/sign-in");

  const [allUsers, followingList] = await Promise.all([
    getAllUsers(),
    getFollowing(currentUser.id),
  ]);

  const followingIds = new Set(followingList.map((u) => u.id));
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);

  const usersWithFollowStatus = otherUsers.map((u) => ({
    ...u,
    isFollowing: followingIds.has(u.id),
  }));

  return (
    <div>
      <h1 className="mb-8 text-4xl font-bold uppercase tracking-tighter">
        Discover People
      </h1>

      {usersWithFollowStatus.length === 0 ? (
        <div className="border-4 border-dashed border-gray-300 py-20 text-center">
          <p className="text-sm uppercase tracking-widest text-gray-400">
            No other users yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {usersWithFollowStatus.map((user) => (
            <UserCard
              key={user.id}
              id={user.id}
              username={user.username}
              displayName={user.display_name}
              avatarUrl={user.avatar_url}
              bio={user.bio}
              isFollowing={user.isFollowing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
