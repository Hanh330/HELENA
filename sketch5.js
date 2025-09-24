/************ CONST trước – tránh TDZ ************/
const VIDEO_W = 320;
const VIDEO_H = 240;
const INVERT_MODE = true;

// Motion / blob detection
const MOTION_THRESH = 14;
const MORPH_KERNEL = 3;
const MIN_BLOB_PIXELS = 140;
const MIN_BLOB_HEIGHT = 4;
const DETECT_EVERY = 3;

// Trail / visual
const TRAIL_FADE = 100;
const TINT_RGBA = [80, 220, 140, 150];
const CHROMA_SHIFT = 5; // px

// Noise / VHS
const NOISE_DOTS = 90;
const NOISE_ALPHA = 10;
const SCAN_ALPHA = 18;

const BOX_STROKE_WEIGHT = 0.3;
const LINE_STROKE_WEIGHT = 0.3;
const LABEL_FONT_SIZE = 20;

const WORD_LIST = [
  "hobbies","loneliness","depressed","age","lost","identity","datas","motion",
  "expressions","behavior","emotions","memories","dreams","desires","fears","thoughts",
  "consciousness","subconscious","perception","habits",
];

// GLITCH defaults (đang dùng)
const limitB  = 10;
const randomB = 100;

// THERMAL toggle + gain (bảng màu nhiệt)
const THERMAL_MODE = true;       // bật / tắt thermal
const THERMAL_GAIN = 1.0;        // >1.0 tăng độ nóng, <1.0 dịu bớt


/************ Biến global ************/
let glitch;
let video;
let prevFrame;
let motionRatio = 0;
let motionCx = VIDEO_W / 2;

let proc, trail, noiseG, scanG;
let prevLuma, currLuma, binary, visited;
let lastBlobs = [];
let therm;  // << buffer thermal

/************ Utils ************/
function computeDisplaySize() {
  const maxWidth = Math.min(windowWidth * 0.85, 1100);
  const aspect = VIDEO_H / VIDEO_W;
  const w = Math.round(maxWidth);
  const h = Math.round(w * aspect);
  return { w, h };
}

/* Bảng màu nhiệt (blue→cyan→green→yellow→orange→red→white)
   t ∈ [0..1] */
function heatRGB(t) {
  t = constrain(t * THERMAL_GAIN, 0, 1);
  let r=0,g=0,b=0;
  if (t < 0.17) {            // đen → xanh dương
    const k = t / 0.17;
    r = 0; g = 0; b = lerp(0, 255, k);
  } else if (t < 0.33) {     // xanh dương → lục lam
    const k = (t-0.17)/0.16;
    r = 0; g = lerp(0, 255, k); b = 255;
  } else if (t < 0.50) {     // lục lam → xanh lá
    const k = (t-0.33)/0.17;
    r = 0; g = 255; b = lerp(255, 0, k);
  } else if (t < 0.67) {     // xanh lá → vàng
    const k = (t-0.50)/0.17;
    r = lerp(0, 255, k); g = 255; b = 0;
  } else if (t < 0.83) {     // vàng → đỏ
    const k = (t-0.67)/0.16;
    r = 255; g = lerp(255, 64, k); b = 0;
  } else {                   // đỏ → trắng nóng
    const k = (t-0.83)/0.17;
    r = 255; g = lerp(64, 255, k); b = lerp(0, 255, k);
  }
  return [r|0, g|0, b|0];
}

/* Tô màu thermal dựa trên luma của src (p5.Image/graphics) vào dest (p5.Image) */
function makeThermal(srcImg, destImg) {
  if (!srcImg) return;
  srcImg.loadPixels();
  destImg.loadPixels();
  const w = destImg.width, h = destImg.height;

  // Nếu kích thước không khớp, copy về kích thước dest để đọc luma nhanh
  // (srcImg có thể là glitch.image cùng size VIDEO_WxVIDEO_H)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = 4 * (x + y * w);
      const r = srcImg.pixels[i]   || 0;
      const g = srcImg.pixels[i+1] || 0;
      const b = srcImg.pixels[i+2] || 0;
      const lum = 0.299*r + 0.587*g + 0.114*b;     // 0..255
      const t = lum / 255.0;
      const [hr, hg, hb] = heatRGB(t);
      destImg.pixels[i]   = hr;
      destImg.pixels[i+1] = hg;
      destImg.pixels[i+2] = hb;
      destImg.pixels[i+3] = 255;
    }
  }
  destImg.updatePixels();
}

