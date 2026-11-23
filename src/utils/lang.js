export function debounce(fn, waitMs = 150) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    timer = null;
    lastArgs = null;
    lastThis = null;
    return fn.apply(ctx, args);
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(invoke, waitMs);
  }

  debounced.cancel = function cancel() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = function flush() {
    if (timer === null) return undefined;
    clearTimeout(timer);
    return invoke();
  };

  return debounced;
}

export function safeStr(v, maxLen = 1000) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return typeof maxLen === 'number' && maxLen >= 0 ? s.slice(0, maxLen) : s;
}
