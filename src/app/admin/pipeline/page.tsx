"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  RefreshCw,
  Play,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";

interface PipelineStatus {
  config: Record<string, string>;
  queue: Record<string, number>;
  recentRuns: {
    stage: string;
    category: string | null;
    items_processed: number;
    items_failed: number;
    duration_ms: number;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
  }[];
  stats: {
    articlesToday: number;
    articlesThisWeek: number;
    errorsLast24h: number;
  };
}

export default function PipelineDashboard() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/status?key=" + encodeURIComponent(localStorage.getItem("cron_secret") || ""));
      if (res.ok) {
        setStatus(await res.json());
        setError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(`Error ${res.status}: ${data.error || "Failed to load status"}`);
      }
    } catch (err) {
      setError("Network error: " + String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prompt for secret on first visit
    if (!localStorage.getItem("cron_secret")) {
      const secret = prompt("Enter CRON_SECRET to access pipeline dashboard:");
      if (secret) localStorage.setItem("cron_secret", secret);
    }
    fetchStatus();
  }, [fetchStatus]);

  async function runAction(endpoint: string, body: Record<string, unknown> = {}) {
    const secret = localStorage.getItem("cron_secret") || "";
    setActionLoading(endpoint);
    try {
      const res = await fetch(`/api/pipeline/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
      fetchStatus();
    } catch (error) {
      alert("Error: " + String(error));
    } finally {
      setActionLoading(null);
    }
  }

  async function togglePipeline() {
    const secret = localStorage.getItem("cron_secret") || "";
    const newValue = status?.config?.enabled === "true" ? "false" : "true";
    try {
      const res = await fetch("/api/pipeline/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ key: "enabled", value: newValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error ${res.status}: ${data.error || "Failed to toggle pipeline"}`);
        return;
      }
      fetchStatus();
    } catch (err) {
      alert("Network error: " + String(err));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isEnabled = status?.config?.enabled === "true";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#c1121f]" />
            Content Pipeline
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Automated RSS → AI Rewrite → Publish
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePipeline}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEnabled
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            {isEnabled ? "Enabled" : "Disabled"}
          </button>
          <button
            onClick={fetchStatus}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          label="Articles Today"
          value={status?.stats?.articlesToday || 0}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          label="Articles This Week"
          value={status?.stats?.articlesThisWeek || 0}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          label="Queue (Pending)"
          value={status?.queue?.pending || 0}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          label="Errors (24h)"
          value={status?.stats?.errorsLast24h || 0}
          bg="bg-red-50"
        />
      </div>

      {/* Queue Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-4">Feed Item Queue</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(status?.queue || {}).map(([key, val]) => (
            <div key={key} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
              <span className="font-medium capitalize">{key}:</span>{" "}
              <span className="text-gray-600">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-4">Manual Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton
            label="Fetch RSS"
            loading={actionLoading === "fetch"}
            onClick={() => runAction("fetch")}
          />
          <ActionButton
            label="Rewrite Batch"
            loading={actionLoading === "rewrite"}
            onClick={() => runAction("rewrite", { batchSize: 5 })}
          />
          <ActionButton
            label="Send IndexNow"
            loading={actionLoading === "notify"}
            onClick={() => runAction("notify")}
          />
          <ActionButton
            label="Generate Opinion"
            loading={actionLoading === "opinion"}
            onClick={() => runAction("opinion")}
          />
          <ActionButton
            label="Cleanup"
            loading={actionLoading === "cleanup"}
            onClick={() => runAction("cleanup")}
          />
        </div>
      </div>

      {/* Seed — Initial Content Population */}
      <div className="bg-orange-50 rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-2">Seed — Populate Initial Content</h2>
        <p className="text-sm text-gray-600 mb-4">
          Run each batch (0-4) to populate ~50 articles per state.
          Each batch = 10 states. Total cost: ~$5.50 for all 50 states.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((batch) => (
            <ActionButton
              key={batch}
              label={`Seed Batch ${batch}`}
              loading={actionLoading === `seed-${batch}`}
              onClick={() => {
                setActionLoading(`seed-${batch}`);
                runAction("seed", { batch, maxPerCategory: 4 });
              }}
            />
          ))}
        </div>
      </div>

      {/* Config */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-4">Current Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(status?.config || {}).map(([key, val]) => (
            <div key={key} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-500">{key}:</span>{" "}
              <span className="font-medium">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Runs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-4">Recent Pipeline Runs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Stage</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Processed</th>
                <th className="pb-2">Failed</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {(status?.recentRuns || []).map((run, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 font-medium capitalize">{run.stage}</td>
                  <td className="py-2 text-gray-600">{run.category || "—"}</td>
                  <td className="py-2">{run.items_processed}</td>
                  <td className="py-2 text-red-600">{run.items_failed}</td>
                  <td className="py-2 text-gray-600">
                    {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="py-2">
                    {run.error_message ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Error
                      </span>
                    ) : run.completed_at ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Running
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-gray-500 text-xs">
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(status?.recentRuns || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-400">
                    No runs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function ActionButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Play className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
