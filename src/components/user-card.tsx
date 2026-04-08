import Link from "next/link";
import Image from "next/image";
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
    <div className="border-3 border-black flex items-center gap-4 p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      <Link href={`/profile/${username}`}>
        <div className="relative h-12 w-12 overflow-hidden border-2 border-black">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black text-white font-bold text-lg">
              {displayName[0]}
            </div>
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${username}`}
          className="font-bold text-sm uppercase tracking-wider hover:underline"
        >
          {displayName}
        </Link>
        <p className="text-[10px] text-gray-500 uppercase">@{username}</p>
        {bio && <p className="mt-1 text-xs line-clamp-1">{bio}</p>}
      </div>
      {showFollowButton && (
        <FollowButton targetUserId={id} isFollowing={isFollowing} />
      )}
    </div>
  );
}
