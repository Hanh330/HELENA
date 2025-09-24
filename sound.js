
const TONE_CDN = 'https://unpkg.com/tone/build/Tone.js';
const CANDIDATE_PATHS = [
  '/A3_Website/audio-website-2.wav',
  '/samples/audio-website-2.wav',
  '/audio-website-2.wav',
  './audio-website-2.wav'
];

// Defaults matched to your panel
const DEFAULTS = {
  fileVolDb: 0,
  fileLoop: true,
  oscType: 'sawtooth',
  oscFreq: 76,
  droneVolDb: -9,
  droneDetuneCents: 8,
  noiseType: 'brown',
  noiseVolDb: 0,
  noiseCutHz: 2966,
  reverbWet: 1.0,
  reverbDecay: 12.0,
  delayWet: 0.13,
  delayTime: 0.13,
  masterDb: -11.5
};

const $ = s => document.querySelector(s);
const dbToGain = db => Math.pow(10, db/20);
const log = (...a) => console.log('[autoplay-audio]', ...a);

let ToneLib = null;
let audioEl = null;      
let media = null;       
let filePlayer = null;   
let master = null, reverb = null, delay = null, widener = null;
let fileGain = null;
let noiseNode = null, noiseFilter = null, noiseGain = null;
let oscA = null, oscB = null, droneFilter = null, droneGain = null;
let started = false, slowRandTimer = null, lfo = null;


async function loadTone() {
  if (window.Tone) return window.Tone;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TONE_CDN;
    s.onload = () => window.Tone ? resolve(window.Tone) : reject(new Error('Tone loaded but missing'));
    s.onerror = e => reject(new Error('Tone load failed: ' + e));
    document.head.appendChild(s);
  });
}

function buildGraph() {
  if (!ToneLib) return;
  if (master) return;

  master = new ToneLib.Gain(dbToGain(DEFAULTS.masterDb)).toDestination();
  reverb = new ToneLib.Reverb({ decay: DEFAULTS.reverbDecay, preDelay: 0.03, wet: DEFAULTS.reverbWet });
  delay = new ToneLib.FeedbackDelay({ delayTime: DEFAULTS.delayTime, feedback: 0.25, wet: DEFAULTS.delayWet });
  widener = new ToneLib.StereoWidener(0.55);

  
  fileGain = new ToneLib.Gain(dbToGain(DEFAULTS.fileVolDb));
  fileGain.chain(reverb, delay, widener, master);

  
  noiseNode = new ToneLib.Noise(DEFAULTS.noiseType);
  noiseFilter = new ToneLib.Filter(DEFAULTS.noiseCutHz, 'lowpass');
  noiseGain = new ToneLib.Gain(dbToGain(DEFAULTS.noiseVolDb));
  noiseNode.chain(noiseFilter, noiseGain, reverb, delay, widener, master);

  
  oscA = new ToneLib.Oscillator(DEFAULTS.oscFreq, DEFAULTS.oscType);
  oscB = new ToneLib.Oscillator(DEFAULTS.oscFreq, DEFAULTS.oscType);
  oscB.detune.value = DEFAULTS.droneDetuneCents;
  droneFilter = new ToneLib.Filter(700, 'lowpass');
  droneGain = new ToneLib.Gain(dbToGain(DEFAULTS.droneVolDb));
  const crusher = new ToneLib.BitCrusher({ bits: 16 });

  oscA.connect(droneFilter);
  oscB.connect(droneFilter);
  droneFilter.chain(droneGain, crusher, reverb, delay, widener, master);

  reverb.generate && reverb.generate();

  log('Graph built with defaults.');
}



async function ensureAudio(candidatePaths = CANDIDATE_PATHS) {

  if ((media && fileGain) || (filePlayer && fileGain)) return;


  if (!audioEl) {
    const existing = document.querySelector('audio');
    if (existing && existing.src) {
      audioEl = existing;
      log('Using existing <audio> src=', audioEl.src);
    } else {
      audioEl = document.createElement('audio');
      audioEl.crossOrigin = 'anonymous';
      audioEl.preload = 'auto';
      audioEl.loop = DEFAULTS.fileLoop;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);

  
      for (const p of candidatePaths) {
        try {
          const r = await fetch(encodeURI(p), { method: 'HEAD' });
          if (r && r.ok) { audioEl.src = p; log('Found sample', p); break; }
        } catch(e){
          try {
            const r2 = await fetch(encodeURI(p), { method: 'GET' });
            if (r2 && r2.ok) { audioEl.src = p; log('Found sample via GET', p); break; }
          } catch(_) {}
        }
      }
      if (!audioEl.src) log('No default sample auto-found; load one or drop a file.');
    }
  }

 
  buildGraph();

 
  try {
    if (ToneLib && typeof ToneLib.MediaElement === 'function') {
     
      if (filePlayer && filePlayer.dispose) { try { filePlayer.stop(); filePlayer.dispose(); } catch(e){ } filePlayer = null; }
      media = new ToneLib.MediaElement(audioEl);
      media.connect(fileGain);
      audioEl.muted = true; 
      log('MediaElement connected -> fileGain (streaming mode).');
    } else {
      
      media = null;
      if (filePlayer && filePlayer.dispose) { try { filePlayer.stop(); filePlayer.dispose(); } catch(e){} filePlayer = null; }
      if (audioEl.src) {
        filePlayer = new ToneLib.Player({
          url: audioEl.src,
          loop: DEFAULTS.fileLoop,
          autostart: false
        });
        filePlayer.connect(fileGain);
       
        filePlayer.on && filePlayer.on('load', () => log('Player loaded', audioEl.src));
        filePlayer.on && filePlayer.on('error', (err) => console.error('Player error', err));
        log('Tone.Player created and connected -> fileGain (fallback).');
      } else {
        log('No audioEl.src to create Tone.Player yet.');
      }
      audioEl.muted = true;
    }
  } catch (err) {
    console.error('ensureAudio error:', err);
    throw err;
  }
}


