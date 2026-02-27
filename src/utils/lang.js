export function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function safeStr(val, maxLen) {
  const s = String(val ?? '');
  return typeof maxLen === 'number' ? s.slice(0, maxLen) : s;
}

