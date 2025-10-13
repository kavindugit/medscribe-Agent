// backend/config/planConfig.js
export const PLAN_LIMITS = {
  Free: {
    reports: 3,
    agents: 15,
    description: "Basic free access — up to 3 reports per month",
  },
  HealthPro: {
    reports: 10,
    agents: 50,
    description: "Mid-tier plan with more report and agent usage",
  },
  PremiumCare: {
    reports: Infinity,
    agents: Infinity,
    description: "Unlimited usage — full access to all features",
  },
};

// ✅ Strict lookup (exact match, fallback to Free)
export const getPlanLimits = (planType = "Free") =>
  PLAN_LIMITS[planType] || PLAN_LIMITS.Free;
