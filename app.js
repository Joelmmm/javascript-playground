/* global require */

(function init() {
  const consoleEl = document.getElementById('console');
  const runBtn = document.getElementById('runBtn');
  const clearBtn = document.getElementById('clearBtn');
  const editorContainer = document.getElementById('editor');

  let editor;
  let currentIframe = null;

  function appendToConsole(kind, parts) {
    const prefix = kind === 'error' ? '[error] ' : kind === 'warn' ? '[warn]  ' : kind === 'info' ? '[info]  ' : '[log]   ';
    const text = parts.map(formatValue).join(' ');
    consoleEl.textContent += prefix + text + '\n';
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function formatValue(value) {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, replacerCircular(), 2);
    } catch (e) {
      return String(value);
    }
  }

  function replacerCircular() {
    const seen = new WeakSet();
    return function(key, val) {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    };
  }

  function clearConsole() {
    consoleEl.textContent = '';
  }

  function disposeCurrentIframe() {
    if (currentIframe && currentIframe.parentNode) {
      window.removeEventListener('message', messageHandler);
      currentIframe.parentNode.removeChild(currentIframe);
      currentIframe = null;
    }
  }

  function createSandboxIframe() {
    disposeCurrentIframe();
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-pointer-lock allow-downloads';
    iframe.style.display = 'none';
    iframe.srcdoc = `<!doctype html>
<meta charset="utf-8">
<script>
  const send = (t, p) => parent.postMessage({ t, p }, '*');
  ['log','info','warn','error'].forEach(m => {
    const orig = console[m];
    console[m] = (...a) => {
      try { send('console', { m, a }); } catch(_) {}
      try { orig.apply(console, a); } catch(_) {}
    };
  });
  addEventListener('error', e => send('error', String(e.error?.stack || e.message || e)));
  addEventListener('unhandledrejection', e => send('error', String(e.reason?.stack || e.reason || e)));
  addEventListener('message', async (e) => {
    if (e.data?.t !== 'run') return;
    try {
      const blob = new Blob([e.data.code], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      await import(url + '#' + Date.now());
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  });
<\/script>`;
    document.body.appendChild(iframe);
    currentIframe = iframe;
    window.addEventListener('message', messageHandler);
    return iframe;
  }

  function messageHandler(e) {
    if (!currentIframe || e.source !== currentIframe.contentWindow) return;
    if (e.data?.t === 'console') {
      appendToConsole(e.data.p.m, e.data.p.a || []);
    } else if (e.data?.t === 'error') {
      appendToConsole('error', [e.data.p]);
    }
  }

  function getDefaultCode() {
    return `// This code runs in a same-origin iframe with full browser APIs.
// Top-level await is supported because code executes as an ES module.
console.log('Navigator:', navigator.userAgent);
document.title = 'JS Playground – Sandbox';
localStorage.setItem('demo', '42');
console.info('localStorage.demo =', localStorage.getItem('demo'));
const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
console.log('fetch status', res.status);
console.log('response preview', await res.json());
// You can also open popups (may be blocked by settings):
// window.open('https://example.com', '_blank');
`;
  }

  function setupMonaco() {
    return new Promise((resolve) => {
      require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs' } });
      require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(editorContainer, {
          value: getDefaultCode(),
          language: 'javascript',
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 14,
          minimap: { enabled: false }
        });
        resolve();
      });
    });
  }

  async function runCode() {
    const code = editor.getValue();
    const iframe = createSandboxIframe();
    // Ensure iframe is ready before posting; small delay is usually enough since script runs on creation
    setTimeout(() => {
      iframe.contentWindow.postMessage({ t: 'run', code }, '*');
    }, 0);
  }

  function bindUI() {
    runBtn.addEventListener('click', runCode);
    clearBtn.addEventListener('click', clearConsole);
  }

  function onResize() {
    if (editor) editor.layout();
  }

  // init
  bindUI();
  setupMonaco().then(() => {
    createSandboxIframe();
    window.addEventListener('resize', onResize);
  });
})();

