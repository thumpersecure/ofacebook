export const $ = (sel, ctx = typeof document !== 'undefined' ? document : null) =>
  ctx ? ctx.querySelector(sel) : null;

export const $$ = (sel, ctx = typeof document !== 'undefined' ? document : null) =>
  ctx ? [...ctx.querySelectorAll(sel)] : [];

export function on(el, event, handler, opts) {
  if (!el || typeof el.addEventListener !== 'function') return () => {};
  el.addEventListener(event, handler, opts);
  return () => el.removeEventListener(event, handler, opts);
}
