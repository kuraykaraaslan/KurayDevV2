'use client'

import { useEffect, useRef } from 'react'

// ── Babel lazy loader (TSX transpilation) ────────────────────────────────────
let babelPromise: Promise<void> | null = null

function ensureBabel(): Promise<void> {
  if ((window as any).Babel) return Promise.resolve()
  if (babelPromise) return babelPromise
  babelPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/@babel/standalone/babel.min.js'
    s.onload = () => resolve()
    s.onerror = () => {
      babelPromise = null
      reject(new Error('@babel/standalone yüklenemedi'))
    }
    document.head.appendChild(s)
  })
  return babelPromise
}

// ── Sandboxed runner ─────────────────────────────────────────────────────────
async function runCode(code: string, lang: string): Promise<string[]> {
  let execCode = code

  if (lang === 'tsx') {
    try {
      await ensureBabel()
      const Babel = (window as any).Babel as {
        transform: (src: string, opts: Record<string, unknown>) => { code: string }
      }
      const result = Babel.transform(code, {
        presets: [['react', { runtime: 'classic' }], 'typescript'],
        filename: 'playground.tsx',
      })
      execCode = result.code ?? code
    } catch (e: unknown) {
      return [`err:❌ Transpile hatası: ${e instanceof Error ? e.message : String(e)}`]
    }
  }

  return new Promise<string[]>((resolve) => {
    const id = `pg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const timer = setTimeout(() => {
      window.removeEventListener('message', onMsg)
      iframe.remove()
      resolve(['warn:⏱ Timeout: 5 saniye içinde sonuç alınamadı'])
    }, 5000)

    const onMsg = (ev: MessageEvent) => {
      if (!ev.data || ev.data.pgId !== id) return
      clearTimeout(timer)
      window.removeEventListener('message', onMsg)
      iframe.remove()
      resolve((ev.data.lines ?? []) as string[])
    }

    window.addEventListener('message', onMsg)

    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0'
    document.body.appendChild(iframe)

    const codeJson = JSON.stringify(execCode)
    const idJson = JSON.stringify(id)

    iframe.srcdoc = `<!DOCTYPE html><html><body><script>(function(){
  var L=[];
  var F=function(){
    return Array.prototype.slice.call(arguments).map(function(x){
      try{return typeof x==='object'&&x!==null?JSON.stringify(x,null,2):String(x)}
      catch(e2){return String(x)}
    }).join(' ');
  };
  console.log=function(){L.push('log:'+F.apply(null,arguments))};
  console.warn=function(){L.push('warn:'+F.apply(null,arguments))};
  console.error=function(){L.push('err:'+F.apply(null,arguments))};
  console.info=function(){L.push('info:'+F.apply(null,arguments))};
  try{
    (new Function(${codeJson}))();
    if(!L.length) L.push('ok:✅ Çalıştı (çıktı yok)');
  }catch(e){
    L.push('err:❌ '+e.message);
  }
  parent.postMessage({pgId:${idJson},lines:L},'*');
})();<\/script></body></html>`
  })
}

// ── Output renderer ──────────────────────────────────────────────────────────
const PREFIX_COLORS: Record<string, string> = {
  log:  '#a6e3a1',
  info: '#89b4fa',
  warn: '#f9e2af',
  err:  '#f38ba8',
  ok:   '#6c7086',
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderOutput(lines: string[]): string {
  return lines
    .map((line) => {
      const colon = line.indexOf(':')
      const prefix = colon >= 0 ? line.slice(0, colon) : ''
      const text   = colon >= 0 ? line.slice(colon + 1) : line
      const color  = PREFIX_COLORS[prefix] ?? '#cdd6f4'
      return `<span style="color:${color}">${escHtml(text)}</span>`
    })
    .join('\n')
}

// ── Detect language from class, fallback to 'js' ────────────────────────────
function detectLang(el: HTMLElement | null): string {
  const cls = (el?.className ?? '').toLowerCase()
  if (cls.includes('typescript') || cls.includes('tsx')) return 'tsx'
  return 'js'
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CodePlaygroundRunner({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    // Enhance every <pre> that contains a <code> child
    root.querySelectorAll<HTMLElement>('pre').forEach((pre) => {
      if (pre.dataset.pgEnhanced) return
      const codeEl = pre.querySelector('code')
      // Skip if no code child (not a code block)
      if (!codeEl) return

      const lang = detectLang(codeEl) || detectLang(pre)
      pre.dataset.pgEnhanced = '1'

      // ── Toolbar ──
      const toolbar = document.createElement('div')
      toolbar.style.cssText =
        'display:flex;align-items:center;gap:8px;padding:5px 12px;' +
        'background:#1e1e2e;border-radius:8px 8px 0 0;' +
        'border:1px solid #313244;border-bottom:none'

      const badge = document.createElement('span')
      badge.textContent = lang === 'tsx' ? 'TypeScript' : 'JavaScript'
      badge.style.cssText =
        'font-size:11px;font-weight:700;color:#89b4fa;letter-spacing:.5px;text-transform:uppercase'

      const runBtn = document.createElement('button')
      runBtn.textContent = '▶ Çalıştır'
      runBtn.type = 'button'
      runBtn.style.cssText =
        'margin-left:auto;padding:3px 14px;border-radius:5px;border:none;cursor:pointer;' +
        'background:#a6e3a1;color:#1e1e2e;font-size:12px;font-weight:700;transition:opacity .15s'

      const clearBtn = document.createElement('button')
      clearBtn.textContent = '✕'
      clearBtn.type = 'button'
      clearBtn.title = 'Çıktıyı temizle'
      clearBtn.style.cssText =
        'display:none;padding:3px 8px;border-radius:5px;border:none;cursor:pointer;' +
        'background:#45475a;color:#cdd6f4;font-size:12px;font-weight:700'

      toolbar.appendChild(badge)
      toolbar.appendChild(runBtn)
      toolbar.appendChild(clearBtn)

      // ── Output panel ──
      const outPanel = document.createElement('div')
      outPanel.style.cssText =
        'display:none;padding:12px 16px;white-space:pre;' +
        'font-family:"Fira Code",Consolas,"Courier New",monospace;font-size:13px;line-height:1.65;' +
        'background:#0f1117;color:#4b5563;border:1px solid #313244;border-top:none;' +
        'border-radius:0 0 8px 8px;max-height:320px;overflow:auto'

      // ── Insert into DOM — toolbar before pre, outPanel after pre ──
      pre.parentNode!.insertBefore(toolbar, pre)
      pre.style.cssText += ';margin-top:0 !important;border-radius:0 0 8px 8px;'
      pre.insertAdjacentElement('afterend', outPanel)

      // ── Handlers ──
      runBtn.addEventListener('click', async () => {
        const code = codeEl.textContent ?? ''
        runBtn.disabled = true
        runBtn.style.opacity = '.5'
        runBtn.textContent = '⏳'
        outPanel.style.display = 'block'
        outPanel.innerHTML = '<span style="color:#89b4fa;font-style:italic">Çalışıyor…</span>'
        clearBtn.style.display = 'none'

        const lines = await runCode(code, lang)
        outPanel.innerHTML = renderOutput(lines)
        runBtn.disabled = false
        runBtn.style.opacity = '1'
        runBtn.textContent = '▶ Çalıştır'
        clearBtn.style.display = ''
      })

      clearBtn.addEventListener('click', () => {
        outPanel.style.display = 'none'
        outPanel.innerHTML = ''
        clearBtn.style.display = 'none'
      })
    })
  }, [html])

  return (
    <div
      ref={ref}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
      className="prose mt-4 max-w-none"
    />
  )
}
