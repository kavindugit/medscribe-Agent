// frontend/src/pages/Dev.jsx (cloned from HomePage.jsx)
import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import jsPDF from "jspdf";
import {
  Stethoscope,
  FileUp,
  MessageSquare,
  LogOut,
  Settings,
  User,
  AlertTriangle,
  Copy as CopyIcon,
  Loader2,
  Download,
} from "lucide-react";

export default function Dev() {
  const navigate = useNavigate();
  const { backendUrl, userData, getUserData, usage } = useContext(AppContent);

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
  const [cleanedText, setCleanedText] = useState("");
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Agent card state
  const [cardOutputs, setCardOutputs] = useState({
    explanation: "",
    recommendation: "",
    summary: "",
    summaryTranslation: "",
    classification: "",
    adviceTranslation: "",
  });
  const [cardExpanded, setCardExpanded] = useState({
    explanation: false,
    recommendation: false,
    summary: false,
    summaryTranslation: false,
    classification: false,
    adviceTranslation: false,
  });
  const [cardLoading, setCardLoading] = useState({
    explanation: false,
    recommendation: false,
    summary: false,
    summaryTranslation: false,
    classification: false,
    adviceTranslation: false,
  });

  // FastAPI base (CORS allowed in ai_services)
  const backendAI = "http://localhost:8001";

  // Agent outputs removed

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
  const onUpload = async (fileOverride = null) => {
    const selectedFile = fileOverride || file;
    if (!selectedFile) return alert("Please select a PDF or image file.");
    if (!userData?.userId) return alert("Please log in first.");

    // client-side guard using context usage
    if (usage?.remainingReports === 0) {
      setLimitReached(true);
      return;
    }

    const form = new FormData();
    form.append("file", selectedFile);

    try {
      setUploading(true);
      setError("");

      // 1) Upload the file → create case in backend
      const { data } = await axios.post(${backendUrl}/api/cases, form, {
        withCredentials: true,
        headers: { "X-User-Id": userData.userId },
      });

      if (!data || !data.case_id) throw new Error("Invalid response from server.");

      setCaseId(data.case_id);

      // Fetch cleaned report text for this case (used by cards)
      try {
        const cleaned = await axios.get(
          ${backendUrl}/api/cases/${data.case_id}/cleaned,
          {
            withCredentials: true,
            headers: { "X-User-Id": userData.userId },
          }
        );
        const ct = cleaned?.data?.cleaned_text || "";
        setCleanedText(ct);
      } catch (e) {
        console.warn("Failed to fetch cleaned text:", e?.message);
      }

      // Clear the file input
      setFile(null);
      document.getElementById("reportUpload").value = "";
    } catch (err) {
      console.error("❌ Upload Error:", err?.response?.data || err.message);
      if (err?.response?.status === 403) {
        // backend checkPlanLimit blocked it
        setLimitReached(true);
      } else {
        setError("⚠ Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // Helpers for cards
  const ensureCleanedText = async () => {
    if (cleanedText) return cleanedText;
    if (!caseId) throw new Error("No caseId");
    const cleaned = await axios.get(
      ${backendUrl}/api/cases/${caseId}/cleaned,
      {
        withCredentials: true,
        headers: { "X-User-Id": userData.userId },
      }
    );
    const ct = cleaned?.data?.cleaned_text || "";
    setCleanedText(ct);
    return ct;
  };

  const makeFormWithText = (text) => {
    const file = new File([text], "report.txt", { type: "text/plain" });
    const form = new FormData();
    form.append("file", file);
    return form;
  };

  const setCardLoadingState = (key, val) =>
    setCardLoading((prev) => ({ ...prev, [key]: val }));
  const setExpanded = (key, val) =>
    setCardExpanded((prev) => ({ ...prev, [key]: val }));
  const setOutput = (key, val) =>
    setCardOutputs((prev) => ({ ...prev, [key]: val }));

  const generatePDF = (title, content, type) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
  
    // Lighter Header Background and Styling
    const headerHeight = 50;
    doc.setFillColor(240, 242, 255); // Light gray-blue background
    doc.rect(margin, 15, pageWidth - (margin * 2), headerHeight, 'F'); // Header background
  
    // Header Branding: MedScribe
    doc.setFont('helvetica', 'bold'); // Set font to Helvetica bold
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue text color for branding
    doc.text('MedScribe', margin + 10, 30); // Positioned for a clean look
  
    // Subtitle: AI-Powered Medical Report Analysis
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal'); // Set font to Helvetica normal
    doc.setTextColor(100, 100, 100); // Gray text for the subtitle
    doc.text('AI-Powered Medical Report Analysis', margin + 10, 40); // Positioned beneath the logo
  
    // User Info: Generated on, User Name, Case ID (aligned to the right side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal'); // Ensure normal font for this section
    doc.setTextColor(100, 100, 100); // Light gray text for the additional info
    const currentDate = new Date().toLocaleDateString();
    doc.text(Generated on: ${currentDate}, pageWidth - margin - 90, 30); // Positioned at the top right
    doc.text(User: ${userData?.name || 'Guest'}, pageWidth - margin - 90, 35);
    doc.text(Case ID: ${caseId || 'N/A'}, pageWidth - margin - 90, 40);
  
    // Title Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold'); // Set to bold for the title
    doc.setTextColor(0, 0, 0); // Black text for the title
    doc.text(title, margin, 75); // Title positioned just below the header
  
    // Content Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal'); // Set to normal font for content
    doc.setTextColor(0, 0, 0); // Black text color for content
  
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(content, contentWidth);
    let yPosition = 85;
  
    // Add content with page breaks
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - 40) { // Leave space for footer
        doc.addPage();
        yPosition = 20;
      }
      doc.text(lines[i], margin, yPosition);
      yPosition += 6;
    }
  
    // Footer Section
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
  
      // Footer line
      doc.setDrawColor(200, 200, 200); // Light gray footer line
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
  
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal'); // Ensure normal font for footer text
      doc.setTextColor(100, 100, 100); // Light gray text for footer
      doc.text('MedScribe - AI-Powered Medical Analysis', margin, pageHeight - 15);
      doc.text(Page ${i} of ${pageCount}, pageWidth - margin - 20, pageHeight - 15);
      doc.text('Generated by MedScribe System', margin, pageHeight - 10);
    }
  
    // Save the PDF
    const fileName = ${title.replace(/\s+/g, '_')}_${caseId || 'report'}_${new Date().toISOString().split('T')[0]}.pdf;
    doc.save(fileName);
  };
  
  

  // Generic runner for a card
  const runCard = async (key, endpoint, extract) => {
    try {
      setError("");
      setCardLoadingState(key, true);
      const text = await ensureCleanedText();
      if (!text) throw new Error("Cleaned text is empty.");
      const form = makeFormWithText(text);
      const { data } = await axios.post(${backendAI}${endpoint}, form);
      const out = extract(data);
      setOutput(key, out);
      setExpanded(key, true);
    } catch (err) {
      console.error(${key} error:, err?.response?.data || err.message);
      setError(Failed to run ${key}.);
    } finally {
      setCardLoadingState(key, false);
    }
  };

  // Agent UI removed per request

  // Chat send
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        ${backendUrl}/api/chat/rag/chat,
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
        { role: "assistant", content: "⚠ Failed to get a response." },
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
      await axios.post(${backendUrl}/api/auth/logout, {}, { withCredentials: true });
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
                  onClick={() => alert("⚙ Settings page coming soon!")}
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
        <section className="relative">
          {limitReached ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-gradient-to-br from-cyan-900/30 to-emerald-900/20 p-10 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 animate-pulse" />
              <h2 className="text-xl font-semibold text-yellow-300 mt-3">🚫 Free Plan Limit Reached</h2>
              <p className="text-sm text-neutral-300 mt-1">You’ve used all your <span className="text-cyan-400">Free</span> uploads. Upgrade to unlock more reports and premium features!</p>
              <button onClick={() => navigate("/pricing")} className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold">🚀 Upgrade Now</button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
              className={rounded-2xl border-2 border-dashed p-8 text-center transition ${dragActive ? 'border-cyan-400 bg-slate-900/60' : 'border-white/10 bg-slate-900/40'}}>

              <div className="flex items-center justify-center h-40 rounded-lg">
                <div className="text-center w-full">
                  <FileUp className={`mx-auto h-12 w-12 ${
                    uploading ? "text-emerald-400 animate-spin" : "text-cyan-400 animate-bounce"
                  }`} />
                  <h3 className="mt-3 text-lg font-semibold">Upload sources</h3>
                  <p className="mt-1 text-sm text-neutral-400">Drag & drop or <button type="button" onClick={() => fileInputRef.current?.click()} className="text-cyan-400 underline">choose file</button> to upload</p>
                  <p className="mt-3 text-xs text-neutral-500">Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                id="reportUpload"
                type="file"
                accept="application/pdf,image/,text/plain,.md,audio/"
                onChange={async (e) => {
                  const picked = e.target.files?.[0];
                  if (picked) {
                    setFile(picked);
                    await onUpload(picked);
                  }
                }}
                className="hidden"
                disabled={uploading}
              />

              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="text-sm text-neutral-300">{file ? file.name : "No file chosen"}</div>
                <button
                  type="button"
                  aria-label="Choose file to upload"
                  title="Choose file"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500 text-black shadow-md hover:shadow-lg hover:scale-105 transition"
                >
                  <FileUp className="h-5 w-5" />
                </button>
                <button onClick={async () => { await onUpload(); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={uploading || !file} className="px-4 py-2 rounded bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold disabled:opacity-50">{uploading ? "⏳ Uploading..." : "Upload"}</button>
              </div>

              {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
              {caseId && !error && <p className="mt-3 text-green-400 text-sm">✅ Uploaded • Case ID: <span className="text-cyan-400">{caseId}</span></p>}
            </div>
          )}
        </section>

        {/* Agent Actions + Outputs removed */}

        {/* Agent Cards (6) - single column, reordered per request */}
        {caseId && (
          <section className="flex flex-col gap-4">
            <AgentCard
              title="Summary"
              description="Summarize the report and key findings."
              loading={cardLoading.summary}
              expanded={cardExpanded.summary}
              onToggle={() => setExpanded("summary", !cardExpanded.summary)}
              onRun={() =>
                runCard("summary", "/summary/process", (d) =>
                  d?.toned_summary || d?.summary || ""
                )
              }
               output={cardOutputs.summary}
               render={renderSummary}
               copyable
               onDownload={generatePDF}
            />

            <AgentCard
              title="Classification"
              description="Classify the report across health domains."
              loading={cardLoading.classification}
              expanded={cardExpanded.classification}
              onToggle={() => setExpanded("classification", !cardExpanded.classification)}
              onRun={() =>
                runCard("classification", "/classify/process-medical-report", (d) =>
                  // Only return the human_readable field (either top-level or nested under classification)
                  (() => {
                    const hr = d?.human_readable || d?.classification?.human_readable;
                    if (hr) return String(hr).replace(/\\n/g, "\n");
                    return "No human readable classification available.";
                  })()
                )
              }
              output={cardOutputs.classification}
              render={renderClassification}
              copyable
              onDownload={generatePDF}
            />

            <AgentCard
              title="Explanation"
              description="Explain medical terms in plain language."
              loading={cardLoading.explanation}
              expanded={cardExpanded.explanation}
              onToggle={() => setExpanded("explanation", !cardExpanded.explanation)}
              onRun={() =>
                runCard("explanation", "/explain/process", (d) =>
                  (() => {
                    // Accept either human_readable (if backend adds later) or explanations object/string
                    if (d?.human_readable) return String(d.human_readable).replace(/\\n/g, "\n");
                    const expl = d?.explanations;
                    if (!expl) return "No explanations available.";
                    if (typeof expl === 'string') return expl.replace(/\\n/g, "\n");
                    if (typeof expl === 'object') {
                      // Build a readable list: Term: explanation
                      return Object.entries(expl)
                        .map(([term, text]) => ${term}: ${String(text).trim()})
                        .join("\n\n");
                    }
                    return String(expl);
                  })()
                )
              }
              output={cardOutputs.explanation}
              render={renderExplanations}
              copyable
              onDownload={generatePDF}
            />

            <AgentCard
              title="Recommendation"
              description="Generate patient-friendly recommendations."
              loading={cardLoading.recommendation}
              expanded={cardExpanded.recommendation}
              onToggle={() => setExpanded("recommendation", !cardExpanded.recommendation)}
              onRun={() =>
                runCard("recommendation", "/advice/process", (d) =>
                  d?.toned_recommendations || d?.recommendations || ""
                )
              }
               output={cardOutputs.recommendation}
               render={renderRecommendations}
               copyable
               onDownload={generatePDF}
            />

            <AgentCard
              title="Summary Translation"
              description="Translate the summary to Sinhala."
              loading={cardLoading.summaryTranslation}
              expanded={cardExpanded.summaryTranslation}
              onToggle={() =>
                setExpanded("summaryTranslation", !cardExpanded.summaryTranslation)
              }
              onRun={() =>
                runCard("summaryTranslation", "/translate-summary/process", (d) => d?.translation || "")
              }
               output={cardOutputs.summaryTranslation}
               render={renderTranslation}
               copyable
              //  onDownload={generatePDF}
            />

            <AgentCard
              title="Advice Translation"
              description="Translate the advice to Sinhala."
              loading={cardLoading.adviceTranslation}
              expanded={cardExpanded.adviceTranslation}
              onToggle={() =>
                setExpanded("adviceTranslation", !cardExpanded.adviceTranslation)
              }
              onRun={() =>
                runCard("adviceTranslation", "/translate-advice/process", (d) => d?.translation || "")
              }
               output={cardOutputs.adviceTranslation}
               render={renderTranslation}
               copyable
              //  onDownload={generatePDF}
            />
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

// Reusable Agent Card
function AgentCard({ title, description, loading, onRun, output, expanded, onToggle, plain = false, render, copyable = false, onDownload }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-cyan-300">{title}</div>
          <div className="text-xs text-neutral-400">{description}</div>
        </div>
        <div className="flex items-center gap-2">
          {copyable && output && (
            <button
              onClick={handleCopy}
              className={rounded-md px-2 py-1 text-xs flex items-center gap-1 ${copied ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20'}}
              title="Copy to clipboard"
            >
              <CopyIcon className="h-3 w-3" /> {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {output && onDownload && (
            <button
              onClick={() => onDownload(title, output)}
              className="rounded-md px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center gap-1"
              title="Download as PDF"
            >
              <Download className="h-3 w-3" /> PDF
            </button>
          )}
          {output && (
            <button
              onClick={onToggle}
              className="rounded-md px-3 py-1 text-xs bg-white/10 hover:bg-white/20"
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          )}
          <button
            onClick={onRun}
            disabled={loading}
            className="rounded-md px-3 py-1 text-xs font-semibold bg-gradient-to-r from-cyan-400 to-emerald-500 text-black disabled:opacity-50 flex items-center gap-1"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "Processing" : "Run"}
          </button>
        </div>
      </div>
      {/* Skeleton while loading & expanded but no output yet */}
      {expanded && loading && !output && (
  <div className="mt-4 space-y-3 animate-pulse">
          <div className="h-4 w-1/3 rounded bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-5/6 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
          <div className="h-3 w-3/4 rounded bg-white/10" />
        </div>
      )}
      {output && expanded && !loading && (
        render ? render(output) : (
          plain ? (
            <div className="mt-3 whitespace-pre-line text-sm text-neutral-200">{output}</div>
          ) : (
            <pre className="mt-3 whitespace-pre-wrap text-sm text-neutral-200">{output}</pre>
          )
        )
      )}
    </div>
  );
}

// Classification formatting renderer
function renderClassification(raw) {
  // Split into sections by blank lines
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headingRegex = /^(Overall Classification:)/i;
  const domainRegex = /^([A-Za-z0-9 /]+(?:\s?\/?[A-Za-z0-9 ])):$/;
  let currentDomain = null;
  const domains = [];
  let overall = null;
  for (let i=0;i<lines.length;i++) {
    const line = lines[i].trim();
    if (headingRegex.test(line)) {
      overall = line.replace(/Overall Classification:\s*/i, '').trim();
      continue;
    }
    if (domainRegex.test(line.trim())) {
      currentDomain = { name: line.replace(/:$/, ''), items: [] };
      domains.push(currentDomain);
      continue;
    }
    // Match list lines possibly with leading spaces: - Level: ... or - Explanation: ...
    if (/^-\s*Level:/i.test(line) || /^-\s*Explanation:/i.test(line)) {
      if (!currentDomain) {
        currentDomain = { name: 'General', items: [] };
        domains.push(currentDomain);
      }
      currentDomain.items.push(line.replace(/^-\s*/, '').trim());
      continue;
    }
    // Handle Missing data items (bullets without colon lines aggregated under domain 'Missing data')
    // Skip "Missing data" section entirely per latest requirement.
    if (/^Missing data:?/i.test(line)) {
      currentDomain = null; // do not collect
      continue;
    }
  }
  return (
  <div className="mt-4 space-y-4 text-sm text-neutral-200 pr-2">
      {overall && (
        <div className="rounded-md bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 px-4 py-2">
          <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Overall Classification</div>
          <div className="font-semibold text-emerald-300">{overall}</div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {domains.filter(d => !/Missing data/i.test(d.name)).map(d => (
          <div key={d.name} className="rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="font-semibold text-cyan-300 mb-1">{d.name}</div>
            <ul className="space-y-1 list-disc list-inside">
              {d.items.map((it, idx) => {
                const parts = it.split(/:\s*/);
                const label = parts.shift();
                const value = parts.join(': ').trim();
                const isLevel = /Level/i.test(label);
                let badge = null;
                if (isLevel) {
                  if (/Normal|Controlled/i.test(value)) badge = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
                  else if (/Mild|Moderate/i.test(value)) badge = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
                  else if (/Severe|Critical|High/i.test(value)) badge = 'bg-red-500/20 text-red-300 border-red-400/30';
                }
                return (
                  <li key={idx} className="">
                    <span className="font-medium text-emerald-300/90">{label}:</span>{' '}
                    {isLevel && badge ? (
                      <span className={inline-block px-2 py-0.5 rounded text-xs font-medium border align-middle ${badge}}>{value}</span>
                    ) : (
                      <span className="text-neutral-300 leading-relaxed">{value}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// Explanations formatting renderer
function renderExplanations(raw) {
  const pairs = raw.split(/\n\n+/).map(block => {
    const idx = block.indexOf(':');
    if (idx === -1) return null;
    return { term: block.slice(0, idx).trim(), text: block.slice(idx + 1).trim() };
  }).filter(Boolean);
  if (!pairs.length) {
    return <div className="mt-3 whitespace-pre-line text-sm text-neutral-300 max-h-[38rem] overflow-auto pr-2">{raw}</div>;
  }
  return (
    <div className="mt-4 space-y-3 text-sm pr-2 max-h-[38rem] overflow-auto">
      {pairs.map(p => (
        <div key={p.term} className="group rounded-md border border-white/10 bg-white/5 p-3 hover:border-cyan-400/40 transition">
          <div className="font-medium text-cyan-300 mb-1">{p.term}</div>
          <div className="text-neutral-300 leading-relaxed">{p.text}</div>
        </div>
      ))}
    </div>
  );
}

// Summary renderer
function renderSummary(raw) {
  if (!raw) return null;
  const sections = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  return (
  <div className="mt-4 space-y-4 text-sm pr-2">
      {sections.map((sec, idx) => {
        const lines = sec.split(/\n/).filter(Boolean);
        let firstLine = lines[0];
        // Strip bold markdown *Heading:* or *Heading* patterns
        firstLine = firstLine.replace(/^\\(.+?)\\:?$/, '$1:').replace(/^\\(.+?)\\/,'$1');
        const heading = firstLine.length < 80 ? firstLine : null;
        const body = heading ? lines.slice(1).join('\n') : sec;
        return (
          <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-4">
            {heading && <div className="font-semibold text-cyan-300 mb-1">{heading}</div>}
            <div className="whitespace-pre-line leading-relaxed text-neutral-300">{body}</div>
          </div>
        );
      })}
    </div>
  );
}

// Recommendations renderer
function renderRecommendations(raw) {
  if (!raw) return null;
  // Try to parse bullet-like lines
  const lines = raw.split(/\n/).map(l => l.trim()).filter(Boolean);
  const items = [];
  let buffer = [];
  lines.forEach(l => {
    if (/^(?:-|\d+\.|•)/.test(l)) {
      if (buffer.length) { items.push(buffer.join(' ')); buffer = []; }
      buffer.push(l.replace(/^(?:-|\d+\.|•)\s*/, ''));
    } else buffer.push(l);
  });
  if (buffer.length) items.push(buffer.join(' '));
  if (!items.length) return <div className="mt-3 whitespace-pre-line text-sm text-neutral-300">{raw}</div>;

  // Basic categorization heuristics
  const categories = {
    Lifestyle: [],
    Medication: [],
    Monitoring: [],
    FollowUp: [],
    Other: [] // will not be rendered per latest requirement
  };
  const lifestyleRegex = /(diet|exercise|activity|weight|smoking|alcohol|nutrition|walk|lifestyle)/i;
  const medicationRegex = /(medication|dose|metformin|statin|drug|therapy|take|start|continue)/i;
  const monitoringRegex = /(monitor|check|track|log|measure|follow your levels|blood pressure|glucose)/i;
  const followRegex = /(follow-up|consult|see your doctor|appointment|refer|specialist|cardiologist)/i;

  items.forEach(text => {
    // Remove markdown bold wrappers from bullet lines
    text = text.replace(/^\\(.+?)\\:?$/, '$1').replace(/\\/g,'');
    if (lifestyleRegex.test(text)) categories.Lifestyle.push(text);
    else if (medicationRegex.test(text)) categories.Medication.push(text);
    else if (monitoringRegex.test(text)) categories.Monitoring.push(text);
    else if (followRegex.test(text)) categories.FollowUp.push(text);
    else categories.Other.push(text);
  });

  const order = ['Lifestyle','Medication','Monitoring','FollowUp']; // exclude Other visually
  const iconMap = {
    Lifestyle: '🥗',
    Medication: '💊',
    Monitoring: '🩺',
    FollowUp: '📅',
    Other: '➤'
  };

  return (
  <div className="mt-4 space-y-5 text-sm pr-2">
      {order.filter(cat => categories[cat].length).map(cat => (
        <div key={cat} className="rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{iconMap[cat]}</span>
              <h4 className="font-semibold text-cyan-300 tracking-wide text-sm uppercase">{cat.replace(/FollowUp/,'Follow-Up')}</h4>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">{categories[cat].length}</span>
          </div>
          <ul className="space-y-2">
            {categories[cat].map((rec, idx) => {
              // Highlight entire label before first colon, if present
              const colonIdx = rec.indexOf(':');
              let label = null; let remainder = rec;
              if (colonIdx > -1 && colonIdx < 120) {
                label = rec.slice(0, colonIdx).trim();
                remainder = rec.slice(colonIdx + 1).trim();
              }
              return (
                <li key={idx} className="group relative pl-3">
                  <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 group-hover:scale-125 transition" />
                  <span className="text-neutral-300 leading-relaxed">
                    {label ? <><span className="font-semibold text-emerald-300">{label}</span>: {remainder}</> : rec}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Translation renderer (generic)
function renderTranslation(raw) {
  if (!raw) return null;
  // Basic cleanup
  const cleaned = raw.replace(/\\/g, '').trim();
  const paragraphs = cleaned.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const bullets = [];
  const finalParas = [];
  paragraphs.forEach(p => {
    const lines = p.split(/\n/);
    if (lines.every(l => /^[-•]/.test(l.trim()))) {
      lines.forEach(l => bullets.push(l.replace(/^[-•]\s*/, '').trim()));
    } else {
      finalParas.push(p.replace(/\n/g,' '));
    }
  });
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  return (
  <div className="mt-4 space-y-4 text-sm pr-2">
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-300">Translation</span>
        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{wordCount} words</span>
      </div>
      {finalParas.map((p,i) => (
        <p key={i} className="leading-relaxed text-neutral-200">{p}</p>
      ))}
      {!!bullets.length && (
        <ul className="list-disc list-inside space-y-1 text-neutral-200">
          {bullets.map((b,i)=>(<li key={i}>{b}</li>))}
        </ul>
      )}
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