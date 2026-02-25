/**
 * Inline script that runs before React hydration to prevent theme flash (FOUC).
 *
 * Priority order:
 * 1. `theme` cookie (set by ThemeButton)
 * 2. Zustand persisted state in localStorage (`global-storage`)
 * 3. Fallback: 'dark'
 *
 * This runs as a blocking <script> so the correct data-theme is set
 * before the browser paints anything.
 */
export default function ThemeSyncScript() {
  const script = `
(function(){
  try {
    var ck = document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);
    var t = ck ? ck[1] : null;
    if (!t) {
      var raw = localStorage.getItem('global-storage');
      if (raw) {
        var parsed = JSON.parse(raw);
        t = parsed && parsed.state && parsed.state.theme;
      }
    }
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch(e) {}
})();
`.trim()

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
    />
  )
}
