import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePostDrafts } from "@/lib/anthropic";

const bodySchema = z.object({
  topic: z.string().min(3).max(500),
  contentType: z.enum([
    "THOUGHT_LEADERSHIP",
    "INSTRUCTIONAL",
    "CHEAT_SHEET",
    "PERSONAL_STORY",
  ]),
  variantCount: z.number().int().min(1).max(3).default(2),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
    include: { topPosts: true },
  });

  if (!brandProfile) {
    return NextResponse.json(
      { error: "Complete onboarding before generating content." },
      { status: 412 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const variants = await generatePostDrafts({
      brandProfile,
      contentType: parsed.data.contentType,
      topic: parsed.data.topic,
      variantCount: parsed.data.variantCount,
    });

    return NextResponse.json({ variants });
  } catch (err) {
    console.error("generate error", err);
    return NextResponse.json({ error: "Generation failed." }, { status: 502 });
  }
}
