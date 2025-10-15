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

      {/* Landing main */}
      <main className="flex-1 p-6 space-y-12 max-w-6xl mx-auto w-full">
        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Understand medical reports faster.
            </h1>
            <p className="mt-4 text-neutral-300 text-lg max-w-2xl">
              MedScribe Agent turns complex clinical reports into concise summaries,
              patient-friendly explanations, and actionable recommendations — so
              clinicians can triage faster and patients can act with confidence.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <button
                onClick={() => navigate('/dev')}
                className="px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold shadow-lg hover:scale-[1.03] transition"
              >
                Try now
              </button>

              <button
                onClick={() => navigate('/chat')}
                className="px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold shadow-lg hover:scale-[1.03] transition"
              >
                Chat now
              </button>

              <button
                onClick={() => navigate('/pricing')}
                className="px-5 py-3 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition"
              >
                View Pricing
              </button>
            </div>

            <div className="mt-8 flex gap-6">
              <div>
                <div className="text-2xl font-bold text-emerald-300">98%</div>
                <div className="text-xs text-neutral-400">Accuracy (avg.)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-300">2 min</div>
                <div className="text-xs text-neutral-400">Avg. summary time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-300">500+</div>
                <div className="text-xs text-neutral-400">Clinics using MedReport</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-6 border border-white/10 shadow-md">
            <div className="text-sm text-neutral-300 mb-3">Sample summary</div>
            <div className="bg-slate-900 p-4 rounded-md text-sm text-neutral-200 whitespace-pre-line">
              <div className="font-semibold text-emerald-300">Summary</div>
              <div className="mt-2">58-year-old female with controlled hypertension and T2DM. No acute findings on chest X-ray.</div>

              <div className="mt-3 font-semibold text-amber-300">Recommendations</div>
              <ul className="mt-1 list-disc list-inside text-neutral-300">
                <li>Continue metformin 500mg bd.</li>
                <li>Lifestyle modifications: low-sodium diet and daily walking.</li>
                <li>Follow-up in 3 months with HbA1c and BP check.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Key features</h2>
          <p className="text-sm text-neutral-400 mb-6">Designed to save time and improve patient understanding.</p>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6 text-cyan-300" />}
              title="Summarization"
              desc="Condensed, clinician-grade summaries that emphasize important findings."
            />

            <FeatureCard
              icon={<ClipboardList className="h-6 w-6 text-cyan-300" />}
              title="Classification"
              desc="Automatically tag reports by domain (cardio, endocrine, imaging, etc.) for fast triage."
            />

            <FeatureCard
              icon={<MessageSquare className="h-6 w-6 text-cyan-300" />}
              title="Explain terms"
              desc="Plain-language explanations of medical jargon for patients and caregivers."
            />

            <FeatureCard
              icon={<Lightbulb className="h-6 w-6 text-cyan-300" />}
              title="Actionable recommendations"
              desc="Patient-focused next steps, monitoring suggestions, and follow-up guidance."
            />

            <FeatureCard
              icon={<FileUp className="h-6 w-6 text-cyan-300" />}
              title="Secure ingestion"
              desc="Upload PDFs, text, or images; files are processed securely and can be exported."
            />

            <FeatureCard
              icon={<Stethoscope className="h-6 w-6 text-cyan-300" />}
              title="Integrations"
              desc="Exportable PDFs, EMR-friendly summaries, and a conversational interface (RAG/chat)."
            />
          </div>

          {/* Testimonials */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4">What users say</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-neutral-300">"Saved us hours per week during clinic — concise summaries are excellent."</div>
                <div className="mt-3 text-xs text-neutral-400">— Dr. A. Fernando, General Practitioner</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-neutral-300">"Patients appreciate the plain-language explanations. Great for follow-ups."</div>
                <div className="mt-3 text-xs text-neutral-400">— Nurse M. Silva</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-neutral-300">"Easy to integrate and export. Secure processing was key for our hospital."</div>
                <div className="mt-3 text-xs text-neutral-400">— IT Lead, City Hospital</div>
              </div>
            </div>
          </div>

          {/* About / Footer CTA */}
          <div className="mt-10 rounded-lg border border-white/10 bg-gradient-to-br from-cyan-900/10 to-emerald-900/5 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">About MedScribe Agent</h3>
              <p className="mt-2 text-neutral-300 max-w-xl">
                Built for clinicians and patients, MedScribe Agent combines secure document ingestion with specialized AI agents to produce actionable insights while preserving privacy. Integrates with your workflow and provides exportable summaries.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/features')} className="px-4 py-2 rounded bg-cyan-500 text-black font-semibold">Learn more</button>
              <button onClick={() => navigate('/pricing')} className="px-4 py-2 rounded border border-white/10">See pricing</button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
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

// Small feature card used on landing page
function FeatureCard({ title, desc, icon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 hover:scale-[1.02] transition">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-white/3">{icon}</div>
        <div>
          <div className="font-semibold text-cyan-300">{title}</div>
          <div className="text-sm text-neutral-300 mt-2">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="mt-12 border-t border-white/5 pt-6 text-sm text-neutral-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between gap-4">
        <div>
          <div className="font-semibold text-white">MedScribe Agent</div>
          <div className="mt-1">Secure medical report summarization & guidance</div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/privacy')} className="hover:underline">Privacy</button>
          <button onClick={() => navigate('/terms')} className="hover:underline">Terms</button>
          <button onClick={() => navigate('/contact')} className="hover:underline">Contact</button>
        </div>
      </div>
    </footer>
  );
}
