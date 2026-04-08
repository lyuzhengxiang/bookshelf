import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOOKSHELF",
  description: "A social reading tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${spaceMono.variable} h-full`}>
        <body className="min-h-full flex flex-col font-mono bg-white text-black">
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
