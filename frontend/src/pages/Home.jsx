// frontend/src/pages/HomePage.jsx
import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import {
  Stethoscope,
  FileUp,
  MessageSquare,
  ClipboardList,
  BookOpen,
  Lightbulb,
  LogOut,
  Settings,
  User,
  AlertTriangle,
} from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { backendUrl, userData, getUserData, usage } = useContext(AppContent);
  const backend_AI = "http://localhost:8001"; // FastAPI service

  // debug: see plan + remaining in console when available
  useEffect(() => {
    if (userData && usage) {
      console.log("🧍 User Plan:", userData.plan);
      console.log("📊 Remaining Reports:", usage.remainingReports);
    }
  }, [userData, usage]);

  // Upload + processing state
  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  // Agent outputs
  const [summaryOutput, setSummaryOutput] = useState("");
  const [classifierOutput, setClassifierOutput] = useState("");
  const [explainerOutput, setExplainerOutput] = useState("");
  const [translatorOutput, setTranslatorOutput] = useState("");
  const [adviceOutput, setAdviceOutput] = useState("");

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Profile dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🚀 Upload Handler
  const onUpload = async () => {
    if (!file) return alert("Please select a PDF or image file.");
    if (!userData?.userId) return alert("Please log in first.");

    // client-side guard using context usage
    if (usage?.remainingReports === 0) {
      setLimitReached(true);
      return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      setError("");

      // 1) Upload the file → create case in backend
      const { data } = await axios.post(`${backendUrl}/api/cases`, form, {
        withCredentials: true,
        headers: { "X-User-Id": userData.userId },
      });

      if (!data || !data.case_id) throw new Error("Invalid response from server.");

      setCaseId(data.case_id);

      // 2) Fetch cleaned report text
      const cleaned = await axios.get(
        `${backendUrl}/api/cases/${data.case_id}/cleaned`,
        {
          withCredentials: true,
          headers: { "X-User-Id": userData.userId },
        }
      );
      const cleanedText = cleaned.data.cleaned_text;

      // 3) Run pipeline using cleaned text
      await runPipeline(cleanedText);

      // Clear the file input
      setFile(null);
      document.getElementById("reportUpload").value = "";
    } catch (err) {
      console.error("❌ Upload Error:", err?.response?.data || err.message);
      if (err?.response?.status === 403) {
        // backend checkPlanLimit blocked it
        setLimitReached(true);
      } else {
        setError("⚠️ Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // 🧠 Streaming pipeline runner
  const runPipeline = async (cleanedText) => {
    try {
      const response = await fetch(`${backend_AI}/pipeline/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medical_report: cleanedText }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const trimmed = evt.trim();
          if (!trimmed) continue;

          try {
            const jsonStr = trimmed.startsWith("data:")
              ? trimmed.replace(/^data:\s*/, "")
              : trimmed;
            const data = JSON.parse(jsonStr);

            switch (data.agent) {
              case "summarizer":
                setSummaryOutput(data.output);
                break;
              case "classifier":
                setClassifierOutput(
                  typeof data.output === "object"
                    ? JSON.stringify(data.output, null, 2)
                    : data.output
                );
                break;
              case "explainer":
                setExplainerOutput(
                  typeof data.output === "object"
                    ? JSON.stringify(data.output, null, 2)
                    : data.output
                );
                break;
              case "translator":
                setTranslatorOutput(data.output);
                break;
              case "advisor":
                setAdviceOutput(data.output);
                break;
              default:
                console.warn("Unknown agent:", data);
            }
          } catch (err) {
            console.error("❌ Failed to parse JSON:", evt, err);
          }
        }
      }
    } catch (err) {
      console.error("Pipeline error:", err);
    }
  };

  // Chat send
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/chat/rag/chat`,
        { query: userMessage.content },
        {
          withCredentials: true,
          headers: { "X-User-Id": userData?.userId },
        }
      );
      const botMessage = { role: "assistant", content: data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Failed to get a response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 🔒 Logout
  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout failed or already logged out:", err.message);
    } finally {
      await getUserData(); // resets context
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col relative">
      <Backdrop />

      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-slate-900/70 backdrop-blur-lg z-10 relative">
        <div className="flex items-center gap-2">
          <Stethoscope className="text-cyan-400" />
          <span className="font-bold text-lg">MedReport Assist</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/reports")}>Reports</button>
          <button onClick={() => navigate("/pricing")}>Pricing</button>
          <button onClick={() => navigate("/chat")}>Chat</button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold hover:shadow-lg hover:scale-105 transition"
            >
              <img
                src={userData?.avatar || "https://i.pravatar.cc/40"}
                alt="avatar"
                className="h-9 w-9 rounded-full border border-white/20"
              />
              <span className="hidden sm:inline">
                {userData?.name || "Profile"}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-lg shadow-lg z-20 animate-fadeIn">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-800 transition"
                >
                  <User className="h-4 w-4 text-cyan-400" /> Profile
                </button>
                <button
                  onClick={() => alert("⚙️ Settings page coming soon!")}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-800 transition"
                >
                  <Settings className="h-4 w-4 text-emerald-400" /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-800 text-red-400 transition"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 p-6 space-y-10 max-w-7xl mx-auto w-full">
        {/* Welcome */}
        <section className="text-center">
          <h1 className="text-3xl font-bold">
            Welcome back,{" "}
            <span className="text-cyan-400">{userData?.name || "Guest"}</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Your role: {userData?.role || "Patient"}
          </p>
        </section>

        {/* Upload */}
        <section className="relative rounded-2xl border border-dashed border-white/15 bg-gradient-to-br from-cyan-900/30 to-emerald-900/20 p-10 text-center overflow-hidden">
          {uploading && (
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 animate-[progress_2s_linear_infinite]" />
          )}

          {/* Limit reached message */}
          {limitReached ? (
            <div className="p-6 text-center space-y-4">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 animate-pulse" />
              <h2 className="text-xl font-semibold text-yellow-300">
                🚫 Free Plan Limit Reached
              </h2>
              <p className="text-sm text-neutral-300">
                You’ve used all your <span className="text-cyan-400">Free</span> uploads.
                Upgrade to unlock more reports and premium features!
              </p>
              <button
                onClick={() => navigate("/pricing")}
                className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold hover:scale-105 shadow-lg transition"
              >
                🚀 Upgrade Now
              </button>
            </div>
          ) : (
            <>
              <FileUp
                className={`mx-auto h-12 w-12 ${
                  uploading ? "text-emerald-400 animate-spin" : "text-cyan-400 animate-bounce"
                }`}
              />
              <p className="mt-2 text-sm text-neutral-300">
                Drag & drop your medical report or select below
              </p>
              <input
                id="reportUpload"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="mt-4 block w-full text-sm text-neutral-300"
                disabled={uploading}
              />
              <button
                onClick={onUpload}
                disabled={uploading || !file}
                className="mt-4 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 px-6 py-2 text-sm font-semibold text-black hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "⏳ Uploading..." : "Upload"}
              </button>
              {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
              {caseId && !error && (
                <p className="mt-3 text-green-400 text-sm">
                  ✅ Uploaded • Case ID: <span className="text-cyan-400">{caseId}</span>
                </p>
              )}
            </>
          )}
        </section>

        {/* Agent Outputs */}
        {caseId && (
          <section className="flex flex-col gap-6">
            <AgentPanel title="Summary Agent" icon={<BookOpen />} content={summaryOutput} />
            <AgentPanel title="Classifier Agent" icon={<ClipboardList />} content={classifierOutput} />
            <AgentPanel title="Explainer Agent" icon={<MessageSquare />} content={explainerOutput} />
            <AgentPanel title="Term Translator" icon={<ClipboardList />} content={translatorOutput} />
            <AgentPanel title="Advice Agent" icon={<Lightbulb />} content={adviceOutput} />
          </section>
        )}

        {/* Chatbot */}
        <section className="flex flex-col h-[500px] border border-white/10 rounded-2xl overflow-hidden">
          <header className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
            <MessageSquare className="text-cyan-400" />
            <h1 className="text-lg font-semibold">💬 MedReport Chatbot</h1>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <img
                    src="https://i.pravatar.cc/40?img=65"
                    alt="bot"
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div
                  className={`max-w-lg rounded-2xl px-4 py-2 text-sm whitespace-pre-line shadow-md ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-black"
                      : "bg-white/10 text-neutral-100"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <img
                    src={userData?.avatar || "https://i.pravatar.cc/40"}
                    alt="me"
                    className="h-8 w-8 rounded-full"
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 p-4 bg-slate-900">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type your message..."
                className="flex-1 resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 hover:scale-105 transition"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Agent output panel
function AgentPanel({ title, icon, content }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col hover:scale-[1.02] transition">
      <div className="flex items-center gap-2 mb-3 text-cyan-300">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="flex-1 text-sm text-neutral-200 overflow-y-auto whitespace-pre-line">
        {content || "Awaiting results..."}
      </div>
    </div>
  );
}

// Background
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
      <div className="absolute -top-40 -right-40 h-[40rem] w-[40rem] rounded-full blur-3xl bg-cyan-500/20 animate-pulse" />
      <div className="absolute -bottom-40 -left-40 h-[40rem] w-[40rem] rounded-full blur-3xl bg-emerald-500/20 animate-pulse" />
    </div>
  );
}
