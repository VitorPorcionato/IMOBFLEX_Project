import { mount } from './moments/moments.js';
const scan = () => document.querySelectorAll('[data-moment]').forEach(element => {
  if (!element.__momentP) mount(element).catch(() => element.classList.add('mo-safe'));
});
scan();
new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
