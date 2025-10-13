// Centralized plan configuration — reusable anywhere in backend
export const PLAN_LIMITS = {
  Free: {
    reports: 3,
    agents: 15,
    description: "Basic free access — up to 3 reports per month",
  },
  "Health Pro": {
    reports: 10,
    agents: 50,
    description: "Mid-tier plan with more report and agent usage",
  },
  "Premium Care": {
    reports: Infinity,
    agents: Infinity,
    description: "Unlimited usage — full access to all features",
  },
};

// Utility function for convenience
export const getPlanLimits = (planName = "Free") => {
  return PLAN_LIMITS[planName] || PLAN_LIMITS["Free"];
};
