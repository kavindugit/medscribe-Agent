import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);

  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState("");

  // Upload handler
  const onUpload = async () => {
    if (!file) return alert("Pick a PDF or image");
    if (!userData?.userId) return alert("Not logged in");

    const form = new FormData();
    form.append("file", file);

    try {
      // 1) create case
      const { data } = await axios.post(`${backendUrl}/api/cases`, form, {
        withCredentials: true,
        headers: { "X-User-Id": userData.userId },
      });
      setCaseId(data.case_id);

      // 2) fetch cleaned (no on-screen preview; just log)
      const cleaned = await axios.get(
        `${backendUrl}/api/cases/${data.case_id}/cleaned`,
        {
          withCredentials: true,
          headers: { "X-User-Id": userData.userId },
        }
      );
      console.log("cleaned:", cleaned.data); // e.g., cleaned.sections.labs_block
    } catch (err) {
      console.error(err?.response?.data || err.message);
      alert("Upload failed");
    }
  };

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

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white">
      <StethoscopeBackdrop />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black font-black">
              MR
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                MedReport Assist
              </h1>
              <p className="text-xs text-neutral-300">Private • Safe • Cited</p>
            </div>
          </div>
          <button
            onClick={goProfile}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-cyan-400"
          >
            <img
              src={user.avatar}
              alt="avatar"
              className="h-8 w-8 rounded-full"
            />
            <span className="hidden sm:inline">{user.name}</span>
          </button>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-950/60 via-indigo-950/40 to-fuchsia-950/50 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="h-14 w-14 rounded-full ring-2 ring-white/10"
                />
                <div>
                  <h2 className="text-2xl font-bold leading-tight">
                    Welcome back, {user.name}
                  </h2>
                  <p className="text-sm text-neutral-300">
                    Your reports at a glance • {user.role}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <ActionButton
                  label="Open Chatbot"
                  onClick={goChat}
                  gradient="from-cyan-400 to-sky-500"
                  icon={<span>💬</span>}
                />
                <ActionButton
                  label="View Profile"
                  onClick={goProfile}
                  gradient="from-amber-300 to-orange-400"
                  icon={<span>👤</span>}
                />
              </div>
            </div>

            {/* Quick upload */}
            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-5">
              <p className="text-sm text-neutral-300">Quick Upload</p>
              <div className="mt-3 space-y-3 text-center">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  className="block w-full text-sm text-neutral-300"
                />
                <button
                  onClick={onUpload}
                  className="mt-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black"
                >
                  Upload
                </button>
                {caseId && (
                  <div className="mt-3 text-left">
                    <p className="text-xs text-neutral-300">
                      Uploaded ✅ Case ID: {caseId}
                    </p>
                    {/* Removed raw text preview as requested */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
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
              <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-cyan-400">
                View all
              </button>
            </div>
            <div className="divide-y divide-white/10">
              {/* map dummy reports here */}
            </div>
          </div>

          {/* Assistants hub */}
          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold">AI Assistants</h3>
              <p className="mt-1 text-sm text-neutral-300">
                Tap to start a new session
              </p>
            </div>
            <div className="p-4 space-y-3">
              {assistants.map((a) => (
                <button
                  key={a.key}
                  onClick={a.onClick}
                  className="group block w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-cyan-400"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-sm text-neutral-300">{a.desc}</p>
                    </div>
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${a.accent} text-black font-bold`}
                    >
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
      className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${gradient} px-4 py-2 text-sm font-semibold text-black`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-md bg-black/10">
        {icon}
      </span>
      {label}
    </button>
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
