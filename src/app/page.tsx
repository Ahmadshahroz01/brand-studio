import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignInButton } from "@/components/SignInButton";

export default async function Home() {
  const session = await getSession();

  if (session?.user?.id) {
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });
    redirect(brandProfile ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl leading-8 tracking-tight text-on-surface">Brand Studio</h1>
        <p className="mt-2 text-sm leading-5 text-on-surface-variant">
          Strategy, tone of voice, and drafting for a personal LinkedIn presence.
        </p>
        <div className="mt-8">
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
