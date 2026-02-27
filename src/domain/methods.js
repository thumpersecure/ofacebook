import { METHOD_COMBINATIONS } from '../prefix-library.js';

export function getMethodCombinations() {
  return METHOD_COMBINATIONS.map((m) => ({
    id: m.id,
    name: m.name,
    prefixes: m.prefixes,
    description: m.description,
    osintUse: m.osintUse,
    steps: m.steps,
  }));
}

export function getMethodById(id) {
  return getMethodCombinations().find((m) => m.id === id) || null;
}

