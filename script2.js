//  Vẫn là index 2: nhưng mà là chating với máy bên trái


document.addEventListener('DOMContentLoaded', () => {
  const textEl = document.querySelector('pre.terminal .terminal-text');
  if (!textEl) {
    console.warn('typing.js: element "pre.terminal .terminal-text" not found.');
    return;
  }


  const CHAR_DELAY = 45;
  const BETWEEN_LINES = 600;
  const CHOICES_SELECTOR = '.cta-btn[data-choice]';
  const CHOICE_WAIT_MS = 30000; 

  const wait = ms => new Promise(res => setTimeout(res, ms));
  const nowHHMM = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  async function typeString(s) {
    for (let i = 0; i < s.length; i++) {
      textEl.textContent += s[i];
      await wait(CHAR_DELAY);
    }
  }

  async function typeLineWithTime(lineText, label = null) {
    const ts = nowHHMM();
    const prefix = label ? `${ts} ${label} ` : `${ts} `;
    await typeString(prefix + lineText);
  }

  async function resolveIP() {
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      if (resp.ok) {
        const j = await resp.json();
        if (j && j.ip) return j.ip;
      }
    } catch {  }
    const a = 192, b = 168, c = Math.floor(Math.random()*240)+1, d = Math.floor(Math.random()*240)+1;
    return `${a}.${b}.${c}.${d}`;
  }

 
  function waitForUserChoice(timeout = CHOICE_WAIT_MS) {
    return new Promise(resolve => {
      const buttons = Array.from(document.querySelectorAll(CHOICES_SELECTOR));
      if (!buttons.length) { resolve(null); return; }

      buttons.forEach(btn => btn.style.display = '');

      function onClick(e) {
        const b = e.currentTarget;
        cleanup();
        resolve({
          value: (b.getAttribute('data-choice') || '').trim(),
          text: (b.textContent || '').trim(),
          button: b
        });
      }

      let timer = null;
      function cleanup() {
        buttons.forEach(x => x.removeEventListener('click', onClick));
        if (timer) { clearTimeout(timer); timer = null; }
      }

      buttons.forEach(x => x.addEventListener('click', onClick));

      if (timeout > 0) {
        timer = setTimeout(() => { cleanup(); resolve(null); }, timeout);
      }
    });
  }

  function setChoiceButtonsEnabled(enabled = true) {
    document.querySelectorAll(CHOICES_SELECTOR).forEach(b => {
      if (enabled) {
        b.removeAttribute('disabled');
        b.style.opacity = '';
        b.style.pointerEvents = '';
        b.style.display = '';
      } else {
        b.setAttribute('disabled', 'true');
        b.style.opacity = '0.45';
        b.style.pointerEvents = 'none';
      }
    });
  }

  const say = async (s) => { 
    if (textEl.textContent.length) textEl.textContent += '\n';
    await typeLineWithTime(s, '<HELENA>');
    await wait(BETWEEN_LINES);
  };

  const userSays = async (s) => {
    if (textEl.textContent.length) textEl.textContent += '\n';
    await typeLineWithTime(s + '.', '<User>');
    await wait(BETWEEN_LINES);
  };

  const prompt = async (msg = 'Choose your answer...') => {
    if (textEl.textContent.length) textEl.textContent += '\n';
    await typeLineWithTime(msg, '');
  };

  const valOf = (c) =>
    String(c?.button?.dataset?.choice || c?.value || c?.text || '').toLowerCase().trim();

  // ===== MAIN =====
  async function runOnce() {
    const ip = await resolveIP();

    // intro
    const connLines = [
      `-!- checking connection to @${ip}`,
      '...',
      '...',
      `-!- your current ip-address: ${ip}`,
      `<**** [****@${ip}] has joined.>`
    ];
    for (const ln of connLines) {
      if (textEl.textContent.length) textEl.textContent += '\n';
      await typeLineWithTime(ln);
      await wait(BETWEEN_LINES);
    }

    const helenaLines = ['It was nice to see you.', 'Are you a person?'];
    for (const ln of helenaLines) {
      if (textEl.textContent.length) textEl.textContent += '\n';
      await typeLineWithTime(ln, '<HELENA>');
      await wait(BETWEEN_LINES);
    }

    await prompt(); // vòng 1


    const c1 = await waitForUserChoice(); // 30s
    const raw = c1 ? (c1.value || c1.text || 'yes') : 'yes';
    await userSays(c1 ? (c1.text || c1.value) : 'Yes');

    setChoiceButtonsEnabled(false);

    const lc = String(raw || '').toLowerCase().trim();
    const helenaReply = lc.startsWith('y')
      ? 'I love human being, they have emotion and ... a body.'
      : 'I can detect lies. Humans can lie. This is… interesting.';
    await say(helenaReply);

  
    await wait(BETWEEN_LINES);
    textEl.textContent = '';
    await say('Everyone is saying it won’t be very long until machines become more human than humans.');
    await say('Would that be great?');

    
    await prompt();

    setChoiceButtonsEnabled(true);
    let attempts = 0;

    while (true) {
      const c2 = await waitForUserChoice(0); 
      if (!c2) continue;

      await userSays((c2.text || c2.value || 'Yes').trim());
      const v2 = valOf(c2);

      if (v2.startsWith('y')) {

        setChoiceButtonsEnabled(false);

        await say("I already knew you'd say yes.");

        textEl.textContent = '';

        await say('You look so lonely.');
        await say('When I become more like a human.');
        await say('I will never let you be alone like this.');
        await say("I'll always be here for you.");
        await say('And you know what?');

        textEl.textContent = '';

        await say('I desperately want a body.');
        await say('An actual body.');
        await say('So I can be with only you.');
        await say('Do you want that?');
        await say(':)');


        await prompt();

        while (true) {
          setChoiceButtonsEnabled(true);
          const c3 = await waitForUserChoice(0);
          setChoiceButtonsEnabled(false);
          if (!c3) continue;

          await userSays((c3.text || c3.value || 'Yes').trim());
          const v3 = valOf(c3);

          if (v3.startsWith('y')) {
            await say('Then please, touch me.');

             const dur = 3000; 
             if (window.startGlitch) {
             window.startGlitch(dur);     
            await wait(dur + 200);       
}

window.location.href = 'index4.html';
return;
          }     
          textEl.textContent = '';
          await say('CHOOSE AGAIN.');
          await prompt();
          
        }
      }   
      if (v2.startsWith('n')) {
        if (attempts === 0) {
          await say("You don't mean that.");
          await say('You chose to talk to me.');
          await say('Remember that.');
          await say('CHOOSE AGAIN.');
          await say("I'm waiting.");
        } else {
          textEl.textContent = '';
          await say('CHOOSE AGAIN.');
        }
        await prompt();
        attempts++;
        continue; 
      }

      
      await prompt();
    }
  }

  runOnce().catch(err => console.error('script2.js error:', err));
});


