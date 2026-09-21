import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

// M3's default typeface. See https://m3.material.io/styles/typography/type-scale-tokens
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Brand Studio",
  description: "Strategy, tone, and drafting for a consistent LinkedIn presence.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-on-surface">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
