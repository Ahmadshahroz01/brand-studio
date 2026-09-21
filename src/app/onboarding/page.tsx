import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // middleware guards this route

  const [brandProfile, referenceAccounts] = await Promise.all([
    db.brandProfile.findUnique({
      where: { userId: session.user.id },
      include: { topPosts: true },
    }),
    db.referenceAccount.findMany({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl leading-8 tracking-tight text-on-surface">
        Set up your brand profile
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        This is what every generated draft is built from. Better input here means
        less editing later.
      </p>
      <OnboardingForm
        initialBrandProfile={brandProfile}
        initialReferenceAccounts={referenceAccounts}
      />
    </main>
  );
}
