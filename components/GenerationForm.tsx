"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AspectRatio, Resolution } from "@/lib/types";
import { UpgradeModal } from "@/components/UpgradeModal";
import { creditCost, formatCredits } from "@/lib/plans";
import { useLanguage } from "@/components/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

type SubscriptionState = {
  plan: "starter" | "creator" | "pro";
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  renewsAt: string;
} | null;

const ASPECT_OPTIONS: { value: AspectRatio; label: string; box: string }[] = [
  { value: "9:16", label: "9:16", box: "h-5 w-3" },
  { value: "1:1", label: "1:1", box: "h-4 w-4" },
  { value: "16:9", label: "16:9", box: "h-3 w-5" },
];

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
];

const MAX_EXTRA_IMAGES = 5;
const MIN_DURATION = 3;
const MAX_DURATION = 15;

type ExtraImage = { file: File; preview: string };

export function GenerationForm({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<ExtraImage[]>([]);
  const [productName, setProductName] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [resolution, setResolution] = useState<Resolution>("720p");
  const [duration, setDuration] = useState(MAX_DURATION);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    const res = await fetch("/api/subscription");
    if (res.ok) {
      const data = await res.json();
      setSubscription(data.subscription);
    }
  }, []);

  useEffect(() => {
    // Subscription state is fetched from the server, so it can't be part
    // of the initial (SSR-matching) render. Also re-checked on
    // focus/visibility change and a custom event, not just mount: Next.js
    // can reuse a cached client component instance when navigating back to
    // /dashboard (e.g. from /pricing) without remounting it, so the mount
    // effect alone can miss a subscription that happened on another page.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refreshSubscription();
    window.addEventListener("subscription-changed", refreshSubscription);
    window.addEventListener("focus", refreshSubscription);
    document.addEventListener("visibilitychange", refreshSubscription);
    return () => {
      window.removeEventListener("subscription-changed", refreshSubscription);
      window.removeEventListener("focus", refreshSubscription);
      document.removeEventListener("visibilitychange", refreshSubscription);
    };
  }, [refreshSubscription]);

  const cost = creditCost(resolution, duration);
  const insufficientCredits = !!subscription && subscription.creditsRemaining < cost;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleExtraImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setExtraImages((prev) =>
      [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(
        0,
        MAX_EXTRA_IMAGES
      )
    );
    e.target.value = "";
  }

  function removeExtraImage(index: number) {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // No free tier — sending someone straight to pricing beats a modal
    // they have to dismiss first.
    if (!subscription) {
      router.push("/pricing");
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file || !productName.trim()) {
      setError(t.generationForm.errorMissingFields);
      return;
    }

    if (insufficientCredits) {
      setShowUpgrade(true);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? t.generationForm.errorImageUpload);
      }

      let avatarUrl: string | null = null;
      const avatarFile = avatarInputRef.current?.files?.[0];
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append("file", avatarFile);
        const avatarUploadRes = await fetch("/api/upload", {
          method: "POST",
          body: avatarFormData,
        });
        const avatarUploadData = await avatarUploadRes.json();
        if (!avatarUploadRes.ok) {
          throw new Error(avatarUploadData.error ?? t.generationForm.errorAvatarUpload);
        }
        avatarUrl = avatarUploadData.url;
      }

      const extraProductImageUrls: string[] = [];
      for (const { file: extraFile } of extraImages) {
        const extraFormData = new FormData();
        extraFormData.append("file", extraFile);
        const extraUploadRes = await fetch("/api/upload", {
          method: "POST",
          body: extraFormData,
        });
        const extraUploadData = await extraUploadRes.json();
        if (!extraUploadRes.ok) {
          throw new Error(extraUploadData.error ?? t.generationForm.errorExtraImageUpload);
        }
        extraProductImageUrls.push(extraUploadData.url);
      }

      const genRes = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          productImageUrl: uploadData.url,
          extraProductImageUrls,
          customPrompt: customPrompt.trim() || null,
          avatarUrl,
          aspectRatio,
          resolution,
          duration,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) {
        if (genData.error === "insufficient_credits") {
          setShowUpgrade(true);
          return;
        }
        if (genData.error === "subscription_required") {
          router.push("/pricing");
          return;
        }
        throw new Error(genData.error ?? t.generationForm.errorCreateFailed);
      }

      trackEvent("video_generation_started", {
        generation_id: genData.id,
        aspect_ratio: aspectRatio,
        resolution,
        duration,
        credit_cost: cost,
      });

      setProductName("");
      setCustomPrompt("");
      setAspectRatio("9:16");
      setResolution("720p");
      setDuration(MAX_DURATION);
      setPreview(null);
      setAvatarPreview(null);
      setExtraImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      if (extraFileInputRef.current) extraFileInputRef.current.value = "";
      refreshSubscription();
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-shadow flex flex-col gap-4 rounded-3xl bg-[var(--bg-secondary)] p-5"
    >
      <h2 className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
        {t.generationForm.title}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--ink-secondary)]">
            {t.generationForm.productImageLabel}
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt={t.generationForm.productImageAlt} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[var(--ink-tertiary)]">＋</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full min-w-0 text-[12px] text-[var(--ink-secondary)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--ink-fixed)] file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-white hover:file:bg-black"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="productName" className="text-[12px] font-medium text-[var(--ink-secondary)]">
            {t.generationForm.productNameLabel}
          </label>
          <input
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t.generationForm.productNamePlaceholder}
            className="rounded-xl border-none bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px] text-[var(--ink)] outline-none ring-1 ring-transparent placeholder:text-[var(--ink-tertiary)] focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--ink-secondary)]">
            {t.generationForm.extraImagesLabel} <span className="text-[var(--ink-tertiary)]">{t.generationForm.optional}</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {extraImages.map((img, i) => (
              <div
                key={img.preview}
                className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-elevated)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={t.generationForm.extraImageAlt(i + 1)}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExtraImage(i)}
                  aria-label={t.generationForm.removeImageAria}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-[9px] text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
            {extraImages.length < MAX_EXTRA_IMAGES && (
              <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[var(--bg-elevated)] text-[var(--ink-tertiary)] ring-1 ring-[var(--line)] hover:bg-[var(--bg-tertiary)]">
                ＋
                <input
                  ref={extraFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleExtraImagesChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--ink-secondary)]">
            {t.generationForm.avatarLabel} <span className="text-[var(--ink-tertiary)]">{t.generationForm.optional}</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-elevated)]">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={t.generationForm.avatarAlt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[var(--ink-tertiary)]">＋</span>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="block w-full min-w-0 text-[12px] text-[var(--ink-secondary)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--ink-fixed)] file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-white hover:file:bg-black"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--ink-secondary)]">
            {t.generationForm.aspectRatioLabel}
          </label>
          <div className="flex gap-1.5">
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAspectRatio(opt.value)}
                aria-pressed={aspectRatio === opt.value}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[12px] font-medium transition-colors ${
                  aspectRatio === opt.value
                    ? "border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--ink)] ring-1 ring-[var(--accent)]"
                    : "border-transparent bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                <span
                  className={`rounded-[3px] border-2 ${opt.box} ${
                    aspectRatio === opt.value
                      ? "border-[var(--accent)]"
                      : "border-[var(--ink-tertiary)]"
                  }`}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--ink-secondary)]">
            {t.generationForm.resolutionLabel}
          </label>
          <div className="flex gap-1.5">
            {RESOLUTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResolution(opt.value)}
                aria-pressed={resolution === opt.value}
                className={`flex flex-1 items-center justify-center rounded-xl border px-2 py-2 text-[12px] font-medium transition-colors ${
                  resolution === opt.value
                    ? "border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--ink)] ring-1 ring-[var(--accent)]"
                    : "border-transparent bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="duration" className="text-[12px] font-medium text-[var(--ink-secondary)]">
            {t.generationForm.durationLabel}
          </label>
          <span className="text-[12px] font-medium text-[var(--ink)]">
            {duration}{t.generationForm.seconds}
            {subscription && (
              <span className="text-[var(--ink-tertiary)]"> · {formatCredits(cost)} {t.generationForm.credits}</span>
            )}
          </span>
        </div>
        <input
          id="duration"
          type="range"
          min={MIN_DURATION}
          max={MAX_DURATION}
          step={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        {subscription && (
          <p className="text-[11px] text-[var(--ink-tertiary)]">
            {t.generationForm.remainingCredits(
              formatCredits(subscription.creditsRemaining),
              formatCredits(subscription.creditsTotal)
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="customPrompt" className="text-[12px] font-medium text-[var(--ink-secondary)]">
          {t.generationForm.promptLabel} <span className="text-[var(--ink-tertiary)]">{t.generationForm.optional}</span>
        </label>
        <textarea
          id="customPrompt"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={t.generationForm.promptPlaceholder}
          rows={2}
          className="resize-none rounded-xl border-none bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px] text-[var(--ink)] outline-none ring-1 ring-transparent placeholder:text-[var(--ink-tertiary)] focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="pill-black self-start rounded-full px-6 py-2.5 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? t.generationForm.submitting : t.generationForm.submit}
      </button>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </form>
  );
}
