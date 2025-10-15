import React from "react";
import { useNavigate } from "react-router-dom";

export default function Features() {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "📝",
      title: "Summarizer",
      subtitle: "Plain-language summary",
      desc:
        "A concise, patient-friendly summary that highlights key results and explains what they mean.",
      how: [
        "Key findings listed up front",
        "Simple explanation of important values",
        "Shareable summary for your doctor",
      ],
    },
    {
      icon: "🧭",
      title: "Classifier",
      subtitle: "Organize findings",
      desc:
        "Groups report content by medical domain (e.g., blood, imaging, cardiovascular) so you can quickly see relevant sections.",
      how: ["Groups results by specialty", "Flags items that may need attention", "Makes long reports easy to scan"],
    },
    {
      icon: "💡",
      title: "Explainer",
      subtitle: "Glossary & explanations",
      desc:
        "Provides simple explanations for medical terms and links each definition back to where it appears in your report.",
      how: ["Plain-language definitions", "Short contextual examples", "Linked to report locations"],
    },
    {
      icon: "⚕️",
      title: "Advicer",
      subtitle: "Practical next steps",
      desc:
        "Non-prescriptive, empathetic suggestions such as lifestyle tips, follow-up ideas, and when to seek urgent care.",
      how: ["Actionable tips", "Follow-up recommendations", "Highlights urgent items"],
    },
    {
      icon: "🔁",
      title: "Translate Summarizer",
      subtitle: "Bilingual summaries",
      desc:
        "Translates the generated summary into Sinhala (or English) so non-English speakers can understand their results easily.",
      how: ["Sinhala ↔ English summaries", "Preserves clinical meaning", "Easy to share with family or providers"],
    },
    {
      icon: "🌐",
      title: "Translate Advicer",
      subtitle: "Bilingual advice",
      desc:
        "Translates the suggested next steps and advice between English and Sinhala while keeping the tone supportive and clear.",
      how: ["Sinhala ↔ English advice", "Neutral, empathetic tone", "Keeps medical nuance intact"],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Features</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Learn what each tool does and how to use it — from uploading reports
            to getting clear summaries, translations, and helpful next steps.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {cards.map((c, i) => (
            <div
              key={i}
              className="bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-600 hover:scale-105 transition"
            >
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{c.title}</h3>
              <p className="text-slate-400 mb-3 text-sm">{c.subtitle}</p>
              <p className="text-slate-300 mb-3 text-sm">{c.desc}</p>
              <ul className="text-sm text-slate-200 space-y-1 mb-4">
                {c.how.map((h, idx) => (
                  <li key={idx}>• {h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-600 mb-12">
          <h3 className="text-2xl font-bold text-white mb-4">How to use these features</h3>
          <ol className="list-decimal list-inside text-slate-300 space-y-2">
            <li>Upload your report from the Home page. Supported: PDF, JPG, PNG.</li>
            <li>Wait for the pipeline to run — you’ll see Summary, Classifier, Explainer, Translator, and Advice panels.</li>
            <li>Use the Term Translator to get Sinhala translations where needed.</li>
            <li>Download or share the generated PDF summaries (available on paid plans).</li>
          </ol>
        </section>

        <section className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white p-8 rounded-2xl text-center shadow-lg">
          <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
          <p className="mb-4 text-slate-100/90">Create a free account and upload your first report.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="px-6 py-2 bg-white text-cyan-700 rounded-lg font-semibold">Sign up</button>
            <button onClick={() => navigate('/pricing')} className="px-6 py-2 bg-cyan-800 text-white rounded-lg">See pricing</button>
          </div>
        </section>
      </div>
    </div>
  );
}
