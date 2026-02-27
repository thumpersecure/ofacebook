export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function on(el, event, handler, opts) {
  if (!el) return () => {};
  el.addEventListener(event, handler, opts);
  return () => el.removeEventListener(event, handler, opts);
}

