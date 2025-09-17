import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";


export default function ChatBot({topK = 5 }) {
  const { backendUrl, userData } = useContext(AppContent);

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState({ show: false, kind: "error", msg: "" });
  const viewportRef = useRef(null);

  const user = useMemo(
    () => ({
      id: userData?.userId || "anon",
      name: userData?.name || "You",
      avatar: userData?.avatar || "https://i.pravatar.cc/100?img=14",
    }),
    [userData]
  );

  useEffect(() => {
    // Seed a greeting
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I can answer questions about your medical reports, translate terms, and summarize findings. What would you like to know?",
          ts: new Date().toISOString(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto scroll
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  function openToast(kind, msg) {
    setToast({ show: true, kind, msg });
    clearTimeout(openToast._t);
    openToast._t = setTimeout(() => setToast({ show: false, kind, msg: "" }), 2600);
  }

  const sendMessage = async () => {
  const text = query.trim();
  if (!text || isSending) return;

  const userMsg = { role: "user", content: text, ts: new Date().toISOString() };
  setMessages((m) => [...m, userMsg]);
  setQuery("");
  setIsSending(true);

  try {
    const res = await axios.post(
      `${backendUrl || "http://localhost:4000"}/api/rag/chat`,
      { query: text, top_k: topK },
      { headers: { "X-User-Id": user.id } }
    );

    const answer = res?.data?.answer || "I couldn't find an answer for that.";
    const sources = res?.data?.sources || [];

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: answer,
        sources,
        ts: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    openToast("error", "⚠️ Network error while contacting the chatbot");
    // ❌ No extra assistant messages here
  } finally {
    setIsSending(false);
  }
};


  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-2rem)] max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-950/90 p-4 text-white shadow-xl">
      {/* Toast */}
      {toast.show && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-50 min-w-[240px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${
            toast.kind === "error" ? "border-rose-400/30 bg-rose-500/10" : "border-emerald-400/30 bg-emerald-500/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{toast.kind === "error" ? "⚠️" : "✅"}</div>
            <p className="text-sm leading-snug text-white/90">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 hover:border-cyan-400"
            title="Back"
          >
            <BackIcon />
          </button>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Chatbot</h2>
            <p className="text-xs text-neutral-300">Ask in English or Sinhala • Cited where possible</p>
          </div>
        </div>

        
      </header>

      {/* Messages viewport */}
      <div
        ref={viewportRef}
        className="relative flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-gradient-to-b from-neutral-950/60 to-neutral-950/20 p-3"
      >
        {messages.map((m, idx) => (
          <MessageBubble key={idx} m={m} user={user} />
        ))}
        {isSending && <TypingIndicator />}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 z-10 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            className="max-h-40 w-full resize-none rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
          <button
            onClick={sendMessage}
            disabled={isSending || !query.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SendIcon />
            Send
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Top‑K: {topK}</span>
          <span>Privacy-first • MedReport Assist</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, user }) {
  const isUser = m.role === "user";
  const time = new Date(m.ts || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <img
        src={isUser ? user.avatar : "https://i.pravatar.cc/100?img=68"}
        alt={isUser ? "You" : "Bot"}
        className="mt-0.5 h-8 w-8 rounded-full ring-2 ring-white/10"
      />
      <div className={`max-w-[75%] rounded-2xl border p-3 text-sm shadow-sm ${
        isUser
          ? "border-cyan-400/20 bg-cyan-500/10"
          : "border-white/10 bg-white/5"
      }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed text-neutral-200">{m.content}</div>
        {Array.isArray(m.sources) && m.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {m.sources.map((s, i) => (
              <span key={i} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-300">
                {s.title || s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1 text-[10px] text-neutral-400">{isUser ? "You" : "Bot"} • {time}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1 text-neutral-300">
      <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
      <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
      <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.2s]" />
      <span className="text-xs">Bot is typing…</span>
    </div>
  );
}

/* == Icons (inline) == */
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-200">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-900">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}
