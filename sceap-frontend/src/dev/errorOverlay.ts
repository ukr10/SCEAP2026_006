// Small dev-only global error overlay to surface JS errors outside React
function createOverlay() {
  const id = 'dev-error-overlay';
  if (document.getElementById(id)) return;
  const el = document.createElement('div');
  el.id = id;
  Object.assign(el.style, {
    position: 'fixed',
    left: '8px',
    right: '8px',
    top: '8px',
    padding: '12px',
    background: 'rgba(0,0,0,0.85)',
    color: '#fff',
    zIndex: '999999',
    borderRadius: '6px',
    maxHeight: '80vh',
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '12px'
  });
  el.innerHTML = '<strong style="color:#ff6b6b">Runtime Error</strong><pre id="dev-error-pre" style="white-space:pre-wrap;margin-top:8px;color:#fff"></pre><div style="margin-top:8px"><button id="dev-error-reload" style="padding:6px 10px;border-radius:4px;border:none;background:#2563eb;color:#fff;cursor:pointer">Reload</button></div>';
  document.body.appendChild(el);
  const btn = document.getElementById('dev-error-reload') as HTMLButtonElement | null;
  if (btn) btn.onclick = () => location.reload();
}

function showError(msg: string) {
  createOverlay();
  const pre = document.getElementById('dev-error-pre');
  if (pre) pre.textContent = msg;
}

window.addEventListener('error', (ev) => {
  try {
    const msg = `${ev.message}\n${ev.filename}:${ev.lineno}:${ev.colno}\n${ev.error && ev.error.stack ? ev.error.stack : ''}`;
    console.error('[GLOBAL ERROR]', msg);
    showError(msg);
  } catch (e) {
    console.error('Failed to show overlay', e);
  }
});

window.addEventListener('unhandledrejection', (ev) => {
  try {
    const reason = typeof ev.reason === 'string' ? ev.reason : (ev.reason && ev.reason.stack) ? ev.reason.stack : JSON.stringify(ev.reason);
    const msg = `Unhandled Promise Rejection:\n${reason}`;
    console.error('[UNHANDLED REJECTION]', reason);
    showError(msg);
  } catch (e) {
    console.error('Failed to show overlay', e);
  }
});

export {};
