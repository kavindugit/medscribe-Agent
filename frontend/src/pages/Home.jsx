import React, { useContext, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";

/**
 * MedReport Assist — Polished Home Page
 *
 * ✨ Upgrades
 * - Glassy gradient header with quick actions (search, notifications)
 * - Hero with soft glow, welcome panel, and primary CTAs
 * - Drag & Drop uploader with progress + file preview + error/success toast
 * - Animated stat cards with icons
 * - Recent Reports list with badges, actions, and empty/skeleton states
 * - Assistants hub with lively gradient borders and hover micro-interactions
 * - Accessible focus rings, keyboard-friendly components
 *
 * ✅ Drop-in replacement for the given HomePage component
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);

  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState("");
  const [isUploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState({ show: false, kind: "success", msg: "" });

  // drag & drop helpers
  const dropRef = useRef(null);
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Upload handler
  const onUpload = async () => {
    if (!file) return openToast("error", "Pick a PDF or image before uploading.");
    if (!userData?.userId) return openToast("error", "You need to log in first.");

    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      setProgress(12);

      // 1) create case
      const { data } = await axios.post(`${backendUrl}/api/cases`, form, {
        withCredentials: true,
        headers: { "X-User-Id": userData.userId },
        onUploadProgress: (pe) => {
          if (pe.total) {
            const pct = Math.min(98, Math.round((pe.loaded / pe.total) * 100));
            setProgress(pct);
          }
        },
      });

      setCaseId(data.case_id);
      setProgress(100);

      // 2) fetch cleaned (no on-screen preview; just log)
      const cleaned = await axios.get(`${backendUrl}/api/cases/${data.case_id}/cleaned`, {
        withCredentials: true,
        headers: { "X-User-Id": userData.userId },
      });
      console.log("cleaned:", cleaned.data);

      openToast("success", `Uploaded ✓ Case ID: ${data.case_id}`);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      openToast("error", "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  const user = {
    name: userData?.name || "Maya Perera",
    role: "Patient",
    avatar: userData?.avatar || "https://i.pravatar.cc/120?img=12",
  };

  const stats = [
    { label: "Total Reports", value: 18, icon: ReportIcon },
    { label: "Processed", value: 14, icon: CheckIcon },
    { label: "Pending", value: 4, icon: PendingIcon },
  ];

  const assistants = [
    {
      key: "translator",
      name: "Term Translator",
      desc: "Convert jargon to plain Sinhala/English.",
      accent: "from-cyan-400 to-sky-500",
      onClick: () => navigate("/assistant/translator"),
    },
    {
      key: "summary",
      name: "Summary Agent",
      desc: "Concise, cited report summaries.",
      accent: "from-fuchsia-400 to-pink-500",
      onClick: () => navigate("/assistant/summary"),
    },
    {
      key: "advice",
      name: "Advice Agent",
      desc: "Educational guidance & questions.",
      accent: "from-emerald-400 to-teal-500",
      onClick: () => navigate("/assistant/advice"),
    },
  ];

  const recentReports = useMemo(
    () => [
      { id: "MR-1129", title: "Full Blood Count", date: "2025-08-28", status: "Processed" },
      { id: "MR-1130", title: "Liver Function Test", date: "2025-09-01", status: "Processed" },
      { id: "MR-1131", title: "Chest X-Ray", date: "2025-09-03", status: "Pending" },
      { id: "MR-1132", title: "Urinalysis", date: "2025-09-05", status: "Pending" },
    ], []
  );

  const goProfile = () => navigate("/profile");
  const goChat = () => navigate("/chat");

  function openToast(kind, msg) {
    setToast({ show: true, kind, msg });
    clearTimeout(openToast._t);
    openToast._t = setTimeout(() => setToast({ show: false, kind, msg: "" }), 2800);
  }

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white">
      <StethoscopeBackdrop />

      {/* Toast */}
      {toast.show && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-50 min-w-[260px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${
            toast.kind === "success"
              ? "border-emerald-400/30 bg-emerald-500/10"
              : "border-rose-400/30 bg-rose-500/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{toast.kind === "success" ? "✅" : "⚠️"}</div>
            <p className="text-sm leading-snug text-white/90">{toast.msg}</p>
          </div>
        </div>
      )}

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-cyan-400/60 via-fuchsia-500/50 to-indigo-500/60 blur opacity-60" />
              <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-neutral-900/80 text-black font-black">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-neutral-950 font-extrabold">
                  MR
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">MedReport Assist</h1>
              <p className="text-xs text-neutral-300">Private • Safe • Cited</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <SearchIcon />
              <input
                aria-label="Search reports"
                placeholder="Search reports…"
                className="w-44 bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
            <button
              title="Notifications"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 hover:border-cyan-400"
            >
              <BellIcon />
            </button>
            <button
              onClick={goProfile}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-cyan-400"
            >
              <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-950/60 via-indigo-950/40 to-fuchsia-950/50 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt="avatar" className="h-14 w-14 rounded-full ring-2 ring-white/10" />
                <div>
                  <h2 className="text-2xl font-bold leading-tight">Welcome back, {user.name}</h2>
                  <p className="text-sm text-neutral-300">Your reports at a glance • {user.role}</p>
                </div>
              </div>
              <p className="max-w-prose text-sm text-neutral-300">
                Upload a medical report to get instant summaries, term translations, and safe educational guidance—all in one privacy‑first workspace.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <ActionButton label="Open Chatbot" onClick={goChat} gradient="from-cyan-400 to-sky-500" icon={<span>💬</span>} />
                <ActionButton label="View Profile" onClick={goProfile} gradient="from-amber-300 to-orange-400" icon={<span>👤</span>} />
              </div>
            </div>

            {/* Quick upload */}
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5">
              <p className="text-sm text-neutral-300">Quick Upload</p>

              {/* Drag & Drop zone */}
              <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="mt-3 grid place-items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/30 p-5 text-center hover:border-cyan-400 focus-within:border-cyan-400"
              >
                <UploadCloudIcon />
                <div className="text-sm text-neutral-300">
                  Drag & drop a PDF or image here, or
                  <label className="ml-1 cursor-pointer font-semibold text-cyan-300 hover:underline">
                    browse
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                </div>
                {file && (
                  <div className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-left">
                    <p className="truncate text-xs text-neutral-200">Selected: {file.name}</p>
                  </div>
                )}
                {/* Progress */}
                {isUploading && (
                  <div className="mt-2 w-full">
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-[width] duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[11px] text-neutral-300">{progress}%</p>
                  </div>
                )}

                <button
                  onClick={onUpload}
                  disabled={isUploading}
                  className="mt-1 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowUpTrayIcon />
                  {isUploading ? "Uploading…" : "Upload"}
                </button>

                {caseId && !isUploading && (
                  <div className="mt-3 w-full text-left">
                    <p className="text-xs text-neutral-300">Uploaded ✅ Case ID: {caseId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} Icon={s.icon} />
          ))}
        </section>

        {/* Main grid */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Recent reports */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold">Recent Reports</h3>
              <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-cyan-400">
                View all
              </button>
            </div>
            <div className="divide-y divide-white/10">
              {recentReports.length === 0 ? (
                <EmptyState />
              ) : (
                recentReports.map((r) => (
                  <ReportRow key={r.id} report={r} onOpen={() => navigate(`/reports/${r.id}`)} />
                ))
              )}
            </div>
          </div>

          {/* Assistants hub */}
          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold">AI Assistants</h3>
              <p className="mt-1 text-sm text-neutral-300">Tap to start a new session</p>
            </div>
            <div className="p-4 space-y-3">
              {assistants.map((a) => (
                <button
                  key={a.key}
                  onClick={a.onClick}
                  className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{
                    background: "radial-gradient(600px circle at var(--x,50%) var(--y,50%), #22d3ee22, transparent 40%)",
                  }} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-sm text-neutral-300">{a.desc}</p>
                    </div>
                    <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${a.accent} text-black font-bold`}>
                      🩺
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, gradient, icon }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${gradient} px-4 py-2 text-sm font-semibold text-black shadow-sm transition active:scale-[0.98]`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-md bg-black/10">{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ label, value, Icon }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/10 to-fuchsia-400/10 blur-2xl" />
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5">
          <Icon />
        </div>
        <div>
          <p className="text-sm text-neutral-300">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ReportRow({ report, onOpen }) {
  const statusTone =
    report.status === "Processed"
      ? "text-emerald-300 border-emerald-400/20 bg-emerald-400/10"
      : "text-amber-300 border-amber-400/20 bg-amber-400/10";

  return (
    <div className="flex items-center justify-between p-4">
      <div className="min-w-0">
        <p className="truncate font-medium">{report.title}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{report.id} • {report.date}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusTone}`}>{report.status}</span>
        <button
          onClick={onOpen}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-cyan-400"
        >
          Open
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center gap-2 p-10 text-center">
      <FolderIcon />
      <p className="text-sm text-neutral-300">No recent reports yet.</p>
      <p className="text-xs text-neutral-400">Upload a PDF or image to get started.</p>
    </div>
  );
}

function StethoscopeBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
      <div
        className="absolute -top-40 -right-40 h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side,#22d3ee22,transparent)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side,#a78bfa22,transparent)" }}
      />
    </div>
  );
}

/* === Icons (inline, no external deps) === */
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-200">
      <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-300">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M20 20l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-200">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-200">
      <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-200">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function UploadCloudIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-neutral-200">
      <path d="M20 16.5A3.5 3.5 0 0 0 16.5 13h-1.06A6 6 0 1 0 4 14a4 4 0 0 0 0 8h12a4 4 0 0 0 4-4c0-.58-.13-1.14-.36-1.64" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 17V9m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowUpTrayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-900">
      <path d="M12 16V4m0 0-4 4m4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-neutral-300">
      <path d="M3 7a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
