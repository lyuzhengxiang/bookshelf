"use client";

import { useTransition } from "react";
import { followUser, unfollowUser } from "@/actions/follow-actions";

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
}

export function FollowButton({ targetUserId, isFollowing }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        isFollowing
          ? "bg-black text-white hover:bg-white hover:text-black"
          : "hover:bg-black hover:text-white"
      } disabled:opacity-30`}
    >
      {isPending ? "..." : isFollowing ? "UNFOLLOW" : "FOLLOW"}
    </button>
  );
}
