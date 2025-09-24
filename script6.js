// NÀY VẪN LÀ INDEX 5 NHƯNG SCRIPT 6 LÀ ĐỂ OVERLAY LÊN THÔI.





(function () {
  function ensureOverlay() {
    const canvas = document.querySelector('#defaultCanvas0, canvas.p5Canvas, canvas');
    if (!canvas) {
      setTimeout(ensureOverlay, 200);
      return;
    }

    let sourceText = document.querySelector('.page-5 .text') || document.getElementById('subtitle') || document.querySelector('.page-5 .subtitle');
    if (!sourceText) {
      sourceText = document.createElement('div');
      sourceText.id = 'subtitle-fallback';
      sourceText.textContent = 'HELENA';
      sourceText.style.display = 'none';
      document.body.appendChild(sourceText);
    }

    function hideOriginals() {
      document.querySelectorAll('.page-5 .cursor, .text .cursor, #subtitle .cursor, span.cursor').forEach(n=>{
        try { n.style.setProperty('display','none','important'); n.setAttribute('aria-hidden','true'); } catch(e){ n.style.display='none'; }
      });
      if (sourceText && sourceText.style) {
        try { sourceText.style.setProperty('display','none','important'); sourceText.setAttribute('aria-hidden','true'); }
        catch(e){ sourceText.style.display='none'; }
      }
    }
    hideOriginals();

    let overlay = document.querySelector('.page5-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'page5-overlay';
      overlay.setAttribute('aria-hidden','false');
      document.body.appendChild(overlay);
    }

    let overlayCursor = overlay.querySelector('.cursor');
    if (!overlayCursor) {
      overlayCursor = document.createElement('span');
      overlayCursor.className = 'cursor';
      overlayCursor.textContent = '|';
      overlay.appendChild(overlayCursor);
    }

    const container = document.querySelector('.text') || sourceText.parentNode || document.body;
    overlay.addEventListener('click', (e) => {
      try {
        const ev = new MouseEvent('click', {bubbles:true, cancelable:true, view: window});
        container.dispatchEvent(ev);
      } catch(err){}
    });

    let lastHtml = '';
    let hideTimer = null;
    const IDLE_HIDE_MS = 1300;
    function showCursorOnce() {
      overlayCursor.style.opacity = '1';
      overlayCursor.style.visibility = 'visible';
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      hideTimer = setTimeout(()=> {
        overlayCursor.style.opacity = '0';
        overlayCursor.style.visibility = 'hidden';
      }, IDLE_HIDE_MS);
    }

    function updateText() {
      if (!sourceText) return;
      let html = sourceText.innerHTML ? sourceText.innerHTML : (sourceText.textContent || '');
      html = html.replace(/<span[^>]*class=["']?cursor["']?[^>]*>.*?<\/span>/gi, '');
      html = html.replace(/[\u007C]+$/g, '');
      overlay.innerHTML = html === '' ? '&nbsp;' : html;
      overlay.appendChild(overlayCursor);

      if (html !== lastHtml) {
        lastHtml = html;
        showCursorOnce();
      }
    }

    function positionOverlay() {
      const r = canvas.getBoundingClientRect();
      const placeTop = false;
      const centerX = r.left + r.width / 2;
      const offsetFromBottom = 36; 
      const topPx = placeTop ? (r.top + 10) : (r.top + r.height - offsetFromBottom);
      overlay.style.left = `${centerX}px`;
      overlay.style.top = `${topPx}px`;
      if (!placeTop) overlay.classList.add('bottom'); else overlay.classList.remove('bottom');
    }

    function loop() {
      hideOriginals();
      updateText();
      positionOverlay();
      requestAnimationFrame(loop);
    }
    loop();

    window.__page5_overlay = { overlay, overlayCursor, sourceText, canvas, positionOverlay, updateText, showCursorOnce };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureOverlay);
  else ensureOverlay();
})();
