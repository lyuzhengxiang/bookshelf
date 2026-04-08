import Image from "next/image";
import Link from "next/link";

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
    <Link href={`/book/${googleBooksId}`} className="group block">
      <div className="border-3 border-black overflow-hidden hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
        <div className="relative aspect-[2/3] w-full bg-gray-100">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-black text-white p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-center">
                {title}
              </span>
            </div>
          )}
        </div>
        <div className="border-t-3 border-black p-3 bg-white">
          <h3 className="font-bold text-sm uppercase tracking-tight line-clamp-1 group-hover:underline">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 uppercase tracking-wider line-clamp-1">
            {authors.length > 0 ? authors.join(", ") : "Unknown"}
          </p>
        </div>
      </div>
    </Link>
  );
}
