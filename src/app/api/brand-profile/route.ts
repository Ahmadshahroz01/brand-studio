import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
    include: { topPosts: true },
  });
  const referenceAccounts = await db.referenceAccount.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ brandProfile, referenceAccounts });
}

const industryEnum = z.enum([
  "TECHNOLOGY",
  "MARKETING",
  "DESIGN_CREATIVE",
  "FINANCE",
  "HEALTHCARE",
  "EDUCATION",
  "CONSULTING",
  "SALES",
  "HR_RECRUITING",
  "OTHER",
]);

const contentTypeEnum = z.enum([
  "THOUGHT_LEADERSHIP",
  "INSTRUCTIONAL",
  "CHEAT_SHEET",
  "PERSONAL_STORY",
]);

const putSchema = z.object({
  linkedinProfileUrl: z.string().url().optional().or(z.literal("")),
  toneOfVoice: z.string().min(10),
  industry: industryEnum,
  contentTypes: z.array(contentTypeEnum).min(1),
  topPosts: z
    .array(
      z.object({
        content: z.string().min(1),
        impressions: z.number().int().nonnegative().optional(),
      }),
    )
    .max(10),
  referenceAccounts: z
    .array(
      z.object({
        name: z.string().min(1),
        profileUrl: z.string().url().optional().or(z.literal("")),
        notes: z.string().optional(),
      }),
    )
    .max(20),
});

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { linkedinProfileUrl, toneOfVoice, industry, contentTypes, topPosts, referenceAccounts } =
    parsed.data;
  const userId = session.user.id;

  const brandProfile = await db.$transaction(async (tx) => {
    const profile = await tx.brandProfile.upsert({
      where: { userId },
      create: {
        userId,
        linkedinProfileUrl: linkedinProfileUrl || null,
        toneOfVoice,
        industry,
        contentTypes,
      },
      update: {
        linkedinProfileUrl: linkedinProfileUrl || null,
        toneOfVoice,
        industry,
        contentTypes,
      },
    });

    await tx.topPost.deleteMany({ where: { brandProfileId: profile.id } });
    if (topPosts.length) {
      await tx.topPost.createMany({
        data: topPosts.map((p) => ({
          brandProfileId: profile.id,
          content: p.content,
          impressions: p.impressions ?? null,
        })),
      });
    }

    await tx.referenceAccount.deleteMany({ where: { userId } });
    if (referenceAccounts.length) {
      await tx.referenceAccount.createMany({
        data: referenceAccounts.map((r) => ({
          userId,
          name: r.name,
          profileUrl: r.profileUrl || null,
          notes: r.notes || null,
        })),
      });
    }

    return profile;
  });

  return NextResponse.json({ brandProfile });
}
