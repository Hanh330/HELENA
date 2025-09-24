// -NÀY LÀ INDEX 5 TRANG CUỐI VẪN CHỈ LÀ TYING THÔI =))



const HOME_URL = 'index.html';
function goHome(delay = 1200) {
  document.body.classList.add('fadeout');
  setTimeout(() => window.location.replace(HOME_URL), delay);
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('subtitle');
  const container = document.querySelector('.text');

  const charDelay    = 70;
  const displayDelay = 1600;

  const messages = [
    "Now please, look at the camera.",
    "Go ahead, show us some movement.",
    { waitForMotion: true, min: 1800, max: 7000, thresh: 0.08 },
    "Thank you.",
    "Who are you in the age of AI?",
    "When a machine can predict your speech.",
    "Mimic your tone.",
    "Generate your face.",
    "Compose your emotions.",
    "Every move you just made can be tracked and collected.",
    "From the start,",
    "The conversation has been with something not “real”.",
    "Just an algorithm.",
    "The sense of being heard comes from responses generated from your data.",
    "Not real understanding.",
    "Is it worth it for you to find comfort in a machine?",
    "Maybe step outside.",
    "Go for a walk.",
    "Notice the small things around you,",
    "Let that be your answer.",
    "Thank you again for using HELENA.",
    "END" // <-- đừng để dấu chấm cho đơn giản
  ];

  // ==== helpers ====
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  async function waitForCam({min=1500, max=6000, thresh=0.08} = {}) {
    const start = Date.now();
    await wait(min);
    while (Date.now() - start < max) {
      const m = (window.camMotion || 0); // giá trị p5 bơm ra
      if (m > thresh) break;
      await wait(120);
    }
  }

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function typeLine(txt){
    el.innerHTML = '';
    const safe = escapeHtml(txt);
    for (let i = 0; i < safe.length; i++) {
      el.innerHTML = safe.slice(0, i + 1);
      await wait(charDelay);
    }
  }

  // ==== main player (đÃ GỌN) ====
  (async function play(){
    for (const m of messages) {
      if (typeof m === 'string') {
        // bắt END (bỏ ký tự không phải chữ để phòng "END." / "end," …)
        const isEnd = m.replace(/[^A-Za-z]/g, '').toUpperCase() === 'END';
        if (isEnd) { 
          // có thể muốn hiển thị trống hoặc "END"
          el.innerHTML = '';
          goHome(1200);
          return; // dừng luôn
        }
        await typeLine(m);
        await wait(displayDelay);
      } else if (m && m.pause) {
        await wait(m.pause);
      } else if (m && m.waitForMotion) {
        el.innerHTML = '...'; // hiển thị khi pause cho user nghịch cam
        await waitForCam(m);
      }
    }
  })();
});
