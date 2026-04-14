"use client";

import { useEffect, useState } from "react";

interface SiteRow {
  id: number;
  name: string;
  domain: string;
  fb_page_id: string | null;
  fb_page_name: string | null;
  fb_posting_enabled: boolean;
  fb_last_posted_at: string | null;
  has_token: boolean;
}

interface FbPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

export default function FacebookAdminPage() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [pages, setPages] = useState<FbPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  async function reload() {
    const [sitesRes, pagesRes] = await Promise.all([
      fetch("/api/admin/fb-sites").then((r) => r.json()),
      fetch("/api/admin/fb-pages").then((r) => r.json()),
    ]);
    setSites(sitesRes.sites || []);
    setPages(pagesRes.pages || []);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function save(site: SiteRow, pageId: string, enabled: boolean) {
    setSaving(site.id);
    const page = pages.find((p) => p.id === pageId);
    await fetch("/api/admin/fb-sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_id: site.id,
        fb_page_id: pageId || null,
        fb_page_name: page?.name || null,
        fb_access_token: page?.access_token || undefined, // only overwrite if we have a fresh one
        enabled,
      }),
    });
    await reload();
    setSaving(null);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  const connected = pages.length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Facebook Auto-Poster</h1>

      <div className="mb-6 p-4 border rounded bg-gray-50">
        {connected ? (
          <p className="text-sm">
            ✅ Connected — {pages.length} Facebook page(s) available. Map them to your sites below.
          </p>
        ) : (
          <p className="text-sm">
            Not connected. Click the button to connect your Facebook account and load your pages.
          </p>
        )}
        <a
          href="/api/admin/fb-oauth/start"
          className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {connected ? "Reconnect Facebook" : "Connect Facebook"}
        </a>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Site</th>
            <th className="p-2 border">Domain</th>
            <th className="p-2 border">Facebook Page</th>
            <th className="p-2 border">Enabled</th>
            <th className="p-2 border">Last Posted</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            const currentPageId = site.fb_page_id || "";
            return (
              <tr key={site.id} className="border-t">
                <td className="p-2 border font-medium">{site.name}</td>
                <td className="p-2 border text-gray-600">{site.domain}</td>
                <td className="p-2 border">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={currentPageId}
                    onChange={(e) => save(site, e.target.value, site.fb_posting_enabled)}
                    disabled={saving === site.id}
                  >
                    <option value="">— none —</option>
                    {site.fb_page_id && !pages.find((p) => p.id === site.fb_page_id) && (
                      <option value={site.fb_page_id}>
                        {site.fb_page_name || site.fb_page_id} (saved)
                      </option>
                    )}
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border text-center">
                  <input
                    type="checkbox"
                    checked={site.fb_posting_enabled}
                    disabled={!site.has_token || saving === site.id}
                    onChange={(e) => save(site, currentPageId, e.target.checked)}
                  />
                </td>
                <td className="p-2 border text-gray-600">
                  {site.fb_last_posted_at
                    ? new Date(site.fb_last_posted_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-4 text-xs text-gray-500">
        Cron runs hourly. Each page is rate-limited to max 1 post per hour.
      </p>
    </div>
  );
}
