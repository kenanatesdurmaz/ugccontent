"use client";

import { useEffect, useState } from "react";

type Settings = { generationEnabled: boolean; mode: "live" | "test" };

type LogRow = {
  id: string;
  clerk_user_id: string;
  created_at: string;
  resolution: string;
  credit_cost: number | null;
  fal_request_id: string | null;
  status: string;
  product_name: string;
};

type NotificationRow = {
  id: string;
  event_type: "subscription_created" | "test";
  status: "pending" | "sent" | "failed";
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
  payload: { userEmail?: string; plan?: string };
};

export function AdminPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [testModeAllowed, setTestModeAllowed] = useState(true);
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [working, setWorking] = useState(false);
  const [notifWorking, setNotifWorking] = useState(false);

  async function refresh() {
    const [settingsRes, logsRes, notifRes] = await Promise.all([
      fetch("/api/admin/settings"),
      fetch("/api/admin/generations"),
      fetch("/api/admin/notifications"),
    ]);
    if (settingsRes.ok) {
      const data = await settingsRes.json();
      setSettings(data.settings);
      setTestModeAllowed(data.testModeAllowed);
    }
    if (logsRes.ok) {
      const data = await logsRes.json();
      setLogs(data.generations);
    }
    if (notifRes.ok) {
      const data = await notifRes.json();
      setNotifications(data.notifications);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  async function updateSettings(patch: Partial<Settings>) {
    setWorking(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await refresh();
    setWorking(false);
  }

  async function toggleKillSwitch() {
    if (!settings) return;
    const next = !settings.generationEnabled;
    if (
      !next &&
      !confirm("Video üretimini tamamen kapatmak istediğine emin misin? Tüm kullanıcılar için devre dışı kalacak.")
    ) {
      return;
    }
    await updateSettings({ generationEnabled: next });
  }

  async function setMode(mode: "live" | "test") {
    if (!settings || settings.mode === mode) return;
    if (mode === "test" && !confirm("TEST MODE'a geçmek istediğine emin misin? Gerçek fal.ai çağrısı yapılmayacak, sahte sonuçlar üretilecek.")) {
      return;
    }
    await updateSettings({ mode });
  }

  async function sendTestNotification() {
    setNotifWorking(true);
    const res = await fetch("/api/admin/notifications/test", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Test bildirimi gönderilemedi");
    }
    await refresh();
    setNotifWorking(false);
  }

  async function retryFailedNotifications() {
    setNotifWorking(true);
    await fetch("/api/admin/notifications/retry", { method: "POST" });
    await refresh();
    setNotifWorking(false);
  }

  if (!settings) {
    return <p className="text-[14px] text-[var(--ink-tertiary)]">Yükleniyor...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card-shadow flex flex-col gap-4 rounded-3xl bg-[var(--bg-secondary)] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--ink)]">
              Acil durdurma anahtarı
            </h2>
            <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
              Kapatıldığında hiçbir kullanıcı yeni video üretimi başlatamaz.
            </p>
          </div>
          <button
            onClick={toggleKillSwitch}
            disabled={working}
            className={`shrink-0 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-40 ${
              settings.generationEnabled
                ? "bg-[var(--red)] text-white hover:bg-red-700"
                : "bg-[var(--green)] text-white hover:bg-green-700"
            }`}
          >
            {settings.generationEnabled ? "Video üretimini durdur" : "Video üretimini aç"}
          </button>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-[12px] font-medium ${
            settings.generationEnabled
              ? "bg-[var(--green)]/10 text-[var(--green)]"
              : "bg-[var(--red)]/10 text-[var(--red)]"
          }`}
        >
          {settings.generationEnabled ? "● Aktif" : "● Durduruldu"}
        </span>
      </div>

      <div className="card-shadow flex flex-col gap-4 rounded-3xl bg-[var(--bg-secondary)] p-6">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">Mod</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            Test modunda gerçek fal.ai çağrısı yapılmaz, sonuçlar simüle edilir.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("live")}
            disabled={working}
            className={`flex-1 rounded-xl border px-4 py-3 text-[13px] font-semibold transition-colors disabled:opacity-40 ${
              settings.mode === "live"
                ? "border-[var(--accent)] bg-white text-[var(--ink)] ring-1 ring-[var(--accent)]"
                : "border-transparent bg-white text-[var(--ink-secondary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            LIVE MODE
          </button>
          <button
            onClick={() => setMode("test")}
            disabled={working || !testModeAllowed}
            className={`flex-1 rounded-xl border px-4 py-3 text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              settings.mode === "test"
                ? "border-[var(--accent)] bg-white text-[var(--ink)] ring-1 ring-[var(--accent)]"
                : "border-transparent bg-white text-[var(--ink-secondary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            TEST MODE
          </button>
        </div>
        {!testModeAllowed && (
          <p className="text-[12px] text-[var(--ink-tertiary)]">
            Bu ortamda (production) test modu devre dışı bırakıldı.
          </p>
        )}
      </div>

      <div className="card-shadow flex flex-col gap-3 rounded-3xl bg-[var(--bg-secondary)] p-6">
        <h2 className="text-[15px] font-semibold text-[var(--ink)]">Son üretimler</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead>
              <tr className="text-[var(--ink-tertiary)]">
                <th className="pb-2 pr-3 font-medium">Zaman</th>
                <th className="pb-2 pr-3 font-medium">Kullanıcı</th>
                <th className="pb-2 pr-3 font-medium">Ürün</th>
                <th className="pb-2 pr-3 font-medium">Çözünürlük</th>
                <th className="pb-2 pr-3 font-medium">Kredi</th>
                <th className="pb-2 pr-3 font-medium">fal.ai request id</th>
                <th className="pb-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((row) => (
                <tr key={row.id} className="border-t border-[var(--line)]">
                  <td className="py-2 pr-3 text-[var(--ink-secondary)]">
                    {new Date(row.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-[var(--ink-secondary)]">
                    {row.clerk_user_id.slice(0, 12)}…
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink)]">{row.product_name}</td>
                  <td className="py-2 pr-3 text-[var(--ink-secondary)]">{row.resolution}</td>
                  <td className="py-2 pr-3 text-[var(--ink-secondary)]">
                    {row.credit_cost ?? "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-[var(--ink-secondary)]">
                    {row.fal_request_id ?? "—"}
                  </td>
                  <td className="py-2 text-[var(--ink-secondary)]">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs !== null && logs.length === 0 && (
            <p className="py-4 text-[13px] text-[var(--ink-tertiary)]">Henüz üretim yok.</p>
          )}
        </div>
      </div>

      <div className="card-shadow flex flex-col gap-4 rounded-3xl bg-[var(--bg-secondary)] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--ink)]">
              Abonelik e-posta bildirimleri
            </h2>
            <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
              Başarılı her abonelikte ADMIN_EMAIL adresine otomatik e-posta gider.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={retryFailedNotifications}
              disabled={notifWorking}
              className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[var(--ink)] ring-1 ring-[var(--line)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
            >
              Başarısızları yeniden dene
            </button>
            <button
              onClick={sendTestNotification}
              disabled={notifWorking || settings.mode !== "test"}
              title={settings.mode !== "test" ? "Sadece TEST MODE'da kullanılabilir" : undefined}
              className="pill-black rounded-full px-4 py-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Test bildirimi gönder
            </button>
          </div>
        </div>
        {settings.mode !== "test" && (
          <p className="text-[12px] text-[var(--ink-tertiary)]">
            Test bildirimi göndermek için önce yukarıdan TEST MODE&apos;a geç.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead>
              <tr className="text-[var(--ink-tertiary)]">
                <th className="pb-2 pr-3 font-medium">Zaman</th>
                <th className="pb-2 pr-3 font-medium">Tür</th>
                <th className="pb-2 pr-3 font-medium">Kullanıcı</th>
                <th className="pb-2 pr-3 font-medium">Paket</th>
                <th className="pb-2 pr-3 font-medium">Durum</th>
                <th className="pb-2 font-medium">Hata</th>
              </tr>
            </thead>
            <tbody>
              {notifications?.map((row) => (
                <tr key={row.id} className="border-t border-[var(--line)]">
                  <td className="py-2 pr-3 text-[var(--ink-secondary)]">
                    {new Date(row.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink-secondary)]">
                    {row.event_type === "test" ? "Test" : "Abonelik"}
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink)]">{row.payload?.userEmail ?? "—"}</td>
                  <td className="py-2 pr-3 text-[var(--ink-secondary)]">{row.payload?.plan ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        row.status === "sent"
                          ? "text-[var(--green)]"
                          : row.status === "failed"
                            ? "text-[var(--red)]"
                            : "text-[var(--ink-tertiary)]"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--ink-tertiary)]">{row.last_error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {notifications !== null && notifications.length === 0 && (
            <p className="py-4 text-[13px] text-[var(--ink-tertiary)]">Henüz bildirim yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}
