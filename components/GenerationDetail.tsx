"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Generation } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useDialog } from "@/components/DialogProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

const ASPECT_CLASS: Record<string, string> = {
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-[16/9]",
  "1:1": "aspect-square",
};

export function GenerationDetail({ id }: { id: string }) {
  const router = useRouter();
  const { confirm } = useDialog();
  const { t } = useLanguage();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedTrackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/generations/${id}`);
      if (cancelled) return;
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setGeneration(data.generation);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const active =
      generation?.status === "pending" || generation?.status === "processing";

    if (active) {
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/generations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setGeneration(data.generation);
        }
      }, 5000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [generation?.status, id]);

  useEffect(() => {
    if (generation?.status === "completed" && !completedTrackedRef.current) {
      completedTrackedRef.current = true;
      trackEvent("video_generation_completed", {
        generation_id: generation.id,
        resolution: generation.resolution,
        aspect_ratio: generation.aspect_ratio,
        video_count: generation.generation_videos.length,
      });
    }
  }, [generation]);

  async function handleDownloadVideo(videoUrl: string, scriptIndex: number) {
    trackEvent("video_downloaded", {
      generation_id: id,
      script_index: scriptIndex,
    });
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${generation?.product_name ?? "video"}-${scriptIndex + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleDelete() {
    if (!generation) return;
    const ok = await confirm(t.generationDetail.deleteConfirm(generation.product_name), {
      title: t.generationDetail.deleteTitle,
      confirmLabel: t.common.delete,
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
    }
  }

  async function handleDeleteVideo(videoId: string, scriptIndex: number) {
    const ok = await confirm(t.generationDetail.deleteVariantConfirm(scriptIndex + 1), {
      title: t.generationDetail.deleteVariantTitle,
      confirmLabel: t.common.delete,
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/generation-videos/${videoId}`, {
      method: "DELETE",
    });
    if (res.ok && generation) {
      setGeneration({
        ...generation,
        generation_videos: generation.generation_videos.filter(
          (v) => v.id !== videoId
        ),
      });
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="text-[var(--ink-secondary)]">{t.generationDetail.notFound}</p>
        <Link href="/dashboard" className="text-[14px] font-medium text-[var(--accent)]">
          {t.generationDetail.backToDashboard}
        </Link>
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-24">
        <p className="text-[14px] text-[var(--ink-tertiary)]">{t.common.loading}</p>
      </div>
    );
  }

  const videos = [...generation.generation_videos].sort(
    (a, b) => a.script_index - b.script_index
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
      <Link
        href="/dashboard"
        className="text-[13px] text-[var(--ink-tertiary)] transition-colors hover:text-[var(--ink)]"
      >
        {t.generationDetail.backToDashboard}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generation.product_image_url}
            alt={generation.product_name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover"
          />
          {generation.extra_product_image_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={t.generationDetail.extraImageAlt(i + 1)}
              title={t.generationDetail.extraImageAlt(i + 1)}
              className="-ml-6 h-12 w-12 shrink-0 rounded-xl border-2 border-white object-cover"
            />
          ))}
          {generation.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generation.avatar_url}
              alt={t.generationDetail.avatarAlt}
              title={t.generationDetail.avatarAlt}
              className="-ml-6 h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="break-words text-2xl font-semibold tracking-tight text-[var(--ink)]">
            {generation.product_name}
          </h1>
          {generation.custom_prompt && (
            <p className="text-sm text-[var(--ink-secondary)]">
              {generation.custom_prompt}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-secondary)]">
            {generation.aspect_ratio}
          </span>
          <StatusBadge status={generation.status} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-[var(--red)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-40"
          >
            {deleting ? t.common.deleting : t.common.delete}
          </button>
        </div>
      </div>

      <div
        className={`grid gap-5 ${
          generation.aspect_ratio === "9:16"
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "sm:grid-cols-2"
        }`}
      >
        {videos.map((video) => (
          <div
            key={video.id}
            className="card-shadow group relative flex flex-col overflow-hidden rounded-3xl bg-[var(--bg-secondary)]"
          >
            <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100">
              {video.status === "completed" && video.video_url && (
                <button
                  onClick={() => handleDownloadVideo(video.video_url!, video.script_index)}
                  aria-label={t.generationDetail.downloadAria}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
                >
                  ⬇
                </button>
              )}
              <button
                onClick={() => handleDeleteVideo(video.id, video.script_index)}
                aria-label={t.generationDetail.deleteVariantAria}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
              >
                ✕
              </button>
            </div>
            <div
              className={`relative flex items-center justify-center overflow-hidden bg-black ${
                ASPECT_CLASS[generation.aspect_ratio] ?? "aspect-[9/16]"
              }`}
            >
              {video.status === "completed" && video.video_url ? (
                <video
                  src={video.video_url}
                  controls
                  className="h-full w-full object-cover"
                />
              ) : video.status === "failed" ? (
                <span className="px-4 text-center text-[13px] text-[var(--red)]">
                  {t.generationDetail.failedStatus}
                </span>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generation.product_image_url}
                    alt=""
                    aria-hidden
                    className="pulse absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
                  />
                  <div className="absolute inset-0 bg-black/55" />
                  <span className="relative px-4 text-center text-[13px] font-medium text-white">
                    {t.generationDetail.generatingStatus}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] font-medium text-[var(--ink-tertiary)]">
                {t.generationDetail.variantLabel(video.script_index + 1)}
              </span>
              <StatusBadge status={video.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
