/**
 * Facebook OSINT Assistant - Main entry point
 * Re-exports all assistant functions for main app integration.
 */

export {
  detectIntent,
  getRecommendation,
  getMethodsByGoal,
  getAllPrefixes,
  getContextualTips,
  buildUrl,
  getWorkflow,
  PREFIXES,
  INTENT_KEYWORDS,
  RECOMMENDATION_RULES,
  CONTEXTUAL_TIPS,
  LOCALE_PREFIXES,
} from './osint-assistant.js';