async function loadBlob(blobUrl, name='local') {
  await ensureAudio([blobUrl]);
  audioEl.src = blobUrl;
  audioEl.loop = DEFAULTS.fileLoop;
  audioEl.load();
  log('Loaded blob', name);
}


async function startAll(allowAutoplay=false) {
  if (started) return;
  if (!ToneLib) { log('Tone not ready'); return; }

  try { await ToneLib.start(); } catch(e) { log('Tone.start warning', e); }

  await ensureAudio();


  try { noiseNode && noiseNode.start && noiseNode.start(); } catch(e){}
  try { oscA && oscA.start && oscA.start(); } catch(e){}
  try { oscB && oscB.start && oscB.start(); } catch(e){}


  noiseGain && (noiseGain.gain.value = dbToGain(DEFAULTS.noiseVolDb));
  droneGain && (droneGain.gain.value = dbToGain(DEFAULTS.droneVolDb));
  fileGain && (fileGain.gain.value = dbToGain(DEFAULTS.fileVolDb));
  master && (master.gain.value = dbToGain(DEFAULTS.masterDb));

  // gentle breathing movement
  slowRandTimer = setInterval(()=> {
    if (!droneFilter) return;
    const base = Math.max(100, DEFAULTS.oscFreq * 4);
    const jitter = (Math.random()-0.5)*200;
    const tgt = Math.max(40, base + jitter);
    droneFilter.frequency.rampTo(tgt, 2.6);
  }, 3000);

  // play audio depending on mode
  try {
    if (media) {
      // streaming mode via <audio>
      audioEl.muted = false;
      await audioEl.play();
      log('audioEl.play() OK (media mode).');
    } else if (filePlayer) {
      // Player mode
      // start() needs Tone context running
      filePlayer.start(0);
      log('filePlayer.start() OK (player mode).');
    } else {
      log('No media or player available to play.');
    }
  } catch (err) {
    log('Play attempt failed (likely autoplay blocked):', err);
    // if autoplay blocked, re-mute to avoid audible fallback
    try { audioEl && (audioEl.muted = true); } catch(e){}
    throw err;
  }

  started = true;
  log('Started all audio sources.');
}

function stopAll() {
  if (!started) return;
  try { noiseGain && noiseGain.gain.rampTo(0, 0.5); } catch(e){}
  try { droneGain && droneGain.gain.rampTo(0, 0.5); } catch(e){}
  try { master && master.gain.rampTo(0, 0.5); } catch(e){}
  try {
    if (media && audioEl && !audioEl.paused) { audioEl.pause(); audioEl.currentTime = 0; }
  } catch(e){}
  try {
    if (filePlayer && filePlayer.state === 'started') { filePlayer.stop(0); }
  } catch(e){}
  clearInterval(slowRandTimer);
  started = false;
  log('Stopped all audio sources.');
}

// small unintrusive enable button if autoplay blocked
function createEnableButton() {
  if (document.getElementById('audio-enable-btn')) return;
  const b = document.createElement('button');
  b.id = 'audio-enable-btn';
  b.textContent = 'Enable audio';
  Object.assign(b.style, {
    position: 'fixed', right: '12px', bottom: '12px', zIndex: 9999999,
    padding: '8px 12px', background: '#111', color: '#fff', border: '1px solid #333',
    borderRadius: '6px', opacity: 0.95
  });
  b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      await startAll(true);
      b.remove();
      log('Enabled audio via user click.');
    } catch(e) {
      console.error('Enable click failed', e);
      alert('Vẫn chưa bật được âm — check console or allow autoplay for this site in browser settings.');
      b.disabled = false;
    }
  });
  document.body.appendChild(b);
}

// drag & drop support
(function installDrop() {
  window.addEventListener('dragover', e => { e.preventDefault(); }, { passive:false });
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    await loadBlob(url, f.name);
    log('Dropped and loaded file:', f.name, '— press M to play (or click Enable audio if shown).');
  }, { passive:false });
})();

// keyboard M toggles ON/OFF
window.addEventListener('keydown', async (ev) => {
  if (ev.key.toLowerCase() !== 'm') return;
  ev.preventDefault();
  if (!ToneLib) {
    try {
      ToneLib = await loadTone();
      log('Tone loaded via keypress.');
    } catch(e) {
      console.error('Tone load error', e);
      alert('Không load Tone.js — check network.');
      return;
    }
  }

  // ensure graph and audio
  buildGraph();
  try {
    await ensureAudio();
  } catch(e) {
    console.warn('ensureAudio failed on keypress:', e);
  }

  if (!started) {
    try {
      await startAll();
    } catch(e) {
      log('Autoplay blocked on keypress start:', e);
      createEnableButton();
    }
  } else {
    stopAll();
  }
});

// bootstrap: try autoplay on load, fallback to enable button if blocked
(async function initAutoplay() {
  try {
    ToneLib = await loadTone();
    log('Tone preloaded:', ToneLib && ToneLib.version);
  } catch(e) {
    console.warn('Tone load failed at init (will try on keypress):', e);
    return;
  }

  buildGraph();
  try {
    await ensureAudio();
  } catch(err) {
    console.warn('ensureAudio init failed:', err);
  }

  // attempt autoplay once
  try {
    await startAll();
    log('Autoplay succeeded on load.');
  } catch(err) {
    log('Autoplay blocked on load; creating enable button.', err);
    createEnableButton();
  }
})();
