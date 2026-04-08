import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "@/components/follow-button";
import { BookCard } from "@/components/book-card";
import { EditBio } from "@/components/edit-bio";
import { getUserByClerkId, getUserByUsername } from "@/queries/user-queries";
import { getUserBooks, getUserBookCounts } from "@/queries/shelf-queries";
import {
  isFollowing,
  getFollowerCount,
  getFollowingCount,
} from "@/queries/follow-queries";
import type { BookStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profileUser = await getUserByUsername(username);
  if (!profileUser) notFound();

  const { userId: clerkId } = await auth();
  let currentUser = null;
  let following = false;
  let isOwnProfile = false;

  if (clerkId) {
    currentUser = await getUserByClerkId(clerkId);
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

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profileUser.avatar_url} />
          <AvatarFallback className="text-2xl">
            {profileUser.display_name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {profileUser.display_name}
            </h1>
            {currentUser && !isOwnProfile && (
              <FollowButton
                targetUserId={profileUser.id}
                isFollowing={following}
              />
            )}
          </div>
          <p className="text-muted-foreground">@{profileUser.username}</p>

          <div className="mt-2">
            {isOwnProfile ? (
              <EditBio currentBio={profileUser.bio} />
            ) : (
              profileUser.bio && (
                <p className="text-muted-foreground">{profileUser.bio}</p>
              )
            )}
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <span>
              <strong>{followerCount}</strong> followers
            </span>
            <span>
              <strong>{followingCount}</strong> following
            </span>
            <span>
              <strong>{bookCounts.read}</strong> books read
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Shelves */}
      <Tabs defaultValue="want_to_read">
        <TabsList>
          {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
            <TabsTrigger key={status} value={status}>
              {STATUS_LABELS[status]} ({bookCounts[status]})
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
          <TabsContent key={status} value={status}>
            <div className="grid gap-4 sm:grid-cols-2">
              {userBooks
                .filter((ub) => ub.status === status)
                .map((ub) => (
                  <BookCard
                    key={ub.id}
                    googleBooksId={ub.books.google_books_id}
                    title={ub.books.title}
                    authors={ub.books.authors}
                    coverUrl={ub.books.cover_url}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
