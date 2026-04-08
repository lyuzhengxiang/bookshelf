"use client";

import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { BookStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
};

interface ShelfSelectorProps {
  currentStatus?: BookStatus;
  onSelect: (status: BookStatus) => Promise<void>;
}

export function ShelfSelector({ currentStatus, onSelect }: ShelfSelectorProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={isPending} />}
      >
        {isPending
          ? "..."
          : currentStatus
            ? STATUS_LABELS[currentStatus]
            : "Add to Shelf"}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(Object.keys(STATUS_LABELS) as BookStatus[]).map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => startTransition(() => onSelect(status))}
          >
            {STATUS_LABELS[status]}
            {status === currentStatus && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
