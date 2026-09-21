import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignInButton } from "@/components/SignInButton";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });
    redirect(brandProfile ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Brand Studio</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Strategy, tone of voice, and drafting for a personal LinkedIn presence.
        </p>
        <div className="mt-8">
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
