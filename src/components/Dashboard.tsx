"use client";

import { useState } from "react";
import type { Post } from "@prisma/client";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  THOUGHT_LEADERSHIP: "Thought leadership",
  INSTRUCTIONAL: "Instructional",
  CHEAT_SHEET: "Cheat sheet",
  PERSONAL_STORY: "Personal story",
};

const REMINDER_OPTIONS = [
  ["", "No reminder"],
  ["15", "15 minutes before"],
  ["60", "1 hour before"],
  ["1440", "1 day before"],
] as const;

const fieldClass =
  "rounded-xs border border-outline-variant bg-transparent px-2.5 py-1.5 text-xs text-on-surface focus:border-2 focus:border-primary focus:outline-none";

function isOverdue(post: Post) {
  return (
    post.status === "DRAFT" &&
    post.scheduledAt &&
    new Date(post.scheduledAt).getTime() < Date.now()
  );
}

function toDatetimeLocalValue(date: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function Dashboard({
  initialPosts,
  availableContentTypes,
}: {
  initialPosts: Post[];
  availableContentTypes: string[];
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [showGenerate, setShowGenerate] = useState(false);
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState(availableContentTypes[0] ?? "THOUGHT_LEADERSHIP");
  const [variantCount, setVariantCount] = useState(2);
  const [variants, setVariants] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const drafts = posts.filter((p) => p.status === "DRAFT");
  const published = posts.filter((p) => p.status === "POSTED");

  async function generate() {
    setGenerating(true);
    setGenError(null);
    setVariants([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, contentType, variantCount }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.toString() ?? "Generation failed");
      setVariants(body.variants);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft(content: string) {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, contentType }),
    });
    const body = await res.json();
    if (res.ok) {
      setPosts((prev) => [body.post, ...prev]);
      setVariants((prev) => prev.filter((v) => v !== content));
    }
  }

  async function patchPost(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = await res.json();
    if (res.ok) {
      setPosts((prev) => prev.map((p) => (p.id === id ? body.post : p)));
    }
  }

  async function deletePost(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function copy(post: Post) {
    navigator.clipboard.writeText(post.content);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setShowGenerate(true)}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition hover:brightness-95"
      >
        Generate content
      </button>

      {showGenerate && (
        <div className="mt-4 rounded-md border border-outline-variant bg-surface-container-low p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="rounded-xs border border-outline bg-transparent p-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-2 focus:border-primary focus:outline-none"
              placeholder="Topic, e.g. 'why most onboarding flows fail'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <select
              className="rounded-xs border border-outline bg-surface-container-low p-2.5 text-sm text-on-surface focus:border-2 focus:border-primary focus:outline-none"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              {(availableContentTypes.length ? availableContentTypes : Object.keys(CONTENT_TYPE_LABELS)).map(
                (ct) => (
                  <option key={ct} value={ct}>
                    {CONTENT_TYPE_LABELS[ct]}
                  </option>
                ),
              )}
            </select>
            <select
              className="rounded-xs border border-outline bg-surface-container-low p-2.5 text-sm text-on-surface focus:border-2 focus:border-primary focus:outline-none"
              value={variantCount}
              onChange={(e) => setVariantCount(Number(e.target.value))}
            >
              <option value={1}>1 variant</option>
              <option value={2}>2 variants</option>
              <option value={3}>3 variants</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={generate}
              disabled={generating || topic.trim().length < 3}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary transition hover:brightness-95 disabled:opacity-40"
            >
              {generating ? "Writing..." : "Write drafts"}
            </button>
            <button
              onClick={() => {
                setShowGenerate(false);
                setVariants([]);
                setGenError(null);
              }}
              className="rounded-full px-5 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
            >
              Close
            </button>
          </div>
          {genError && <p className="mt-3 text-sm text-error">{genError}</p>}

          {variants.length > 0 && (
            <div className="mt-5 space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="rounded-md border border-outline-variant bg-surface-container-lowest p-3">
                  <p className="whitespace-pre-wrap text-sm text-on-surface">{v}</p>
                  <button
                    onClick={() => saveDraft(v)}
                    className="mt-3 rounded-full bg-secondary-container px-3 py-1.5 text-xs font-medium text-on-secondary-container hover:brightness-95"
                  >
                    Save to queue
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-medium tracking-wide text-on-surface-variant uppercase">
          Queue ({drafts.length})
        </h2>
        <div className="mt-3 space-y-3">
          {drafts.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No drafts yet. Generate your first one above.
            </p>
          )}
          {drafts.map((post) => (
            <div
              key={post.id}
              className={`rounded-md border p-4 ${
                isOverdue(post)
                  ? "border-error/40 bg-error-container/40"
                  : "border-outline-variant bg-surface-container-low"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
                  {CONTENT_TYPE_LABELS[post.contentType]}
                </span>
                {isOverdue(post) && (
                  <span className="text-xs font-medium text-error">
                    Overdue, not marked posted
                  </span>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-on-surface">{post.content}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  className={fieldClass}
                  value={toDatetimeLocalValue(post.scheduledAt)}
                  onChange={(e) =>
                    patchPost(post.id, {
                      scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
                <select
                  className={fieldClass}
                  value={post.reminderLeadMinutes ?? ""}
                  onChange={(e) =>
                    patchPost(post.id, {
                      reminderLeadMinutes: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  {REMINDER_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => copy(post)}
                    className="rounded-full border border-outline px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/8"
                  >
                    {copiedId === post.id ? "Copied" : "Copy to clipboard"}
                  </button>
                  <button
                    onClick={() => patchPost(post.id, { markPosted: true })}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:brightness-95"
                  >
                    Mark as posted
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="rounded-full px-2 py-1.5 text-xs font-medium text-on-surface-variant hover:text-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {published.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium tracking-wide text-on-surface-variant uppercase">
            Posted ({published.length})
          </h2>
          <div className="mt-3 space-y-2">
            {published.map((post) => (
              <div
                key={post.id}
                className="rounded-md border border-outline-variant bg-surface-container-low p-4 opacity-70"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
                    {CONTENT_TYPE_LABELS[post.contentType]}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Posted {post.postedAt ? new Date(post.postedAt).toLocaleString() : ""}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-on-surface-variant">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
