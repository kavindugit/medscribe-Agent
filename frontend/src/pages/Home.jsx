import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  // --- Dummy user & data ---
  const user = {
    name: "Maya Perera",
    role: "Patient",
    avatar: "https://i.pravatar.cc/120?img=12",
  };

  const stats = [
    { label: "Total Reports", value: 18 },
    { label: "Processed", value: 14 },
    { label: "Pending", value: 4 },
  ];

  const recent = [
    { id: "RPT-1042", title: "CBC Panel", date: "2025-08-06", status: "Processed" },
    { id: "RPT-1041", title: "MRI Brain", date: "2025-08-02", status: "Processed" },
    { id: "RPT-1039", title: "Liver Function Test", date: "2025-07-28", status: "Pending" },
    { id: "RPT-1038", title: "Chest X‑ray", date: "2025-07-21", status: "Processed" },
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

  const goProfile = () => navigate("/profile");
  const goChat = () => navigate("/chat");
  const goUpload = () => navigate("/uploads/new");

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white">
      {/* Decorative stethoscope background */}
      <StethoscopeBackdrop />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black font-black">MR</div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">MedReport Assist</h1>
              <p className="text-xs text-neutral-300">Private • Safe • Cited</p>
            </div>
          </div>
          <button
            onClick={goProfile}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-cyan-400"
          >
            <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" />
            <span className="hidden sm:inline">{user.name}</span>
          </button>
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
              <div className="flex flex-wrap gap-3 pt-2">
                <ActionButton label="Open Chatbot" onClick={goChat} gradient="from-cyan-400 to-sky-500" icon={<span>💬</span>} />
                <ActionButton label="View Profile" onClick={goProfile} gradient="from-amber-300 to-orange-400" icon={<span>👤</span>} />
                <ActionButton label="Upload Report" onClick={goUpload} gradient="from-emerald-400 to-teal-500" icon={<span>⬆️</span>} />
              </div>
            </div>

            {/* Upload pane (dummy) */}
            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-5">
              <p className="text-sm text-neutral-300">Quick Upload</p>
              <div className="mt-3 grid place-items-center rounded-lg border border-white/10 bg-neutral-950/40 py-8">
                <div className="text-center">
                  <div className="text-4xl">🩺</div>
                  <p className="mt-2 text-sm text-neutral-300">
                    Drag & drop PDF / image here
                  </p>
                  <button
                    onClick={goUpload}
                    className="mt-3 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black"
                  >
                    Choose file
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-neutral-300">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Main grid */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Recent reports */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold">Recent Reports</h3>
              <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-cyan-400">View all</button>
            </div>
            <div className="divide-y divide-white/10">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-neutral-300">{r.id} • {r.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    <button className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Open</button>
                  </div>
                </div>
              ))}
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
                  className={`group block w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-cyan-400`}
                >
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
              <button onClick={goChat} className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black">Open Chatbot</button>
            </div>
          </div>
        </section>

        {/* Tips / footer */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="font-semibold">Tips</h4>
          <ul className="mt-2 grid gap-2 text-sm text-neutral-300 sm:grid-cols-3">
            <li>• You can upload PDFs, images (JPG/PNG).</li>
            <li>• Use the Translator to simplify terms.</li>
            <li>• Summaries include sources & sections.</li>
          </ul>
        </section>

        <footer className="pb-8 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} MedReport Assist • Educational support — not a medical diagnosis.
        </footer>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, gradient, icon }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${gradient} px-4 py-2 text-sm font-semibold text-black`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-md bg-black/10">{icon}</span>
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Processed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Error: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  const cls = styles[status] || "bg-white/10 text-white border-white/20";
  return <span className={`rounded-full border px-2.5 py-1 text-xs ${cls}`}>{status}</span>;
}

function StethoscopeBackdrop() {
  // A soft, oversized stethoscope SVG watermark
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
      <div className="absolute -top-40 -right-40 h-[38rem] w-[38rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side,#22d3ee22,transparent)" }} />
      <div className="absolute -bottom-40 -left-40 h-[38rem] w-[38rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side,#a78bfa22,transparent)" }} />

      <svg
        width="1200"
        height="1200"
        viewBox="0 0 1200 1200"
        className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 scale-125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.08" stroke="url(#g1)" strokeWidth="18" strokeLinecap="round">
          {/* Earpieces */}
          <circle cx="420" cy="280" r="40" />
          <circle cx="780" cy="280" r="40" />
          {/* Tubes */}
          <path d="M420 320 C 420 420, 520 480, 600 520" />
          <path d="M780 320 C 780 420, 680 480, 600 520" />
          {/* Y joint to chestpiece */}
          <path d="M600 520 C 600 700, 500 760, 460 820 C 430 860, 420 900, 460 940 C 520 1000, 640 980, 700 920 C 760 860, 760 760, 700 720" />
          {/* Chestpiece ring */}
          <circle cx="740" cy="720" r="48" />
        </g>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1200" y2="1200">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
