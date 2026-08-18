"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Generation } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

const ASPECT_CLASS: Record<string, string> = {
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-[16/9]",
  "1:1": "aspect-square",
};

export function GenerationDetail({ id }: { id: string }) {
  const router = useRouter();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  async function handleDelete() {
    if (!generation) return;
    if (!confirm(`"${generation.product_name}" kaydını silmek istediğine emin misin?`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
    }
  }

  async function handleDeleteVideo(videoId: string, scriptIndex: number) {
    if (!confirm(`Varyasyon ${scriptIndex + 1}'i silmek istediğine emin misin?`)) {
      return;
    }
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
        <p className="text-[var(--ink-secondary)]">Üretim bulunamadı.</p>
        <Link href="/dashboard" className="text-[14px] font-medium text-[var(--accent)]">
          ← Panele dön
        </Link>
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-24">
        <p className="text-[14px] text-[var(--ink-tertiary)]">Yükleniyor...</p>
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
        ← Panele dön
      </Link>

      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={generation.product_image_url}
          alt={generation.product_name}
          className="h-16 w-16 rounded-2xl object-cover"
        />
        {generation.extra_product_image_urls.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={`Ek görsel ${i + 1}`}
            title={`Ek görsel ${i + 1}`}
            className="-ml-6 h-12 w-12 rounded-xl border-2 border-white object-cover"
          />
        ))}
        {generation.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={generation.avatar_url}
            alt="Videodaki kişi"
            title="Videodaki kişi"
            className="-ml-6 h-10 w-10 rounded-full border-2 border-white object-cover"
          />
        )}
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            {generation.product_name}
          </h1>
          {generation.custom_prompt && (
            <p className="text-sm text-[var(--ink-secondary)]">
              {generation.custom_prompt}
            </p>
          )}
        </div>
        <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-secondary)]">
          {generation.aspect_ratio}
        </span>
        <StatusBadge status={generation.status} />
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-full px-4 py-2 text-[13px] font-medium text-[var(--red)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-40"
        >
          {deleting ? "Siliniyor..." : "Sil"}
        </button>
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
            <button
              onClick={() => handleDeleteVideo(video.id, video.script_index)}
              aria-label="Varyasyonu sil"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/60 group-hover:opacity-100"
            >
              ✕
            </button>
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
                  Üretim başarısız oldu
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
                    Video üretiliyor...
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] font-medium text-[var(--ink-tertiary)]">
                Varyasyon {video.script_index + 1}
              </span>
              <StatusBadge status={video.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
