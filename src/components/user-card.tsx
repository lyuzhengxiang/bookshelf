import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/follow-button";

interface UserCardProps {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string | null;
  isFollowing: boolean;
  showFollowButton?: boolean;
}

export function UserCard({
  id,
  username,
  displayName,
  avatarUrl,
  bio,
  isFollowing,
  showFollowButton = true,
}: UserCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Link href={`/profile/${username}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${username}`}
            className="font-medium hover:underline"
          >
            {displayName}
          </Link>
          <p className="text-sm text-muted-foreground">@{username}</p>
          {bio && <p className="mt-1 line-clamp-1 text-sm">{bio}</p>}
        </div>
        {showFollowButton && (
          <FollowButton targetUserId={id} isFollowing={isFollowing} />
        )}
      </CardContent>
    </Card>
  );
}
