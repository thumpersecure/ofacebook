export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    features: {
      advancedResults: false,
      export: false,
      bulkOpen: false,
      llmProviders: false,
      savedPresets: false,
    },
    limits: {
      searchesPerDay: 25,
      assistantMessagesPerDay: 60,
      maxResultsPerSearch: 6,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$12/mo',
    features: {
      advancedResults: true,
      export: true,
      bulkOpen: true,
      llmProviders: true,
      savedPresets: true,
    },
    limits: {
      searchesPerDay: 1000,
      assistantMessagesPerDay: 4000,
      maxResultsPerSearch: 14,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: 'Contact',
    features: {
      advancedResults: true,
      export: true,
      bulkOpen: true,
      llmProviders: true,
      savedPresets: true,
    },
    limits: {
      searchesPerDay: -1,
      assistantMessagesPerDay: -1,
      maxResultsPerSearch: 24,
    },
  },
};

export function isValidPlan(planId) {
  return !!(planId && PLANS[planId]);
}

