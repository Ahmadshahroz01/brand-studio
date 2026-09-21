import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage() {
  const session = await getSession();
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
        <h1 className="text-2xl leading-8 tracking-tight text-on-surface">Content queue</h1>
        <a
          href="/onboarding"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/8"
        >
          Edit brand profile
        </a>
      </div>
      <Dashboard initialPosts={posts} availableContentTypes={brandProfile.contentTypes} />
    </main>
  );
}
