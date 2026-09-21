import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  reminderLeadMinutes: z.number().int().min(0).nullable().optional(),
  markPosted: z.boolean().optional(),
});

async function assertOwnedPost(userId: string, postId: string) {
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post || post.userId !== userId) return null;
  return post;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await assertOwnedPost(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { content, scheduledAt, reminderLeadMinutes, markPosted } = parsed.data;

  const post = await db.post.update({
    where: { id },
    data: {
      ...(content !== undefined ? { content } : {}),
      ...(scheduledAt !== undefined
        ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
        : {}),
      ...(reminderLeadMinutes !== undefined ? { reminderLeadMinutes } : {}),
      // Marking Posted is a one-way, timestamped action, not gated on scheduledAt having passed.
      ...(markPosted ? { status: "POSTED", postedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await assertOwnedPost(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
