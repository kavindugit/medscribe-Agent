// frontend/src/pages/ChatPage.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";

export default function ChatPage() {
  const { backendUrl, userData } = useContext(AppContent);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/conversations`, {
          withCredentials: true,
          headers: { "X-User-Id": userData?.userId },
        });
        if (data.success) {
          const formatted = data.history.map((m) => [
            { role: "user", content: m.query, timestamp: m.timestamp },
            { role: "assistant", content: m.answer, timestamp: m.timestamp },
          ]);
          setMessages(formatted.flat());
        }
      } catch (err) {
        console.error("Failed to load conversation history", err);
      }
    };
    if (userData?.userId) fetchHistory();
  }, [backendUrl, userData]);

  // Send message
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
    } catch (err) {
      console.error("Chat error", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Failed to get a response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear history
  const handleClear = async () => {
    if (!window.confirm("Clear entire chat history?")) return;
    setClearing(true);
    try {
      await axios.delete(`${backendUrl}/api/chat/conversations`, {
        withCredentials: true,
        headers: { "X-User-Id": userData?.userId },
      });
      setMessages([]);
    } catch (err) {
      console.error("Clear chat error", err);
      alert("Failed to clear history.");
    } finally {
      setClearing(false);
    }
  };

  // Handle Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">💬 MedReport Chatbot</h1>
          <p className="text-xs text-neutral-400">Private • Safe • Cited</p>
        </div>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="rounded-lg border border-red-400 px-3 py-1 text-sm text-red-400 hover:bg-red-400 hover:text-black disabled:opacity-50"
        >
          {clearing ? "Clearing..." : "Clear Chat"}
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-lg rounded-2xl px-4 py-2 text-sm whitespace-pre-line ${
                m.role === "user"
                  ? "bg-cyan-600 text-white"
                  : "bg-white/10 text-neutral-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
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
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
