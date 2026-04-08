import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  basePath: string;
}

export function Pagination({ currentPage, hasMore, basePath }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      {currentPage > 1 && (
        <Button
          variant="outline"
          render={<Link href={`${basePath}?page=${currentPage - 1}`} />}
        >
          Previous
        </Button>
      )}
      <span className="text-sm text-muted-foreground">Page {currentPage}</span>
      {hasMore && (
        <Button
          variant="outline"
          render={<Link href={`${basePath}?page=${currentPage + 1}`} />}
        >
          Next
        </Button>
      )}
    </div>
  );
}
