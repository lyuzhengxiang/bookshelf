"use client";

import { useState } from "react";

interface RatingStarsProps {
  rating: number | null;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export function RatingStars({
  rating,
  onRate,
  readonly = false,
}: RatingStarsProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-lg ${readonly ? "cursor-default" : "cursor-pointer"} ${
            star <= (hover || rating || 0)
              ? "text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
