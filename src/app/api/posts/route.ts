import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await db.post.findMany({
    where: { userId: session.user.id },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ posts });
}

const createSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum([
    "THOUGHT_LEADERSHIP",
    "INSTRUCTIONAL",
    "CHEAT_SHEET",
    "PERSONAL_STORY",
  ]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await db.post.create({
    data: {
      userId: session.user.id,
      content: parsed.data.content,
      contentType: parsed.data.contentType,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