/************ p5 lifecycle ************/
function setup() {
  // container
  let wrap = document.getElementById('cameraWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'cameraWrap';
    (document.querySelector('main[data-barba-namespace="page5"], .page-5, main.page-5') || document.body)
      .appendChild(wrap);
  }

  // canvas hiển thị
  const display = computeDisplaySize();
  const cnv = createCanvas(display.w, display.h);
  cnv.parent('cameraWrap');
  pixelDensity(1);
  imageMode(CORNER);

  // camera input để xử lý
  video = createCapture(VIDEO, ()=>{});
  video.size(VIDEO_W, VIDEO_H);
  video.hide();

  // buffer phụ
  proc  = createGraphics(VIDEO_W, VIDEO_H); proc.pixelDensity(1);
  trail = createGraphics(width, height);    trail.pixelDensity(1); trail.clear();
  noiseG= createGraphics(width, height);    noiseG.pixelDensity(1); noiseG.clear();
  scanG = createGraphics(width, height);    scanG.pixelDensity(1);  makeScanlines();

  // thermal buffer
  therm = createImage(VIDEO_W, VIDEO_H);

  // bộ nhớ phân tích
  prevLuma = new Float32Array(VIDEO_W * VIDEO_H);
  currLuma = new Float32Array(VIDEO_W * VIDEO_H);
  binary   = new Uint8Array  (VIDEO_W * VIDEO_H);
  visited  = new Uint8Array  (VIDEO_W * VIDEO_H);

  // GLITCH
  glitch = new Glitch();
  glitch.pixelate(10);
  prevFrame = createImage(VIDEO_W, VIDEO_H);
}

