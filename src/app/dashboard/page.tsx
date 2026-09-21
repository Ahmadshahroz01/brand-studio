import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // middleware guards this route

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) redirect("/onboarding");

  const posts = await db.post.findMany({
    where: { userId: session.user.id },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Content queue</h1>
        <a
          href="/onboarding"
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          Edit brand profile
        </a>
      </div>
      <Dashboard initialPosts={posts} availableContentTypes={brandProfile.contentTypes} />
    </main>
  );
}
