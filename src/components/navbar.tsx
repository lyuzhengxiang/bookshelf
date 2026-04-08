import Link from "next/link";
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Bookshelf
        </Link>

        <Show when="signed-in">
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
            <UserButton />
          </div>
        </Show>

        <Show when="signed-out">
          <div className="flex items-center gap-2">
            <SignInButton>
              <Button variant="ghost">Sign in</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Sign up</Button>
            </SignUpButton>
          </div>
        </Show>
      </nav>
    </header>
  );
}
