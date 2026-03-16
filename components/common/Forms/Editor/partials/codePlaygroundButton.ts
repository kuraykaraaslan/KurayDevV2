import type { Editor } from 'tinymce'

// ── Babel lazy loader (for TSX transpilation) ────────────────────────────────
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

// ── Safe sandboxed executor ──────────────────────────────────────────────────
async function runUserCode(code: string, lang: string): Promise<string[]> {
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

    // Serialize code as JSON string to avoid any injection via code content
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
  log:  '#a6e3a1', // green
  info: '#89b4fa', // blue
  warn: '#f9e2af', // yellow
  err:  '#f38ba8', // red
  ok:   '#6c7086', // muted
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

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Default snippets ─────────────────────────────────────────────────────────
const DEFAULT_JS = `// JavaScript Playground
const arr = [1, 2, 3, 4, 5]
console.log('Array:', arr)
console.log('Toplam:', arr.reduce((a, b) => a + b, 0))
console.log('İki katı:', arr.map(x => x * 2))

const obj = { ad: 'Dünya', yil: 2025 }
console.log('Nesne:', obj)`

const DEFAULT_TSX = `// TSX / TypeScript Playground
const selamla = (isim: string): string => \`Merhaba, \${isim}!\`
console.log(selamla('Dünya'))

const sayilar: number[] = [1, 2, 3, 4, 5]
const kareler = sayilar.map((n: number) => n * n)
console.log('Kareler:', kareler)

interface Kullanici { ad: string; yas: number }
const kullanici: Kullanici = { ad: 'Ali', yas: 30 }
console.log('Kullanıcı:', kullanici)`

// ── Main dialog ──────────────────────────────────────────────────────────────
// initialCode / initialLang / targetNode → edit-mode (double-click on existing block)
function openPlaygroundDialog(
  editor: Editor,
  initialCode?: string,
  initialLang?: string,
  targetNode?: HTMLElement,
): void {
  const isEdit = !!targetNode
  const UID = `cpg_${Date.now()}`
  const IDS = {
    lang: `${UID}_lang`,
    ta:   `${UID}_ta`,
    out:  `${UID}_out`,
  }

  const sectionHeader = (label: string) =>
    `<div style="padding:4px 12px;font-size:10px;font-weight:700;letter-spacing:.8px;` +
    `color:#94a3b8;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-transform:uppercase">${label}</div>`

  const startCode = escHtml(initialCode ?? DEFAULT_JS)
  const startLang = initialLang ?? 'js'

  const html = `
<div style="display:flex;flex-direction:column;height:460px">

  <!-- Toolbar row -->
  <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
              background:#f8fafc;border-bottom:1px solid #e2e8f0;flex-shrink:0">
    <label style="font-size:12px;font-weight:600;color:#475569">Dil:</label>
    <select id="${IDS.lang}"
      style="padding:4px 10px;border-radius:6px;border:1px solid #cbd5e1;
             font-size:13px;background:#fff;cursor:pointer">
      <option value="js" ${startLang === 'js' ? 'selected' : ''}>JavaScript</option>
      <option value="tsx" ${startLang === 'tsx' ? 'selected' : ''}>TSX / TypeScript</option>
    </select>
    <span style="margin-left:auto;font-size:11px;color:#94a3b8">
      Tab → 2 boşluk &nbsp;·&nbsp; Çalıştır → footer butonu
    </span>
  </div>

  <!-- Split: editor | output -->
  <div style="display:flex;flex:1;min-height:0">

    <!-- Code editor -->
    <div style="flex:1;display:flex;flex-direction:column;border-right:1px solid #e2e8f0">
      ${sectionHeader('Kod Editörü')}
      <textarea id="${IDS.ta}" spellcheck="false"
        style="flex:1;padding:14px;
               font-family:'Fira Code',Consolas,'Courier New',monospace;
               font-size:13px;line-height:1.65;
               border:none;outline:none;resize:none;
               background:#1e1e2e;color:#cdd6f4;tab-size:2"
      >${startCode}</textarea>
    </div>

    <!-- Output -->
    <div style="flex:1;display:flex;flex-direction:column">
      ${sectionHeader('Çıktı')}
      <div id="${IDS.out}"
        style="flex:1;padding:14px;
               font-family:'Fira Code',Consolas,'Courier New',monospace;
               font-size:13px;line-height:1.65;overflow:auto;
               background:#0f1117;color:#4b5563;white-space:pre">
        <span style="font-style:italic">▶ Çalıştır'a tıklayın…</span>
      </div>
    </div>

  </div>
</div>`

  let running = false

  editor.windowManager.open({
    title: isEdit ? '⚡ Kod Playground — Düzenle' : '⚡ Kod Playground',
    size: 'large',
    body: { type: 'panel', items: [{ type: 'htmlpanel', html }] },
    buttons: [
      { type: 'cancel' as const, text: 'Kapat' },
      { type: 'custom' as const, name: 'run',    text: '▶ Çalıştır', buttonType: 'secondary' as const },
      { type: 'custom' as const, name: 'insert', text: isEdit ? 'Güncelle' : 'Kod Bloğu Ekle', buttonType: 'primary' as const },
    ],
    onAction: (dialogApi, { name }) => {
      const ta     = document.getElementById(IDS.ta)   as HTMLTextAreaElement | null
      const outEl  = document.getElementById(IDS.out)  as HTMLDivElement      | null
      const langEl = document.getElementById(IDS.lang) as HTMLSelectElement   | null
      if (!ta || !outEl) return

      if (name === 'run') {
        if (running) return
        running = true
        outEl.innerHTML =
          '<span style="color:#89b4fa;font-style:italic">⏳ Çalışıyor…</span>'

        void runUserCode(ta.value, langEl?.value ?? 'js').then((lines) => {
          outEl.innerHTML = renderOutput(lines)
          running = false
        })
        return
      }

      if (name === 'insert') {
        const lang      = langEl?.value ?? 'js'
        const escaped   = escHtml(ta.value)
        const prismLang = lang === 'tsx' ? 'typescript' : 'javascript'
        const newHtml   =
          `<pre class="language-${prismLang}"><code class="language-${prismLang}">${escaped}</code></pre>`

        if (isEdit && targetNode) {
          // Replace the existing <pre> block in-place
          editor.selection.select(targetNode)
          editor.execCommand('mceInsertContent', false, newHtml)
        } else {
          editor.execCommand('mceInsertContent', false, newHtml)
        }
        dialogApi.close()
      }
    },
  })

  // Tab-key support + lang-switch default snippets
  requestAnimationFrame(() => {
    const ta     = document.getElementById(IDS.ta)   as HTMLTextAreaElement | null
    const langEl = document.getElementById(IDS.lang) as HTMLSelectElement   | null
    if (!ta || !langEl) return

    ta.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      e.preventDefault()
      const start = ta.selectionStart
      const end   = ta.selectionEnd
      ta.value = ta.value.slice(0, start) + '  ' + ta.value.slice(end)
      ta.selectionStart = ta.selectionEnd = start + 2
    })

    // Only swap default snippets when user hasn't changed the content
    langEl.addEventListener('change', () => {
      const cur = ta.value.trim()
      if (langEl.value === 'tsx' && cur === DEFAULT_JS.trim()) {
        ta.value = DEFAULT_TSX
      } else if (langEl.value === 'js' && cur === DEFAULT_TSX.trim()) {
        ta.value = DEFAULT_JS
      }
    })
  })
}

// ── TinyMCE button registration ──────────────────────────────────────────────
export function registerCodePlaygroundButton(editor: Editor): void {
  editor.ui.registry.addIcon(
    'code-playground',
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M8 5.5 3 12l5 6.5M16 5.5l5 6.5-5 6.5M14 3.5l-4 17"/>
    </svg>`,
  )

  editor.ui.registry.addButton('codeplayground', {
    icon: 'code-playground',
    tooltip: 'Kod Playground aç (JS / TSX)',
    onAction: () => openPlaygroundDialog(editor),
  })

  // Double-click on any <pre> block → open Playground in edit mode
  // stopImmediatePropagation prevents the codesample plugin's own dialog
  editor.on('dblclick', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const pre = target.closest('pre') as HTMLElement | null
    if (!pre) return

    e.stopImmediatePropagation()

    const codeEl = pre.querySelector('code')
    // textContent decodes HTML entities automatically
    const rawCode = (codeEl ?? pre).textContent ?? ''

    const cls = ((codeEl ?? pre).className ?? '').toLowerCase()
    const lang = cls.includes('typescript') || cls.includes('tsx') ? 'tsx' : 'js'

    openPlaygroundDialog(editor, rawCode, lang, pre)
  })
}
