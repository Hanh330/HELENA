// INDEX 2 : NÓ LÀ CÁI ASCII BÊN PHẢI MÔ PHỎNG 
let asciiChar = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,^`'. ";
let sampleVideo;
let size = 6;
let cnv;
const containerSelector = '.panel-videoframe';

let showMessage = false;
let msgAlpha = 0;
const messageText = "Remember: she is not real.";

// readiness + cache
let sampleReady = false;
let cachedPixels = null;
let cachedCols = 0;
let cachedRows = 0;

function setup() {
  const container = document.querySelector(containerSelector) || document.body;
  const rect = container.getBoundingClientRect();
  const W = (rect && rect.width > 10) ? Math.floor(rect.width) : windowWidth;
  const H = (rect && rect.height > 10) ? Math.floor(rect.height) : windowHeight;

  pixelDensity(1);
  cnv = createCanvas(W, H);
  cnv.parent(container);

  cnv.elt.style.position = 'absolute';
  cnv.elt.style.left = '0';
  cnv.elt.style.top = '0';
  cnv.elt.style.width = '100%';
  cnv.elt.style.height = '100%';
  cnv.elt.style.zIndex = 999;
  cnv.elt.style.pointerEvents = 'none';


  sampleVideo = createVideo(['Helena_AI.mp4'], () => {
  
    if (sampleVideo.elt) {
      sampleVideo.elt.muted = true;
      sampleVideo.elt.setAttribute('muted', '');
      sampleVideo.elt.playsInline = true;
      sampleVideo.loop();
      const p = sampleVideo.elt.play();
      if (p && p.catch) {
        p.catch(e => {
          console.warn('Video play() blocked:', e);
        });
      }


      const onReady = () => {
        sampleReady = true;
        tryCacheCurrentFrame();
      };
      sampleVideo.elt.addEventListener('loadeddata', onReady, { once: true });
      sampleVideo.elt.addEventListener('canplay', onReady, { once: true });
      sampleVideo.elt.addEventListener('playing', onReady, { once: true });
    }
  });

  sampleVideo.parent(container);
  sampleVideo.hide(); 

  const vidW = max(2, floor(W / size));
  const vidH = max(2, floor(H / size));
  sampleVideo.size(vidW, vidH);

  textFont('IBM Plex Mono, monospace');
  textAlign(CENTER, CENTER);
  noStroke();

  container.addEventListener('mouseenter', () => { showMessage = true; });
  container.addEventListener('mouseleave', () => { showMessage = false; });

  frameRate(30);

  
  setTimeout(tryCacheCurrentFrame, 200);
}


function tryCacheCurrentFrame() {
  if (!sampleVideo || !sampleVideo.width) return;
  try {
    sampleVideo.loadPixels();
    if (sampleVideo.pixels && sampleVideo.pixels.length >= 4) {
      cachedCols = sampleVideo.width;
      cachedRows = sampleVideo.height;
      cachedPixels = new Uint8ClampedArray(sampleVideo.pixels.length);
      cachedPixels.set(sampleVideo.pixels);
 
      sampleReady = true;
    }
  } catch (err) {

  
  }
}

function draw() {
  clear();

 
  let cols = 0, rows = 0, pixels = null;
  let usedCache = false;

  if (sampleReady) {

    try {
      sampleVideo.loadPixels();
      if (sampleVideo.pixels && sampleVideo.pixels.length >= 4) {
        pixels = sampleVideo.pixels;
        cols = sampleVideo.width;
        rows = sampleVideo.height;

        if (frameCount % 6 === 0) {
          cachedCols = cols; cachedRows = rows;
          cachedPixels = new Uint8ClampedArray(pixels.length);
          cachedPixels.set(pixels);
        }
      } else if (cachedPixels) {
        pixels = cachedPixels;
        cols = cachedCols; rows = cachedRows;
        usedCache = true;
      }
    } catch (err) {
      if (cachedPixels) {
        pixels = cachedPixels;
        cols = cachedCols; rows = cachedRows;
        usedCache = true;
      } else {
        pixels = null;
      }
    }
  } else {
 
    if (cachedPixels) {
      pixels = cachedPixels;
      cols = cachedCols; rows = cachedRows;
      usedCache = true;
    }
  }

  
  if (!pixels) {
    renderAsciiFallback();
  } else {

    fill(86, 190, 25);
    const sx = width / cols;
    const sy = height / rows;
    const ts = min(sx, sy) * 0.95;
    textSize(ts);
for (let j = 0; j < rows; j++) {
  for (let i = 0; i < cols; i++) {
    
    const colSrc = SELFIE_FLIP ? (cols - 1 - i) : i;
    const idx = (colSrc + j * cols) * 4;

    const r = pixels[idx] || 0;
    const g = pixels[idx + 1] || 0;
    const b = pixels[idx + 2] || 0;
    const bright = (r + g + b) / 3;

    let tIndex = floor(map(bright, 0, 255, 0, asciiChar.length - 1));
    tIndex = constrain(tIndex, 0, asciiChar.length - 1);
    const ch = asciiChar.charAt(asciiChar.length - 1 - tIndex);

    // vẽ ở vị trí i (không lật chữ)
    const x = i * sx + sx / 2;
    const y = j * sy + sy / 2;
    text(ch, x, y);
  }
}
  }

  // occasionally refresh cache if live available
  if (frameCount % 15 === 0) tryCacheCurrentFrame();

  // message handling (fade)
  const target = showMessage ? 255 : 0;
  msgAlpha = lerp(msgAlpha, target, 0.18);

  if (msgAlpha > 2) {
    const base = min(width, height);
    let sz = floor(base * 0.07);
    sz = constrain(sz, 18, 84);
    textSize(sz);

    const maxW = width * 0.9;
    let tw = textWidth(messageText);
    if (tw > maxW) {
      const ratio = maxW / tw;
      sz = max(12, floor(sz * ratio));
      textSize(sz);
      tw = textWidth(messageText);
    }
    const th = sz + 20;
    const cx = width * 0.5;
    const cy = height * 0.5;
    push();
    rectMode(CENTER);
    noStroke();
    fill(0, 0, 0, msgAlpha * 0.55);
    const padX = 24;
    const padY = 12;
    rect(cx, cy, tw + padX, th + padY, 8);
    pop();

    fill(86, 190, 25, msgAlpha);
    textAlign(CENTER, CENTER);
    text(messageText, cx, cy);
  }
}

// fallback ASCII generator so user always sees ascii while waiting
function renderAsciiFallback() {
  const cols = max(8, floor(width / max(4, size))); // coarse fallback
  const rows = max(6, floor(height / max(4, size)));
  const sx = width / cols;
  const sy = height / rows;
  const ts = min(sx, sy) * 0.9;
  textSize(ts);
  fill(86, 190, 25);

  // use noise so fallback looks "cohesive" rather than totally random
  const t = millis() * 0.0006;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      // per-cell brightness from noise
      const n = noise(i * 0.12, j * 0.12, t);
      const bright = n * 255;
      let tIndex = floor(map(bright, 0, 255, 0, asciiChar.length - 1));
      tIndex = constrain(tIndex, 0, asciiChar.length - 1);
      const ch = asciiChar.charAt(asciiChar.length - 1 - tIndex);
      const x = i * sx + sx / 2;
      const y = j * sy + sy / 2;
      text(ch, x, y);
    }
  }
}

function windowResized() {
  const container = document.querySelector(containerSelector) || document.body;
  const rect = container.getBoundingClientRect();
  const newW = (rect && rect.width > 10) ? Math.floor(rect.width) : windowWidth;
  const newH = (rect && rect.height > 10) ? Math.floor(rect.height) : windowHeight;
  resizeCanvas(newW, newH);
  cnv.elt.style.width = '100%';
  cnv.elt.style.height = '100%';
  if (sampleVideo) {
    const vidW = max(2, floor(newW / size));
    const vidH = max(2, floor(newH / size));
    sampleVideo.size(vidW, vidH);
  }
  
}
const SELFIE_FLIP = true; 