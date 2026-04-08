import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Bookshelf
        </Link>

        <SignedIn>
          <div className="flex items-center gap-6">
            <Link
              href="/feed"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Feed
            </Link>
            <Link
              href="/search"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Search
            </Link>
            <Link
              href="/shelves"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              My Shelves
            </Link>
            <Link
              href="/recommendations"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Recs
            </Link>
            <Link
              href="/discover"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Discover
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </SignedOut>
      </nav>
    </header>
  );
}
