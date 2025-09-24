


//INDEX 1 ONLY

// slow the video 
const PLAYBACK_RATE = 0.6;   
const CROSSFADE_SECS = 0.9; 
const ENABLE_TRAIL = true; 
const wrap = document.querySelector('.fg-wrap') || document.querySelector('#first-page');
try {
  fg.playbackRate = PLAYBACK_RATE;
} catch(e){ console.warn('Cannot set playbackRate', e); }
const fgB = fg.cloneNode(true);
fgB.removeAttribute('id'); 
fgB.id = 'fgB';
fgB.style.position = 'absolute';
fgB.style.left = '50%';
fgB.style.top = '50%';
fgB.style.transform = 'translate(-50%,-50%)';
fgB.style.opacity = '0';
fgB.style.transition = `opacity ${CROSSFADE_SECS}s ease`;
fgB.style.pointerEvents = 'none';
fgB.style.zIndex = (parseInt(window.getComputedStyle(fg).zIndex || 2) + 1).toString();
(function copyVisualStyles(){
  const cs = window.getComputedStyle(fg);
  const keys = ['maxWidth','maxHeight','width','height','objectFit','display'];
  keys.forEach(k=>{
    try{
      const val = cs.getPropertyValue(k) || cs[k];
      if(val) fgB.style[k] = val;
    }catch(e){}
  });
})();
if(wrap){
  wrap.appendChild(fgB);
} else {
  document.body.appendChild(fgB);
}
fgB.playbackRate = PLAYBACK_RATE;
let active = 'A'; 
fg.style.position = 'absolute';
fg.style.left = '50%';
fg.style.top = '50%';
fg.style.transform = 'translate(-50%,-50%)';
fg.style.transition = `opacity ${CROSSFADE_SECS}s ease`;
fg.style.pointerEvents = 'none';
fg.style.zIndex = '2';
fg.style.opacity = '1';
fg.setAttribute('preload','auto');
fgB.setAttribute('preload','auto');
function startCrossfade(fromEl, toEl){
  if(!fromEl || !toEl) return;
  if(!toEl.paused) return; 
  try { toEl.currentTime = 0; } catch(e) {}
  toEl.play().then(()=>{
    toEl.style.opacity = '1';
    fromEl.style.opacity = '0';
    setTimeout(()=> {
      try { fromEl.pause(); } catch(e) {}
    }, (CROSSFADE_SECS*1000) + 50);
  }).catch(err=>{
    console.warn('Play rejected (autoplay?)', err);
  });
}
const PRESTART = CROSSFADE_SECS + 0.04; 
fg.addEventListener('timeupdate', ()=>{
  if (fg.duration && (fg.duration - fg.currentTime) <= PRESTART && fgB.paused) {
    startCrossfade(fg, fgB);
  }
});
fgB.addEventListener('timeupdate', ()=>{
  if (fgB.duration && (fgB.duration - fgB.currentTime) <= PRESTART && fg.paused) {
    startCrossfade(fgB, fg);
  }
});
fg.addEventListener('ended', ()=>{ try { fg.pause(); fg.currentTime=0; } catch(e){} });

