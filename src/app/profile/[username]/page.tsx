import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { FollowButton } from "@/components/follow-button";
import { BookCard } from "@/components/book-card";
import { EditBio } from "@/components/edit-bio";
import { getOrCreateCurrentUser, getUserByUsername } from "@/queries/user-queries";
import { getUserBooks, getUserBookCounts } from "@/queries/shelf-queries";
import {
  isFollowing,
  getFollowerCount,
  getFollowingCount,
} from "@/queries/follow-queries";
import type { BookStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "WANT TO READ",
  reading: "READING",
  read: "READ",
};

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ shelf?: string }>;
}) {
  const { username } = await params;
  const profileUser = await getUserByUsername(username);
  if (!profileUser) notFound();

  const { userId: clerkId } = await auth();
  let currentUser = null;
  let following = false;
  let isOwnProfile = false;

  if (clerkId) {
    currentUser = await getOrCreateCurrentUser(clerkId);
    if (currentUser) {
      isOwnProfile = currentUser.id === profileUser.id;
      if (!isOwnProfile) {
        following = await isFollowing(currentUser.id, profileUser.id);
      }
    }
  }

  const [userBooks, followerCount, followingCount, bookCounts] =
    await Promise.all([
      getUserBooks(profileUser.id),
      getFollowerCount(profileUser.id),
      getFollowingCount(profileUser.id),
      getUserBookCounts(profileUser.id),
    ]);

  const { shelf: activeShelf } = await searchParams;
  const currentStatus = (activeShelf as BookStatus) || "want_to_read";
  const filteredBooks = userBooks.filter((ub) => ub.status === currentStatus);

  return (
    <div>
      {/* Profile header */}
      <div className="border-4 border-black p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border-3 border-black">
            {profileUser.avatar_url ? (
              <Image
                src={profileUser.avatar_url}
                alt={profileUser.display_name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-black text-white text-2xl font-bold">
                {profileUser.display_name[0]}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold uppercase tracking-tighter">
                {profileUser.display_name}
              </h1>
              {currentUser && !isOwnProfile && (
                <FollowButton
                  targetUserId={profileUser.id}
                  isFollowing={following}
                />
              )}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              @{profileUser.username}
            </p>

            <div className="mt-2">
              {isOwnProfile ? (
                <EditBio currentBio={profileUser.bio} />
              ) : (
                profileUser.bio && (
                  <p className="text-sm">{profileUser.bio}</p>
                )
              )}
            </div>

            <div className="mt-4 flex gap-6 text-xs font-bold uppercase tracking-wider">
              <span>{followerCount} FOLLOWERS</span>
              <span>{followingCount} FOLLOWING</span>
              <span>{bookCounts.read} READ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shelf tabs */}
      <div className="flex gap-0 mb-6">
        {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status, i) => (
          <a
            key={status}
            href={`/profile/${username}?shelf=${status}`}
            className={`border-3 border-black px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              currentStatus === status
                ? "bg-black text-white"
                : "hover:bg-black hover:text-white"
            } ${i > 0 ? "-ml-[3px]" : ""}`}
          >
            {STATUS_LABELS[status]} ({bookCounts[status]})
          </a>
        ))}
      </div>

      {/* Book grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {filteredBooks.map((ub) => (
          <BookCard
            key={ub.id}
            googleBooksId={ub.books.google_books_id}
            title={ub.books.title}
            authors={ub.books.authors}
            coverUrl={ub.books.cover_url}
          />
        ))}
      </div>
    </div>
  );
}