function draw() {
  /************ GLITCH: build ************/
  if (frameCount % 3 === 0 && video.loadedmetadata) {
    video.loadPixels();

    if (!prevFrame.pixels.length) {
      prevFrame.copy(video, 0, 0, VIDEO_W, VIDEO_H, 0, 0, VIDEO_W, VIDEO_H);
      prevFrame.loadPixels();
    }

    // motion
    let sum = 0, sumX = 0, cnt = 0;
    for (let y = 0; y < VIDEO_H; y++) {
      for (let x = 0; x < VIDEO_W; x++) {
        const i = 4 * (x + y * VIDEO_W);
        const r1 = video.pixels[i],   g1 = video.pixels[i+1], b1 = video.pixels[i+2];
        const r0 = prevFrame.pixels[i], g0 = prevFrame.pixels[i+1], b0 = prevFrame.pixels[i+2];
        const l1 = 0.299*r1 + 0.587*g1 + 0.114*b1;
        const l0 = 0.299*r0 + 0.587*g0 + 0.114*b0;
        const d  = Math.abs(l1 - l0);
        sum += d; if (d > 15) { sumX += x; cnt++; }
      }
    }
    prevFrame.copy(video, 0, 0, VIDEO_W, VIDEO_H, 0, 0, VIDEO_W, VIDEO_H);
    prevFrame.loadPixels();

    const motionRatio = constrain(map(sum / (VIDEO_W*VIDEO_H*255), 0, 0.12, 0, 1), 0, 1);
    const motionCx    = (cnt ? sumX / cnt : VIDEO_W / 2);

    glitch.resetBytes();
    glitch.limitBytes(max(0.05, motionRatio * 0.9));
    glitch.randomBytes(max(12, map(motionCx, 0, VIDEO_W, 5, 120)));

    const frameImg = video.get(0, 0, VIDEO_W, VIDEO_H);
    glitch.loadImage(frameImg);
    glitch.buildImage();
  }

  if (!video || !video.loadedmetadata) {
    background(0);
    fill(255); textSize(20); textAlign(CENTER, CENTER);
    text('Waiting for webcam...', width/2, height/2);
    return;
  }

  /************ Tính rect vẽ cover ************/
  const vw = (video.elt && video.elt.videoWidth) || video.width;
  const vh = (video.elt && video.elt.videoHeight) || video.height;
  const canvasAR = width / height;
  const videoAR  = vw / vh;
  let drawW, drawH, drawX, drawY;
  if (videoAR > canvasAR) { drawH = height; drawW = drawH * videoAR; drawX = (width - drawW)/2; drawY = 0; }
  else { drawW = width; drawH = drawW / videoAR; drawX = 0; drawY = (height - drawH)/2; }

  /************ Pipeline phân tích (từ video gốc) ************/
  video.loadPixels();
  proc.loadPixels();
  if (video.pixels.length === 0) return;

  for (let y = 0; y < VIDEO_H; y++) {
    const row = y * VIDEO_W;
    for (let x = 0; x < VIDEO_W; x++) {
      const idx = (x + row) * 4;
      let r = video.pixels[idx], g = video.pixels[idx+1], b = video.pixels[idx+2];
      r = constrain(((r - 128) * 1.15) + 128, 0, 255);
      g = constrain(((g - 128) * 1.15) + 128, 0, 255);
      b = constrain(((b - 128) * 1.15) + 128, 0, 255);
      const lum = 0.299*r + 0.587*g + 0.114*b;
      proc.pixels[idx]   = lerp(lum, r, 1.05);
      proc.pixels[idx+1] = lerp(lum, g, 1.05);
      proc.pixels[idx+2] = lerp(lum, b, 1.05);
      proc.pixels[idx+3] = 255;
      currLuma[x + row]  = lum;
    }
  }
  proc.updatePixels();

  for (let i = 0; i < VIDEO_W * VIDEO_H; i++) {
    const d = Math.abs(currLuma[i] - prevLuma[i]);
    binary[i] = d > MOTION_THRESH ? 1 : 0;
    prevLuma[i] = currLuma[i];
  }

  if (MORPH_KERNEL > 0) {
    const k = Math.floor(MORPH_KERNEL / 2);
    const tmpErode  = new Uint8Array(VIDEO_W * VIDEO_H);
    const tmpDilate = new Uint8Array(VIDEO_W * VIDEO_H);

    // erode
    for (let y = 0; y < VIDEO_H; y++) {
      const row = y * VIDEO_W;
      for (let x = 0; x < VIDEO_W; x++) {
        let ok = 1;
        for (let oy = -k; oy <= k && ok; oy++) {
          const yy = y + oy; if (yy < 0 || yy >= VIDEO_H) { ok = 0; break; }
          const rb = yy * VIDEO_W;
          for (let ox = -k; ox <= k; ox++) {
            const xx = x + ox;
            if (xx < 0 || xx >= VIDEO_W || binary[xx + rb] === 0) { ok = 0; break; }
          }
        }
        tmpErode[x + row] = ok;
      }
    }
    // dilate
    for (let y = 0; y < VIDEO_H; y++) {
      const row = y * VIDEO_W;
      for (let x = 0; x < VIDEO_W; x++) {
        let any = 0;
        for (let oy = -k; oy <= k && !any; oy++) {
          const yy = y + oy; if (yy < 0 || yy >= VIDEO_H) continue;
          const rb = yy * VIDEO_W;
          for (let ox = -k; ox <= k; ox++) {
            const xx = x + ox;
            if (xx >= 0 && xx < VIDEO_W && tmpErode[xx + rb] === 1) { any = 1; break; }
          }
        }
        tmpDilate[x + row] = any;
      }
    }
    binary = tmpDilate;
  }

  if (frameCount % DETECT_EVERY === 0) {
    lastBlobs = detectBlobs(binary, VIDEO_W, VIDEO_H);
  }

  /************ Vẽ trail + CHỌN NGUỒN ẢNH (glitch/video/thermal) ************/
  // gốc để tô thermal: ưu tiên glitch.image, fallback video
  const srcForThermal = (glitch && glitch.image && glitch.image.width) ? glitch.image : video;

  // nếu bật thermal → dựng ảnh nhiệt vào 'therm', rồi dùng nó làm texture vẽ
  if (THERMAL_MODE) {
    makeThermal(srcForThermal, therm);
  }

  // texture cuối để vẽ vào trail
  const drawTex = THERMAL_MODE
    ? therm
    : ((glitch && glitch.image && glitch.image.width) ? glitch.image : proc);

  // --- trail fade ---
  trail.noStroke();
  trail.fill(0, 0, 0, TRAIL_FADE);
  trail.rect(0, 0, trail.width, trail.height);

  // --- cấu hình flip ---
  const FLIP_HORIZ = true;
  const FLIP_VERT  = false;

  trail.push();
  const sx = drawW / VIDEO_W;
  const leftShift = CHROMA_SHIFT * sx;

  if (FLIP_HORIZ || FLIP_VERT) {
    const cxCanvas = drawX + drawW / 2;
    const cyCanvas = drawY + drawH / 2;
    trail.translate(cxCanvas, cyCanvas);
    trail.scale(FLIP_HORIZ ? -1 : 1, FLIP_VERT ? -1 : 1);

    trail.tint(180, 40, 40, TINT_RGBA[3] * 0.28);
    trail.image(drawTex, -drawW/2 - leftShift, -drawH/2, drawW, drawH); trail.noTint();

    trail.tint(TINT_RGBA[0], TINT_RGBA[1], TINT_RGBA[2], TINT_RGBA[3] * 0.92);
    trail.image(drawTex, -drawW/2, -drawH/2, drawW, drawH);             trail.noTint();

    trail.tint(50, 120, 220, TINT_RGBA[3] * 0.28);
    trail.image(drawTex, -drawW/2 + leftShift, -drawH/2, drawW, drawH); trail.noTint();
  } else {
    trail.tint(180, 40, 40, TINT_RGBA[3] * 0.28);
    trail.image(drawTex, drawX - leftShift, drawY, drawW, drawH); trail.noTint();

    trail.tint(TINT_RGBA[0], TINT_RGBA[1], TINT_RGBA[2], TINT_RGBA[3] * 0.92);
    trail.image(drawTex, drawX, drawY, drawW, drawH);             trail.noTint();

    trail.tint(50, 120, 220, TINT_RGBA[3] * 0.28);
    trail.image(drawTex, drawX + leftShift, drawY, drawW, drawH); trail.noTint();
  }
  trail.pop();

  // composite trail
  image(trail, 0, 0, width, height);

  /************ Boxes/labels từ blob ************/
  const drawnCenters = [];
  for (let i = 0; i < lastBlobs.length; i++) {
    const b = lastBlobs[i];
    const bw = b.maxX - b.minX, bh = b.maxY - b.minY;
    if (b.area < MIN_BLOB_PIXELS || bh < MIN_BLOB_HEIGHT) continue;

    const scaleX = drawW / VIDEO_W, scaleY = drawH / VIDEO_H;
    let cx = b.cx * scaleX + drawX, cy = b.cy * scaleY + drawY;
    let rx = b.minX * scaleX + drawX, ry = b.minY * scaleY + drawY;
    let rw = Math.max(2, bw * scaleX), rh = Math.max(2, bh * scaleY);

    if (FLIP_HORIZ) { cx = drawX + (drawW - (b.cx * scaleX)); rx = drawX + (drawW - ((b.minX + bw) * scaleX)); }
    if (FLIP_VERT ) { cy = drawY + (drawH - (b.cy * scaleY)); ry = drawY + (drawH - ((b.minY + bh) * scaleY)); }

    drawnCenters.push({ cx, cy, rx, ry, rw, rh });
  }

  for (const it of drawnCenters) {
    push();
    if (INVERT_MODE) { blendMode(DIFFERENCE); noStroke(); fill(255); rect(it.rx, it.ry, it.rw, it.rh); }
    else             { blendMode(SUBTRACT);   noStroke(); fill(80);  rect(it.rx, it.ry, it.rw, it.rh); }
    pop(); blendMode(BLEND);
  }

  stroke(255); strokeWeight(LINE_STROKE_WEIGHT); noFill();
  for (let i = 0; i < drawnCenters.length; i++) {
    for (let j = i + 1; j < drawnCenters.length; j++) {
      line(drawnCenters[i].cx, drawnCenters[i].cy, drawnCenters[j].cx, drawnCenters[j].cy);
    }
  }

  textAlign(LEFT, TOP);
  textSize(LABEL_FONT_SIZE);
  stroke(255, 230); strokeWeight(BOX_STROKE_WEIGHT); noFill();

  for (const it of drawnCenters) {
    stroke(255, 220); noFill(); rect(it.rx, it.ry, it.rw, it.rh);
    stroke(255, 160); rect(it.rx + it.rw*0.06, it.ry + it.rh*0.06, Math.max(1, it.rw*0.88), Math.max(1, it.rh*0.88));
    stroke(255, 110); rect(it.rx + it.rw*0.12, it.ry + it.rh*0.12, Math.max(1, it.rw*0.76), Math.max(1, it.rh*0.76));

    const chooseIdx = (Math.abs(Math.floor(it.cx) + Math.floor(it.cy))) % WORD_LIST.length;
    const word = WORD_LIST[chooseIdx];

    noStroke(); fill(0, 180); rect(it.rx - 2, it.ry - 2, 8 + textWidth(word), 16, 3);
    fill(255); text(word, it.rx + 2, it.ry + 1);
  }

  /************ Noise + scanlines ************/
  noiseG.clear(); noiseG.noStroke();
  for (let i = 0; i < NOISE_DOTS; i++) {
    const x = Math.random() * width, y = Math.random() * height, s = Math.random() * 2 + 0.5;
    noiseG.fill(255, NOISE_ALPHA); noiseG.rect(x, y, s, s);
  }
  blendMode(ADD);   image(noiseG, 0, 0, width, height);
  blendMode(BLEND); image(scanG, 0, 0, width, height);
}

