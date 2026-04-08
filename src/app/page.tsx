import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUpButton, SignInButton } from "@clerk/nextjs";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/feed");

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-7xl font-bold uppercase tracking-tighter text-center leading-none">
        TRACK
        <br />
        WHAT YOU
        <br />
        <span className="bg-black text-white px-4 inline-block mt-2">READ.</span>
      </h1>
      <p className="mt-8 max-w-md text-center text-sm uppercase tracking-wider text-gray-500">
        Organize books into shelves. Follow friends. Discover your next great read.
      </p>
      <div className="mt-12 flex gap-4">
        <SignUpButton>
          <button className="bg-black text-white border-4 border-black px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
            Get Started
          </button>
        </SignUpButton>
        <SignInButton>
          <button className="border-4 border-black px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
