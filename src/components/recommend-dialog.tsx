"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendRecommendation } from "@/actions/recommendation-actions";
import type { GoogleBookResult } from "@/lib/books/google-books";
import type { DbUser } from "@/lib/supabase/types";

interface RecommendDialogProps {
  bookData: GoogleBookResult;
  following: DbUser[];
}

export function RecommendDialog({ bookData, following }: RecommendDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    if (!selectedUserId) return;
    startTransition(async () => {
      await sendRecommendation(selectedUserId, bookData, message || undefined);
      setOpen(false);
      setMessage("");
      setSelectedUserId("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Recommend
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Recommend &ldquo;{bookData.title}&rdquo;
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Send to</label>
            <select
              className="mt-1 w-full rounded-md border p-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select a user...</option>
              {following.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name} (@{user.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Message (optional)</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="You'd love this book!"
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={isPending || !selectedUserId}
            className="w-full"
          >
            {isPending ? "Sending..." : "Send Recommendation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
