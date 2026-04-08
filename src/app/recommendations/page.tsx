import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookCard } from "@/components/book-card";
import { getUserByClerkId } from "@/queries/user-queries";
import {
  getIncomingRecommendations,
  getOutgoingRecommendations,
} from "@/queries/recommendation-queries";

export default async function RecommendationsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const [incoming, outgoing] = await Promise.all([
    getIncomingRecommendations(user.id),
    getOutgoingRecommendations(user.id),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Recommendations</h1>

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">
            Incoming ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">Sent ({outgoing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          {incoming.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No recommendations yet.
            </p>
          ) : (
            <div className="space-y-4">
              {incoming.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Link href={`/profile/${rec.from_user.username}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rec.from_user.avatar_url} />
                          <AvatarFallback>
                            {rec.from_user.display_name[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <span className="text-sm">
                        <Link
                          href={`/profile/${rec.from_user.username}`}
                          className="font-medium hover:underline"
                        >
                          {rec.from_user.display_name}
                        </Link>
                        {" recommended"}
                      </span>
                    </div>
                    <BookCard
                      googleBooksId={rec.books.google_books_id}
                      title={rec.books.title}
                      authors={rec.books.authors}
                      coverUrl={rec.books.cover_url}
                    />
                    {rec.message && (
                      <p className="mt-3 text-sm italic text-muted-foreground">
                        &ldquo;{rec.message}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing">
          {outgoing.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              You haven&apos;t sent any recommendations yet.
            </p>
          ) : (
            <div className="space-y-4">
              {outgoing.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 text-sm">
                      Sent to{" "}
                      <Link
                        href={`/profile/${rec.to_user.username}`}
                        className="font-medium hover:underline"
                      >
                        {rec.to_user.display_name}
                      </Link>
                    </div>
                    <BookCard
                      googleBooksId={rec.books.google_books_id}
                      title={rec.books.title}
                      authors={rec.books.authors}
                      coverUrl={rec.books.cover_url}
                    />
                    {rec.message && (
                      <p className="mt-3 text-sm italic text-muted-foreground">
                        &ldquo;{rec.message}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
