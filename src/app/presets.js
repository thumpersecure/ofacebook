const STORAGE_KEY = 'osint.presets.v1';

function loadRaw() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveRaw(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function getPresets() {
  return loadRaw().slice(0, 200);
}

export function addPreset({ name, target, goalId }) {
  const presets = loadRaw();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const p = {
    id,
    name: String(name || target || 'Preset').slice(0, 80),
    target: String(target || '').slice(0, 500),
    goalId: String(goalId || 'profile-discovery'),
    createdAt: new Date().toISOString(),
  };
  presets.unshift(p);
  saveRaw(presets);
  return p;
}

export function removePreset(id) {
  const presets = loadRaw().filter((p) => p.id !== id);
  saveRaw(presets);
}

