/**
 * Facebook OSINT Assistant - Main entry point
 * Re-exports all assistant functions and data library for main app integration.
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

export {
  SUBDOMAINS,
  METHOD_COMBINATIONS,
  OSINT_WORKFLOWS,
  LOCALE_PREFIXES as DATA_LOCALE_PREFIXES,
  SUBDOMAINS_BY_CATEGORY,
  getAllSubdomains,
  getSubdomainsByCategory,
  getSubdomain,
  getMethodCombination,
  getWorkflow as getWorkflowById,
  getAllMethodCombinations,
  getAllWorkflows,
  buildSubdomainUrl,
  getSingleCharSubdomains,
  getTwoLetterSubdomains,
} from './data.js';
