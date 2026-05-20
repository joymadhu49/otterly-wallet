import browser from 'webextension-polyfill';

// Inject inpage provider before any page script runs
(function injectInpage() {
  try {
    const s = document.createElement('script');
    s.src = browser.runtime.getURL('inpage.js');
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    console.error('Otterly inpage injection failed', e);
  }
})();

// Bridge window <-> background
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  const msg = event.data;
  if (!msg || msg.target !== 'arc-content') return;

  try {
    const response = await browser.runtime.sendMessage({
      type: 'arc:rpc',
      id: msg.id,
      method: msg.method,
      params: msg.params,
      origin: window.location.origin,
    });
    window.postMessage({ target: 'arc-inpage', id: msg.id, response }, '*');
  } catch (e: any) {
    window.postMessage({
      target: 'arc-inpage',
      id: msg.id,
      response: { id: msg.id, error: { code: -32603, message: e?.message || String(e) } },
    }, '*');
  }
});
