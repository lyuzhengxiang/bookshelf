"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";

interface BookSearchInputProps {
  onSearch: (query: string) => void;
}

export function BookSearchInput({ onSearch }: BookSearchInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim()) {
        onSearch(value.trim());
      }
    },
    [value, onSearch],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Input
        type="search"
        placeholder="Search for books..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full"
      />
    </form>
  );
}
