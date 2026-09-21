import Anthropic from "@anthropic-ai/sdk";
import type { BrandProfile, ContentType, TopPost } from "@prisma/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_TYPE_GUIDANCE: Record<ContentType, string> = {
  THOUGHT_LEADERSHIP:
    "a thought-leadership post: a strong opinion or prediction about the industry, backed by one concrete piece of reasoning or evidence.",
  INSTRUCTIONAL:
    "an instructional post: a step-by-step breakdown of how to do something, specific enough that someone could act on it immediately.",
  CHEAT_SHEET:
    "a cheat-sheet post: a scannable, listicle-style breakdown (numbered or bulleted) that works as a reference someone would save.",
  PERSONAL_STORY:
    "a personal story post: a specific moment or experience with a clear beginning, tension, and a lesson, told in first person.",
};

export async function generatePostDrafts(params: {
  brandProfile: BrandProfile & { topPosts: TopPost[] };
  contentType: ContentType;
  topic: string;
  variantCount: number;
}) {
  const { brandProfile, contentType, topic, variantCount } = params;

  const topPostsBlock = brandProfile.topPosts.length
    ? brandProfile.topPosts
        .map(
          (p, i) =>
            `Example ${i + 1}${p.impressions ? ` (${p.impressions} impressions)` : ""}:\n${p.content}`,
        )
        .join("\n\n")
    : "No past posts provided.";

  const system = `You write LinkedIn posts for a real person's personal brand. Match their tone of voice exactly, using their past high-performing posts as the style reference. Never use em dashes. Never use generic LinkedIn cliches like "I'm excited to announce" or "Let's dive in". Write like a specific person, not a brand account. Output only the post text, no preamble, no explanation, no markdown formatting.`;

  const user = `TONE OF VOICE (the user's own description):\n${brandProfile.toneOfVoice}\n\nINDUSTRY: ${brandProfile.industry}\n\nPAST HIGH-PERFORMING POSTS (style reference):\n${topPostsBlock}\n\nTASK: Write ${CONTENT_TYPE_GUIDANCE[contentType]}\n\nTOPIC: ${topic}\n\nWrite ${variantCount} distinct variant(s), separated by the exact delimiter "---VARIANT---" between each one. Each variant should take a different angle on the same topic, not just reworded sentences.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return text
    .split("---VARIANT---")
    .map((v) => v.trim())
    .filter(Boolean);
}
