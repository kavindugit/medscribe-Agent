import React, { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const { backendUrl, userData } = useContext(AppContent);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const navigate = useNavigate();

  // 🔹 Simulate a payment and update plan
 const handleBuyPlan = (planType) => {
  if (!userData?.userId) {
    toast.error("Please log in to upgrade your plan.");
    navigate("/login");
    return;
  }
  navigate(`/payment/${planType}`);
};

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow">
            Choose the Plan That Fits Your Health Goals
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload your medical reports, get clear explanations, and track your
            progress — all in one secure, easy-to-use place.
          </p>
        </header>

        {/* Intro */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-white mb-2">
            Simple · Clear · Affordable
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Whether you view reports occasionally or manage ongoing care, pick
            the plan that suits your routine best.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Basic */}
          <PlanCard
            icon="🧭"
            name="Basic"
            price="Free Forever"
            priceClass="text-emerald-400"
            description="Great for occasional users who just want quick summaries of a few reports."
            allowance="Upload up to 3 reports per month"
            features={[
              { text: "Automatic report summaries in plain language", included: true },
              { text: "Meaning of key medical terms", included: true },
              { text: "Secure storage for your latest 3 reports", included: true },
              { text: "Downloadable PDF summary", included: false },
              { text: "Health-trend tracking", included: false },
              { text: "Email support", included: true },
            ]}
            button={{
              text: "You're on this plan",
              variant: "free",
              disabled: true,
            }}
          />

          {/* Health Pro */}
          <PlanCard
            icon="💊"
            name="HealthPro"
            price="LKR 1,500 / month"
            savings="or LKR 15,000 / year (Save LKR 3,000)"
            priceClass="text-cyan-400"
            description="Ideal for individuals with regular check-ups who need clear explanations for a few monthly reports."
            allowance="Upload and analyze up to 10 reports per month"
            features={[
              { text: "Detailed plain-language summaries", included: true },
              { text: "Basic trend view for recent tests", included: true },
              { text: "Store up to 20 reports securely", included: true },
              { text: "Download and print summaries", included: true },
              { text: "Standard email support", included: true },
              { text: "Faster processing queue", included: true },
            ]}
            button={{
              text: loadingPlan === "HealthPro" ? "Processing..." : "Buy Health Pro",
              variant: "popular",
              onClick: () => handleBuyPlan("HealthPro"),
              disabled: loadingPlan === "HealthPro",
            }}
            popular
          />

          {/* Premium Care */}
          <PlanCard
            icon="🌟"
            name="PremiumCare"
            price="LKR 3,000 / month"
            savings="or LKR 30,000 / year (Save LKR 6,000)"
            priceClass="text-blue-400"
            description="For those who want unlimited uploads, instant insights, and full access to every feature."
            allowance="Unlimited report uploads and instant analysis"
            features={[
              { text: "All features from HealthPro plus more", included: true },
              { text: "Instant processing with priority results", included: true },
              { text: "Advanced health insights and progress graphs", included: true },
              { text: "Unlimited secure storage", included: true },
              { text: "Download & share professional PDF summaries", included: true },
              { text: "Priority email support within 24 hours", included: true },
              { text: "Early access to new features and tools", included: true },
            ]}
            button={{
              text: loadingPlan === "PremiumCare" ? "Processing..." : "Upgrade to Premium",
              variant: "default",
              onClick: () => handleBuyPlan("PremiumCare"),
              disabled: loadingPlan === "PremiumCare",
            }}
          />
        </div>

        {/* Add-on Section */}
        <section className="bg-slate-800 p-8 rounded-2xl mb-16 shadow-lg border border-slate-600">
          <h3 className="text-2xl font-bold text-white text-center mb-4">
            Need to Upload More Reports?
          </h3>
          <p className="text-center text-slate-400 mb-8">
            Exceeded your monthly limit? Buy extra uploads anytime — no hidden fees.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <TokenPack name="Extra 3 Reports" price="LKR 500" />
            <TokenPack name="Extra 10 Reports" price="LKR 1,200" highlight="Better Value" />
            <TokenPack name="Extra 25 Reports" price="LKR 2,800" best />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-800 p-8 rounded-2xl mb-16 shadow-lg border border-slate-600">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h3>
          <FAQ
            icon="📄"
            q="What does the assistant actually do?"
            a="It reads your uploaded medical report and summarizes the key findings in simple language so you can understand your results better."
          />
          <FAQ
            icon="💰"
            q="How can I pay for a plan?"
            a="Payments can be made using credit or debit cards and local methods like eZ Cash, mCash, and Genie."
          />
          <FAQ
            icon="🔒"
            q="Is my data private and secure?"
            a="Yes — your reports are encrypted and stored safely. Only you can access them unless you choose to share."
          />
          <FAQ
            icon="⚕️"
            q="Does this replace seeing a doctor?"
            a="No. This tool helps you understand your reports, but it does not diagnose or treat. Always consult your doctor."
          />
          <FAQ
            icon="🔄"
            q="Can I change or cancel anytime?"
            a="Yes. You can upgrade, downgrade, or cancel your plan whenever you wish."
          />
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white p-12 rounded-2xl text-center shadow-lg">
          <h3 className="text-3xl font-bold mb-4">
            Understand Your Health with Confidence
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Start today — upload your first report and see how simple it is to get clear insights into your health.
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-cyan-700 rounded-lg font-semibold hover:scale-105 transition"
          >
            Create Your Free Account
          </a>
        </section>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */
function PlanCard({ icon, name, price, savings, priceClass, description, allowance, features, button, popular }) {
  return (
    <div
      className={`relative bg-slate-800 p-6 rounded-2xl shadow-md border transition hover:scale-105 ${
        popular ? "border-cyan-400 shadow-lg" : "border-slate-600"
      }`}
    >
      {popular && (
        <span className="absolute top-4 right-[-30px] bg-cyan-500 text-white text-xs font-bold px-6 py-1 transform rotate-45">
          MOST POPULAR
        </span>
      )}
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
      <p className={`text-lg font-semibold ${priceClass}`}>{price}</p>
      {savings && <p className="text-red-400 text-sm mb-2">{savings}</p>}
      <p className="text-slate-400 mb-4">{description}</p>
      <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 mb-4 text-sm">
        <strong className="text-cyan-400">Included:</strong> {allowance}
      </div>
      <ul className="mb-4 space-y-2 text-sm">
        {features.map((f, i) => (
          <li key={i} className={f.included ? "text-slate-200" : "text-slate-500"}>
            {f.included ? "✅" : "❌"} {f.text}
          </li>
        ))}
      </ul>
      <button
        onClick={button?.onClick}
        disabled={button?.disabled}
        className={`block w-full text-center py-3 rounded-lg font-semibold transition ${
          button.variant === "free"
            ? "bg-emerald-500 text-white cursor-not-allowed opacity-70"
            : button.variant === "popular"
            ? "bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg"
            : "bg-cyan-700 text-white hover:bg-cyan-800"
        }`}
      >
        {button.text}
      </button>
    </div>
  );
}

function TokenPack({ name, price, highlight, best }) {
  return (
    <div
      className={`p-6 text-center rounded-xl border-2 transition ${
        best
          ? "border-cyan-400 bg-slate-800 shadow-lg"
          : "border-slate-600 bg-slate-900 hover:border-cyan-400"
      }`}
    >
      {best && <div className="mb-2 inline-block bg-cyan-500 text-white px-3 py-1 rounded-full text-xs">Best Value</div>}
      <h4 className="text-lg font-semibold text-white mb-1">{name}</h4>
      <p className="text-cyan-400 font-bold text-xl">{price}</p>
      {highlight && <p className="text-emerald-500 text-sm font-semibold">{highlight}</p>}
    </div>
  );
}

function FAQ({ icon, q, a }) {
  return (
    <div className="border-b border-slate-600 pb-4 mb-4 last:border-0 last:pb-0">
      <h4 className="text-white font-semibold text-lg flex items-center mb-2">
        <span className="mr-2 text-xl">{icon}</span> {q}
      </h4>
      <p className="text-slate-400 text-sm">{a}</p>
    </div>
  );
}
