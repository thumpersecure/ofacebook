import { PLANS, isValidPlan } from './plans.js';

const STORAGE_KEY = 'osint.plan';
const PROVIDER_KEY = 'osint.assistant.provider';
const OPENAI_KEY = 'osint.openai.key';
const ANTHROPIC_KEY = 'osint.anthropic.key';

export function getPlanId() {
  const plan = localStorage.getItem(STORAGE_KEY) || 'free';
  return isValidPlan(plan) ? plan : 'free';
}

export function setPlanId(planId) {
  const plan = isValidPlan(planId) ? planId : 'free';
  localStorage.setItem(STORAGE_KEY, plan);
  return plan;
}

export function getPlan() {
  return PLANS[getPlanId()];
}

export function hasFeature(featureKey) {
  const plan = getPlan();
  return !!plan.features?.[featureKey];
}

export function getProvider() {
  return localStorage.getItem(PROVIDER_KEY) || 'local';
}

export function setProvider(providerId) {
  const p = providerId === 'openai' || providerId === 'anthropic' ? providerId : 'local';
  localStorage.setItem(PROVIDER_KEY, p);
  return p;
}

export function getOpenAIKey() {
  return localStorage.getItem(OPENAI_KEY) || '';
}

export function setOpenAIKey(key) {
  localStorage.setItem(OPENAI_KEY, String(key || '').trim());
}

export function getAnthropicKey() {
  return localStorage.getItem(ANTHROPIC_KEY) || '';
}

export function setAnthropicKey(key) {
  localStorage.setItem(ANTHROPIC_KEY, String(key || '').trim());
}

