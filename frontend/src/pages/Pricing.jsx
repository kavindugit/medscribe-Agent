// frontend/src/pages/Pricing.jsx
import React from "react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Section */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow">
            Choose the Plan That Empowers Your Health Journey
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Understand your medical reports instantly, track your health over
            time, and get AI-powered insights. All data is securely stored in
            your personal account.
          </p>
        </header>

        {/* Plans Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-white mb-2">
            The Plans: Simple, Transparent, and Affordable
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            We use a token system for fairness. 1 Token processes about one page
            of a medical report. It’s simple and you only pay for what you use.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Explorer Plan */}
          <PlanCard
            icon="🧭"
            name="Explorer"
            price="Free Forever"
            priceClass="text-emerald-400"
            description="Perfect for your annual check-up or a one-time report analysis."
            allowance="50 Tokens (Enough for 2-4 reports)"
            features={[
              { text: "AI-Powered Report Summary & Classification", included: true },
              { text: "Basic Translation to Sinhala/Tamil", included: true },
              { text: "Secure Storage for your 3 most recent reports", included: true },
              { text: "AI Health Assistant (Chatbot)", included: false },
              { text: "Long-term Health Tracking", included: false },
              { text: "Exportable PDF Reports", included: false },
            ]}
            button={{ text: "Get Started for Free", variant: "free" }}
          />

          {/* Health Pro Plan */}
          <PlanCard
            icon="💊"
            name="Health Pro"
            price="LKR 1,500 / month"
            savings="or LKR 15,000 / year (Save LKR 3,000!)"
            priceClass="text-cyan-400"
            description="Ideal for managing chronic conditions like diabetes or hypertension with regular reports."
            allowance="300 Tokens (Enough for 15-30 reports)"
            features={[
              { text: "Full Access to the AI Health Assistant: Ask unlimited questions", included: true },
              { text: "Longitudinal Analysis: Track key metrics over time", included: true },
              { text: "Unlimited Secure Storage for all your reports", included: true },
              { text: "Export & Share professional PDF summaries", included: true },
              { text: "Priority Email & Chat Support", included: true },
            ]}
            button={{ text: "Start Your 7-Day Free Trial", variant: "popular" }}
            popular
          />

          {/* Premium Caregiver Plan */}
          <PlanCard
            icon="👨‍👩‍👧‍👦"
            name="Premium Caregiver"
            price="LKR 4,000 / month"
            savings="or LKR 40,000 / year (Save LKR 8,000!)"
            priceClass="text-blue-400"
            description="Designed for families and caregivers managing health for multiple people."
            allowance="1,000 Tokens (Plenty for a family or small clinic)"
            features={[
              { text: "Manage up to 3 Separate Profiles", included: true },
              { text: "Advanced Health Insights and risk factor identification", included: true },
              { text: "Highest Priority Processing for instant results", included: true },
              { text: "Dedicated Phone & Priority Support", included: true },
            ]}
            button={{ text: "Choose Premium", variant: "default" }}
          />
        </div>

        {/* Token Packs Section */}
        <section className="bg-slate-800 p-8 rounded-2xl mb-16 shadow-lg border border-slate-600">
          <h3 className="text-2xl font-bold text-white text-center mb-4">
            Ran Out of Tokens? No Problem!
          </h3>
          <p className="text-center text-slate-400 mb-8">
            Need a little extra? Top up your account anytime with our flexible
            token packs.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <TokenPack name="100-Token Pack" price="LKR 500" />
            <TokenPack name="250-Token Pack" price="LKR 1,100" highlight="Better Value" />
            <TokenPack name="500-Token Pack" price="LKR 2,000" best />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-slate-800 p-8 rounded-2xl mb-16 shadow-lg border border-slate-600">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions (FAQs)
          </h3>
          <FAQ
            icon="🤔"
            q="How are tokens used?"
            a="Each time you upload a report or ask the AI Assistant, tokens are consumed. A standard blood test uses 5-10 tokens."
          />
          <FAQ
            icon="💳"
            q="What payment methods do you accept?"
            a="We accept credit/debit cards and local payment methods like eZ Cash, mCash, and Genie."
          />
          <FAQ
            icon="🔒"
            q="Is my medical data safe?"
            a="Absolutely. All data is encrypted and stored securely. We never share personal data without consent."
          />
          <FAQ
            icon="⚠️"
            q="Is this a replacement for my doctor?"
            a="No. This is an educational tool. Always consult a qualified doctor for medical advice."
          />
          <FAQ
            icon="🔄"
            q="Can I change or cancel my plan?"
            a="Yes! You can upgrade, downgrade, or cancel anytime."
          />
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white p-12 rounded-2xl text-center shadow-lg">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Take Control of Your Health?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Don’t wait to understand your next medical report. Sign up for free
            today or start a risk-free trial of Health Pro!
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-cyan-700 rounded-lg font-semibold hover:scale-105 transition"
          >
            Sign Up for Your Free Account Now
          </a>
        </section>
      </div>
    </div>
  );
}

/* Helper Components */
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
        <strong className="text-cyan-400">Monthly Token Allowance:</strong> {allowance}
      </div>
      <ul className="mb-4 space-y-2 text-sm">
        {features.map((f, i) => (
          <li key={i} className={f.included ? "text-slate-200" : "text-slate-500"}>
            {f.included ? "✅" : "❌"} {f.text}
          </li>
        ))}
      </ul>
      <a
        href="#"
        className={`block w-full text-center py-3 rounded-lg font-semibold transition ${
          button.variant === "free"
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : button.variant === "popular"
            ? "bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg"
            : "bg-cyan-700 text-white hover:bg-cyan-800"
        }`}
      >
        {button.text}
      </a>
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
