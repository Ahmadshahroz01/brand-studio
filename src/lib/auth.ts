import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Google],
  session: { strategy: "database" },
  pages: {
    signIn: "/",
  },
});

// Testing-only bypass. Skips real sign-in and auto-provisions a fixed test
// user so the app is reachable before Google OAuth / a real database is
// wired up. Gated on an env var so it can never activate unless someone
// explicitly sets DEV_BYPASS_AUTH=true. Remove this, and every call site
// that uses it, before onboarding anyone but yourself.
const DEV_BYPASS_USER_ID = "dev-test-user";

export async function getSession() {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    const user = await db.user.upsert({
      where: { id: DEV_BYPASS_USER_ID },
      update: {},
      create: {
        id: DEV_BYPASS_USER_ID,
        name: "Test User",
        email: "dev-test-user@localhost.test",
      },
    });
    return { user: { id: user.id, name: user.name, email: user.email } };
  }
  return auth();
}
