import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface BookCardProps {
  googleBooksId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
}

export function BookCard({
  googleBooksId,
  title,
  authors,
  coverUrl,
}: BookCardProps) {
  return (
    <Link href={`/book/${googleBooksId}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex gap-4 p-4">
          <div className="relative h-32 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No cover
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-semibold group-hover:underline">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {authors.length > 0 ? authors.join(", ") : "Unknown author"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
