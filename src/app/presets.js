import { extractTargetPath, sanitizeForUrl } from '../utils/security.js';

const STORAGE_KEY = 'osint.presets.v1';
const MAX_PRESETS = 200;

/** @type {Array<object> | null} */
let memoryPresets = null;

function loadRaw() {
  if (memoryPresets !== null) return [...memoryPresets];
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, MAX_PRESETS) : [];
    }
  } catch {
    // Fall back to empty array on invalid JSON or blocked storage
  }
  return [];
}

function saveRaw(arr) {
  const capped = Array.isArray(arr) ? arr.slice(0, MAX_PRESETS) : [];
  if (typeof localStorage === 'undefined') {
    memoryPresets = [...capped];
    return { ok: true };
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    memoryPresets = null;
    return { ok: true };
  } catch (err) {
    memoryPresets = [...capped];
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unable to persist presets to storage',
    };
  }
}

export function getPresets() {
  try {
    return loadRaw().slice(0, MAX_PRESETS);
  } catch {
    return [];
  }
}

export function addPreset({ name, target, goalId } = {}) {
  const rawTarget = String(target ?? '').trim();
  const parsed = extractTargetPath(rawTarget, 500);
  const cleanTarget = parsed.fullPath || sanitizeForUrl(rawTarget, 500);

  if (!cleanTarget) {
    return { ok: false, error: 'Target is required' };
  }

  const presets = loadRaw();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const cleanName = String(name ?? '').trim() || cleanTarget;
  const preset = {
    id,
    name: cleanName.slice(0, 80),
    target: cleanTarget.slice(0, 500),
    goalId: String(goalId || 'profile-discovery').slice(0, 80),
    createdAt: new Date().toISOString(),
  };

  presets.unshift(preset);
  const saved = saveRaw(presets.slice(0, MAX_PRESETS));
  if (!saved.ok) {
    return { ok: false, error: saved.error || 'Failed to save preset', preset };
  }
  return { ok: true, preset };
}

export function removePreset(id) {
  if (!id || typeof id !== 'string') {
    return { ok: true, removed: false };
  }

  const presets = loadRaw();
  const next = presets.filter((p) => p && p.id !== id);
  const removed = next.length !== presets.length;
  if (!removed) {
    return { ok: true, removed: false };
  }

  const saved = saveRaw(next);
  if (!saved.ok) {
    return { ok: false, removed, error: saved.error || 'Failed to update presets in storage' };
  }
  return { ok: true, removed: true };
}
