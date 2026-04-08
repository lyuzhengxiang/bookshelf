"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBio } from "@/actions/profile-actions";

export function EditBio({ currentBio }: { currentBio: string | null }) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(currentBio ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateBio(bio);
      setEditing(false);
    });
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-muted-foreground">{currentBio || "No bio yet."}</p>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Tell people about yourself..."
        className="max-w-sm"
      />
      <Button size="sm" onClick={handleSave} disabled={isPending}>
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  );
}