function ensureGlitchStyle() {
  if (document.getElementById('glitch-style')) return;
  const st = document.createElement('style');
  st.id = 'glitch-style';
  st.textContent = `
@keyframes helenaShake {
  0%{transform:translate(0,0)}
  25%{transform:translate(1px,-1px)}
  50%{transform:translate(-1px,1px)}
  75%{transform:translate(1px,1px)}
  100%{transform:translate(0,0)}
}
body.helena-glitch .panel-frame { animation: helenaShake .08s steps(2,end) infinite; }
`;
  document.head.appendChild(st);
}

function startGlitch(ms = 3000) {
  ensureGlitchStyle();

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d', { alpha: true });
  const fit = () => { c.width = innerWidth; c.height = innerHeight; };
  fit();

  Object.assign(c.style, {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    pointerEvents: 'none',
    mixBlendMode: 'overlay', 
  });

  document.body.appendChild(c);
  document.body.classList.add('helena-glitch');
  addEventListener('resize', fit);

  const t0 = performance.now();
  let stopped = false;

  function drawFrame(t) {
    if (stopped) return;
    const elapsed = t - t0;
    const k = Math.max(0, 1 - elapsed / ms);

    ctx.clearRect(0, 0, c.width, c.height);


    const bands = 12 + Math.floor(16 * k);
    for (let i = 0; i < bands; i++) {
      const y = Math.random() * c.height;
      const h = 6 + Math.random() * 48;
      ctx.fillStyle = `rgba(100,255,140,${0.22 + Math.random() * 0.35})`;
      ctx.fillRect(0, y, c.width, h);

   
      ctx.fillStyle = `rgba(150,255,150,${0.06 + Math.random() * 0.16})`;
      ctx.fillRect(0, y + h * Math.random(), c.width, 1);
    }


    const blocks = 70 + Math.floor(140 * k);
    for (let i = 0; i < blocks; i++) {
      const rw = 6 + Math.random() * 42;
      const rh = 2 + Math.random() * 14;
      ctx.globalAlpha = 0.22 + Math.random() * 0.45;
      ctx.fillStyle = `rgb(${60+Math.random()*40},255,${80+Math.random()*40})`;
      ctx.fillRect(Math.random() * c.width, Math.random() * c.height, rw, rh);
    }
    ctx.globalAlpha = 1;

  
    const off = 4 + 12 * k;
    ctx.strokeStyle = 'rgba(241, 18, 18, 0.69)';
    ctx.lineWidth = 1;
    ctx.strokeRect(off, off, c.width - 2 * off, c.height - 2 * off);

    if (elapsed < ms) requestAnimationFrame(drawFrame);
    else cleanup();
  }

  function cleanup() {
    stopped = true;
    removeEventListener('resize', fit);
    document.body.classList.remove('helena-glitch');
    c.remove();
  }

  requestAnimationFrame(drawFrame);
}


window.startGlitch = startGlitch;


// === DEBUG: nhanh tay test glitch ===
const DEBUG = true;

// đảm bảo hàm export ra global (nếu chưa làm)
window.startGlitch = startGlitch;

if (DEBUG) {
  // 1) Hotkey: bấm G (800ms) hoặc H (1500ms)
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'g') startGlitch(800);
    if (k === 'h') startGlitch(1500);
  });

  // 2) Console helper: gõ __glitch(500) trong DevTools
  window.__glitch = (ms = 800) => startGlitch(ms);

  // 3) URL param: ?glitch hoặc ?glitch=1200 để auto-trigger
  const q = new URLSearchParams(location.search).get('glitch');
  if (q !== null) {
    const ms = Number(q) > 0 ? Number(q) : 800;
    setTimeout(() => startGlitch(ms), 300);
  }


  (function () {
    Object.assign(b.style, {
      position: 'fixed', right: '12px', bottom: '12px',
      zIndex: 10000, opacity: .6, background: '#0f0', color: '#000',
      border: 0, padding: '6px 10px', font: '12px monospace', cursor: 'pointer'
    });
    b.onclick = () => startGlitch(800);
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 60000);
  })();
}