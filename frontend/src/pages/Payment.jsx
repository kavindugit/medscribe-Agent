import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";

export default function Payment() {
  const { backendUrl, userData } = useContext(AppContent);
  const { planType } = useParams();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  // Define plan pricing details
  const PLAN_DETAILS = {
    HealthPro: {
      name: "HealthPro",
      price: 1500,
      currency: "LKR",
      description: "Monthly plan with up to 10 reports and 50 agent calls.",
    },
    PremiumCare: {
      name: "PremiumCare",
      price: 3000,
      currency: "LKR",
      description: "Unlimited reports, full access, and priority support.",
    },
  };

  const plan = PLAN_DETAILS[planType];

  // Redirect if invalid
  useEffect(() => {
    if (!plan) {
      toast.error("Invalid plan selected.");
      navigate("/pricing");
    }
  }, [plan, navigate]);

  // Handle mock payment
  const handlePayment = async () => {
    if (!userData?.userId) {
      toast.error("Please log in to continue.");
      navigate("/login");
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment delay
      await new Promise((res) => setTimeout(res, 1500));

      // Hit the backend real API to upgrade plan
      const { data } = await axios.post(
        `${backendUrl}/api/plan/update`,
        {
          userId: userData.userId,
          planType,
          paymentStatus: "success",
        },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(`🎉 ${data.message || "Plan upgraded successfully!"}`);
        setTimeout(() => navigate("/"), 1500);
      } else {
        toast.error(data.message || "Payment failed. Try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment process failed. Try again later.");
    } finally {
      setProcessing(false);
    }
  };

  if (!plan) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl max-w-lg w-full p-8">
        <h1 className="text-3xl font-bold text-center mb-6">
          Checkout — {plan.name}
        </h1>

        <div className="border border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-lg mb-2 font-semibold">{plan.description}</p>
          <p className="text-cyan-400 font-bold text-2xl">
            {plan.currency} {plan.price.toLocaleString()}
          </p>
        </div>

        {/* Dummy Card Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9101 1121"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">CVV</label>
              <input
                type="password"
                placeholder="***"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold text-lg hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {processing ? "Processing Payment..." : `Pay ${plan.currency} ${plan.price}`}
        </button>

        <p className="text-center text-slate-400 text-sm mt-4">
          Secure dummy gateway — no real card charge.
        </p>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/pricing")}
            className="text-cyan-400 underline hover:text-cyan-300 text-sm"
          >
            ← Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}
