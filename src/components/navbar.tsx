import Link from "next/link";
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="border-b-4 border-black bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-2xl font-bold uppercase tracking-widest">
          BOOKSHELF
        </Link>

        <Show when="signed-in">
          <div className="flex items-center gap-1">
            {[
              { href: "/feed", label: "FEED" },
              { href: "/search", label: "SEARCH" },
              { href: "/shelves", label: "SHELVES" },
              { href: "/recommendations", label: "RECS" },
              { href: "/discover", label: "PEOPLE" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="ml-3">
              <UserButton />
            </div>
          </div>
        </Show>

        <Show when="signed-out">
          <div className="flex items-center gap-2">
            <SignInButton>
              <button className="border-2 border-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="bg-black text-white border-2 border-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
                Sign up
              </button>
            </SignUpButton>
          </div>
        </Show>
      </nav>
    </header>
  );
}
