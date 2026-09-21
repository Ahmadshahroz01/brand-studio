"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BrandProfile, TopPost, ReferenceAccount } from "@prisma/client";

const INDUSTRIES = [
  ["TECHNOLOGY", "Technology"],
  ["MARKETING", "Marketing"],
  ["DESIGN_CREATIVE", "Design / Creative"],
  ["FINANCE", "Finance"],
  ["HEALTHCARE", "Healthcare"],
  ["EDUCATION", "Education"],
  ["CONSULTING", "Consulting"],
  ["SALES", "Sales"],
  ["HR_RECRUITING", "HR / Recruiting"],
  ["OTHER", "Other"],
] as const;

const CONTENT_TYPES = [
  ["THOUGHT_LEADERSHIP", "Thought leadership", "Opinions and predictions about your industry."],
  ["INSTRUCTIONAL", "Instructional", "Step-by-step how-tos."],
  ["CHEAT_SHEET", "Cheat sheets", "Scannable, listicle-style reference posts."],
  ["PERSONAL_STORY", "Personal stories", "First-person moments with a lesson."],
] as const;

type TopPostDraft = { content: string; impressions?: number };
type ReferenceDraft = { name: string; profileUrl?: string; notes?: string };

export function OnboardingForm({
  initialBrandProfile,
  initialReferenceAccounts,
}: {
  initialBrandProfile: (BrandProfile & { topPosts: TopPost[] }) | null;
  initialReferenceAccounts: ReferenceAccount[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toneOfVoice, setToneOfVoice] = useState(initialBrandProfile?.toneOfVoice ?? "");
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState(
    initialBrandProfile?.linkedinProfileUrl ?? "",
  );
  const [topPosts, setTopPosts] = useState<TopPostDraft[]>(
    initialBrandProfile?.topPosts.length
      ? initialBrandProfile.topPosts.map((p) => ({
          content: p.content,
          impressions: p.impressions ?? undefined,
        }))
      : [{ content: "", impressions: undefined }],
  );

  const [referenceAccounts, setReferenceAccounts] = useState<ReferenceDraft[]>(
    initialReferenceAccounts.length
      ? initialReferenceAccounts.map((r) => ({
          name: r.name,
          profileUrl: r.profileUrl ?? undefined,
          notes: r.notes ?? undefined,
        }))
      : [{ name: "", profileUrl: "", notes: "" }],
  );

  const [industry, setIndustry] = useState<string>(initialBrandProfile?.industry ?? "");
  const [contentTypes, setContentTypes] = useState<string[]>(
    initialBrandProfile?.contentTypes ?? [],
  );

  const steps = [
    "Tone & top posts",
    "References you follow",
    "Industry",
    "Content type",
  ];

  function toggleContentType(value: string) {
    setContentTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/brand-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinProfileUrl,
          toneOfVoice,
          industry,
          contentTypes,
          topPosts: topPosts
            .filter((p) => p.content.trim())
            .map((p) => ({ content: p.content, impressions: p.impressions })),
          referenceAccounts: referenceAccounts
            .filter((r) => r.name.trim())
            .map((r) => ({ name: r.name, profileUrl: r.profileUrl, notes: r.notes })),
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ? JSON.stringify(body.error) : "Failed to save");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance =
    (step === 0 && toneOfVoice.trim().length >= 10) ||
    (step === 1 && true) ||
    (step === 2 && industry.length > 0) ||
    (step === 3 && contentTypes.length > 0);

  return (
    <div className="mt-8">
      <div className="mb-8 flex gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full ${i <= step ? "bg-neutral-900" : "bg-neutral-200"}`}
            />
            <p className="mt-1.5 text-xs text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Tone of voice</label>
            <p className="mt-1 text-xs text-neutral-500">
              Describe how you write. Formal or casual, short punchy sentences or
              longer ones, any words or phrases you always/never use.
            </p>
            <textarea
              className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              rows={5}
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              placeholder="Direct, a bit skeptical of hype, short paragraphs, no corporate jargon..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">LinkedIn profile URL</label>
            <input
              className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              value={linkedinProfileUrl}
              onChange={(e) => setLinkedinProfileUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Your best-performing posts
            </label>
            <p className="mt-1 text-xs text-neutral-500">
              Paste 2-3 posts that got the most impressions. These are the style
              reference for everything generated.
            </p>
            <div className="mt-2 space-y-3">
              {topPosts.map((p, i) => (
                <div key={i} className="rounded-lg border border-neutral-300 p-3">
                  <textarea
                    className="w-full text-sm"
                    rows={3}
                    value={p.content}
                    onChange={(e) =>
                      setTopPosts((prev) =>
                        prev.map((tp, idx) =>
                          idx === i ? { ...tp, content: e.target.value } : tp,
                        ),
                      )
                    }
                    placeholder="Paste post text..."
                  />
                  <input
                    type="number"
                    className="mt-2 w-40 rounded border border-neutral-200 px-2 py-1 text-xs"
                    value={p.impressions ?? ""}
                    onChange={(e) =>
                      setTopPosts((prev) =>
                        prev.map((tp, idx) =>
                          idx === i
                            ? { ...tp, impressions: e.target.value ? Number(e.target.value) : undefined }
                            : tp,
                        ),
                      )
                    }
                    placeholder="Impressions (optional)"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTopPosts((prev) => [...prev, { content: "" }])}
              className="mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              + Add another post
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Accounts you like to follow
          </label>
          <p className="text-xs text-neutral-500">
            Top voices in a similar space. Entered manually, not pulled from
            LinkedIn.
          </p>
          {referenceAccounts.map((r, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-neutral-300 p-3 sm:grid-cols-3">
              <input
                className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
                value={r.name}
                onChange={(e) =>
                  setReferenceAccounts((prev) =>
                    prev.map((ra, idx) => (idx === i ? { ...ra, name: e.target.value } : ra)),
                  )
                }
                placeholder="Name"
              />
              <input
                className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
                value={r.profileUrl ?? ""}
                onChange={(e) =>
                  setReferenceAccounts((prev) =>
                    prev.map((ra, idx) =>
                      idx === i ? { ...ra, profileUrl: e.target.value } : ra,
                    ),
                  )
                }
                placeholder="Profile URL (optional)"
              />
              <input
                className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
                value={r.notes ?? ""}
                onChange={(e) =>
                  setReferenceAccounts((prev) =>
                    prev.map((ra, idx) => (idx === i ? { ...ra, notes: e.target.value } : ra)),
                  )
                }
                placeholder="Why you like them (optional)"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setReferenceAccounts((prev) => [...prev, { name: "", profileUrl: "", notes: "" }])
            }
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            + Add another
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="block text-sm font-medium">Industry</label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {INDUSTRIES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setIndustry(value)}
                className={`rounded-lg border p-3 text-left text-sm ${
                  industry === value
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 hover:border-neutral-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <label className="block text-sm font-medium">
            What kind of content do you want to focus on?
          </label>
          <p className="mt-1 text-xs text-neutral-500">Pick as many as apply.</p>
          <div className="mt-3 space-y-2">
            {CONTENT_TYPES.map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleContentType(value)}
                className={`block w-full rounded-lg border p-3 text-left ${
                  contentTypes.includes(value)
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 hover:border-neutral-400"
                }`}
              >
                <div className="text-sm font-medium">{label}</div>
                <div
                  className={`text-xs ${contentTypes.includes(value) ? "text-neutral-300" : "text-neutral-500"}`}
                >
                  {desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 disabled:opacity-0"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance || submitting}
            onClick={submit}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Finish setup"}
          </button>
        )}
      </div>
    </div>
  );
}