/************ Blob detect ************/
function detectBlobs(bin, w, h) {
  visited.fill(0);
  const blobs = [];
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const i = x + row;
      if (bin[i] === 1 && !visited[i]) {
        let stack = [[x, y]];
        let minX = x, minY = y, maxX = x, maxY = y;
        let sumX = 0, sumY = 0, count = 0;
        while (stack.length) {
          const [qx, qy] = stack.pop();
          const qi = qx + qy * w;
          if (visited[qi]) continue;
          visited[qi] = 1;
          if (bin[qi] === 1) {
            count++; sumX += qx; sumY += qy;
            if (qx < minX) minX = qx; if (qy < minY) minY = qy;
            if (qx > maxX) maxX = qx; if (qy > maxY) maxY = qy;
            if (qx > 0)     stack.push([qx - 1, qy]);
            if (qx < w - 1) stack.push([qx + 1, qy]);
            if (qy > 0)     stack.push([qx, qy - 1]);
            if (qy < h - 1) stack.push([qx, qy + 1]);
          }
        }
        if (count > 0) {
          blobs.push({ minX, minY, maxX, maxY, cx: sumX / count, cy: sumY / count, area: count });
        }
      }
    }
  }
  return blobs;
}

/************ Scanlines ************/
function makeScanlines() {
  scanG.clear();
  scanG.noStroke();
  const lineH = 2, gap = 4;
  scanG.fill(0, SCAN_ALPHA);
  for (let y = 0; y < scanG.height; y += (lineH + gap)) {
    scanG.rect(0, y, scanG.width, lineH);
  }
}

/************ Resize ************/
function windowResized() {
  const display = computeDisplaySize();
  resizeCanvas(display.w, display.h);

  trail = createGraphics(width, height); trail.pixelDensity(1); trail.clear();
  noiseG = createGraphics(width, height); noiseG.pixelDensity(1); noiseG.clear();
  scanG  = createGraphics(width, height); scanG.pixelDensity(1); makeScanlines();
}