if(ENABLE_TRAIL){
  const cv = document.createElement('canvas');
  cv.id = 'videoTrailCanvas';
  cv.style.position = 'absolute';
  cv.style.left = '50%';
  cv.style.top = '50%';
  cv.style.transform = 'translate(-50%,-50%)';
  cv.style.width = '100%';
  cv.style.height = '100%';
  cv.style.zIndex = '4';
  cv.style.pointerEvents = 'none';
  wrap.appendChild(cv);
  const ctx = cv.getContext('2d', {alpha:true});
  function fitCanvasToViewport(){
    const vw = Math.min(window.innerWidth, fg.videoWidth || 1280);
    const vh = Math.min(window.innerHeight, fg.videoHeight || 720);
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
  }
  fitCanvasToViewport();
  window.addEventListener('resize', fitCanvasToViewport);
  const trailAlpha = 0.25; 
  const draw = ()=>{
    ctx.fillRect(0,0,cv.width,cv.height);
    const vid = (fg && !fg.paused) ? fg : (fgB && !fgB.paused ? fgB : fg);
    if(!vid || vid.readyState < 2){ 
      requestAnimationFrame(draw);
      return;
    }
    const vw = vid.videoWidth, vh = vid.videoHeight;
    const rw = cv.width, rh = cv.height;
    const scale = Math.min(rw / vw, rh / vh);
    const dw = Math.round(vw * scale), dh = Math.round(vh * scale);
    const dx = Math.round((rw - dw) / 2), dy = Math.round((rh - dh) / 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(vid, 0, 0, vw, vh, dx, dy, dw, dh);

    // loop
    requestAnimationFrame(draw);
  };
  const startWhenReady = (v)=>{
    if(v.readyState >= 2){
      fitCanvasToViewport();
      requestAnimationFrame(draw);
    } else {
      v.addEventListener('loadedmetadata', ()=>{
        fitCanvasToViewport();
        requestAnimationFrame(draw);
      }, {once:true});
    }
  };
  startWhenReady(fg);
  fg.style.opacity = '0';
  fgB.style.opacity = '0';
  fg.style.zIndex = '1';
  fgB.style.zIndex = '1';
}
Promise.all([fg.play(), fgB.play().catch(()=>{})]).catch(()=>{});
console.log('Video slowloop script initialized: playbackRate=', PLAYBACK_RATE, 'crossfade=', CROSSFADE_SECS, 'trail=', ENABLE_TRAIL);
// slow the video end here


// text typing intro + slide sang index 2
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('subtitle');
  const container = document.querySelector('.text');
  const index2Url = 'index2.html'; 

  const charDelay = 70;
  const displayDelay = 1600;

  const messages = [
    "Please wear headphones for a better experience.",
    "Press M.",
    "Are you lost and lonely?",
    "Try to ask yourself.",
    "Who are you?",
    "Are't you feel lonely these days?",
    "And lonelier each day.",
    "Feeling empty and alienated.",
    "All that you need is to be accompanied.",
    "To be listened and understood.",
    "You need someone to count on.",
    "We are proud to introduce you.",
    "Our first artificial intelligence operating system.",
    "HELENA.",
  ];

  let idx = 0;
  let typing = false;
  let controller = {
    skipTyping: false,
    nextRequested: false,
    stop: false
  };

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function typeMessage(msg){
    typing = true;
    el.textContent = '';
    for (let i = 1; i <= msg.length; i++){
      el.textContent = msg.slice(0, i);
      if (controller.skipTyping){
        controller.skipTyping = false;
        el.textContent = msg;
        break;
      }
      await wait(charDelay);
    }
    typing = false;
  }

  function onHelenaReached(){
    controller.stop = true;
    el.classList.add('helena-blink');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.style.cursor = 'pointer';

    if (!el._helenaClickAttached){
      const clickHandler = (e) => {
        e.stopPropagation();
        startSlide();
      };
      const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          startSlide();
        }
      };
      el.addEventListener('click', clickHandler);
      el.addEventListener('keydown', keyHandler);
      el._helenaClickAttached = { clickHandler, keyHandler };
    }
  }
  function createOverlayOnce(){
    let ov = document.querySelector('.slide-overlay');
    if (!ov){
      ov = document.createElement('div');
      ov.className = 'slide-overlay';
      document.body.appendChild(ov);
    }
    return ov;
  }

  function startSlide(){
    if (window._slideStarted) return;
    window._slideStarted = true;
    el.classList.remove('helena-blink');
    el.style.cursor = '';
    if (el._helenaClickAttached){
      el.removeEventListener('click', el._helenaClickAttached.clickHandler);
      el.removeEventListener('keydown', el._helenaClickAttached.keyHandler);
      delete el._helenaClickAttached;
    }

    const overlay = createOverlayOnce();

    function onTransEnd(e){
      if (e.propertyName === 'top'){
        overlay.removeEventListener('transitionend', onTransEnd);
        window.location.href = index2Url;
      }
    }

    overlay.addEventListener('transitionend', onTransEnd);
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
    setTimeout(() => {
      if (window._slideStarted) window.location.href = index2Url;
    }, 3500);
  }

  async function loopMessages(){
    while (!controller.stop){
      const msg = messages[idx];
      await typeMessage(msg);
      if (String(msg).trim().toUpperCase() === 'HELENA.'){
        onHelenaReached();
        return;
      }
      let waited = 0;
      const step = 100;
      while (waited < displayDelay && !controller.nextRequested){
        await wait(step);
        waited += step;
      }
      controller.nextRequested = false;
      idx = (idx + 1) % messages.length;
    }
  }
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typing){
      controller.skipTyping = true;
    } else {
      controller.nextRequested = true;
    }
  });
  loopMessages();
});


