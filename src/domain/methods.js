import { METHOD_COMBINATIONS } from '../prefix-library.js';

let cachedMethods = null;
/** @type {Map<string, ReturnType<typeof getMethodCombinations>[number]> | null} */
let cachedById = null;

function ensureCache() {
  if (cachedMethods && cachedById) return;
  cachedMethods = METHOD_COMBINATIONS.map((m) => ({
    id: m.id,
    name: m.name,
    prefixes: m.prefixes,
    description: m.description,
    osintUse: m.osintUse,
    steps: m.steps,
  }));
  cachedById = new Map(cachedMethods.map((m) => [m.id, m]));
}

export function getMethodCombinations() {
  ensureCache();
  return cachedMethods;
}

export function getMethodById(id) {
  if (!id || typeof id !== 'string') return null;
  ensureCache();
  return cachedById.get(id) || null;
}
