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

const textFieldClass =
  "w-full rounded-xs border border-outline bg-transparent p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-2 focus:border-primary focus:outline-none";
const smallFieldClass =
  "rounded-xs border border-outline-variant bg-transparent px-2.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-2 focus:border-primary focus:outline-none";

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
              className={`h-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-container-highest"}`}
            />
            <p className="mt-1.5 text-xs text-on-surface-variant">{label}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface">Tone of voice</label>
            <p className="mt-1 text-xs text-on-surface-variant">
              Describe how you write. Formal or casual, short punchy sentences or
              longer ones, any words or phrases you always/never use.
            </p>
            <textarea
              className={`mt-2 ${textFieldClass}`}
              rows={5}
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              placeholder="Direct, a bit skeptical of hype, short paragraphs, no corporate jargon..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface">
              LinkedIn profile URL
            </label>
            <input
              className={`mt-2 ${textFieldClass}`}
              value={linkedinProfileUrl}
              onChange={(e) => setLinkedinProfileUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface">
              Your best-performing posts
            </label>
            <p className="mt-1 text-xs text-on-surface-variant">
              Paste 2-3 posts that got the most impressions. These are the style
              reference for everything generated.
            </p>
            <div className="mt-2 space-y-3">
              {topPosts.map((p, i) => (
                <div key={i} className="rounded-md border border-outline bg-surface-container-lowest p-3">
                  <textarea
                    className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
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
                    className={`mt-2 w-44 ${smallFieldClass}`}
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
              className="mt-2 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/8"
            >
              + Add another post
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-on-surface">
            Accounts you like to follow
          </label>
          <p className="text-xs text-on-surface-variant">
            Top voices in a similar space. Entered manually, not pulled from
            LinkedIn.
          </p>
          {referenceAccounts.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-2 rounded-md border border-outline bg-surface-container-lowest p-3 sm:grid-cols-3"
            >
              <input
                className={smallFieldClass}
                value={r.name}
                onChange={(e) =>
                  setReferenceAccounts((prev) =>
                    prev.map((ra, idx) => (idx === i ? { ...ra, name: e.target.value } : ra)),
                  )
                }
                placeholder="Name"
              />
              <input
                className={smallFieldClass}
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
                className={smallFieldClass}
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
            className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/8"
          >
            + Add another
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="block text-sm font-medium text-on-surface">Industry</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {INDUSTRIES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setIndustry(value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  industry === value
                    ? "border-transparent bg-secondary-container text-on-secondary-container"
                    : "border-outline text-on-surface-variant hover:bg-surface-container-high"
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
          <label className="block text-sm font-medium text-on-surface">
            What kind of content do you want to focus on?
          </label>
          <p className="mt-1 text-xs text-on-surface-variant">Pick as many as apply.</p>
          <div className="mt-3 space-y-2">
            {CONTENT_TYPES.map(([value, label, desc]) => {
              const selected = contentTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleContentType(value)}
                  className={`block w-full rounded-md border p-3 text-left transition ${
                    selected
                      ? "border-transparent bg-secondary-container"
                      : "border-outline hover:bg-surface-container-high"
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${selected ? "text-on-secondary-container" : "text-on-surface"}`}
                  >
                    {label}
                  </div>
                  <div
                    className={`text-xs ${selected ? "text-on-secondary-container/80" : "text-on-surface-variant"}`}
                  >
                    {desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-on-surface-variant disabled:opacity-0"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition hover:brightness-95 disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance || submitting}
            onClick={submit}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition hover:brightness-95 disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Finish setup"}
          </button>
        )}
      </div>
    </div>
  );
}
