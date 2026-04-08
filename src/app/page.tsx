import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/feed");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Track what you read.
        <br />
        <span className="text-muted-foreground">Share what you love.</span>
      </h1>
      <p className="mt-6 max-w-lg text-lg text-muted-foreground">
        Organize your books into shelves, follow friends, and discover your next
        great read.
      </p>
      <div className="mt-10 flex gap-4">
        <Button size="lg" render={<Link href="/sign-up" />}>
          Get Started
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/sign-in" />}>
          Sign In
        </Button>
      </div>
    </div>
  );
}
