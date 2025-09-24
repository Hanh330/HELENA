

// ĐÂY LÀ INDEX 4 


let headModel;
let faceSh;

// ---------- DIGITAL RAIN ----------
let gRain;
let rainCols = [];
const RAIN = {
  fontSize: 16,
   speed: 420,       
  length: 18,       
  thickness: 1.6,

  speedMax: 5,
  density: 2.8,
  headColor: [255, 255, 255, 255],
  bodyColor: [255, 255, 255, 170],
  charset: "人間のように息をしている人間のように息をしている人間のように息をしている人間のように息をしている"
}; // nôm na là im breathing like a human being vì cái shape đó add vertex shader, kiểu méo tạo cảm giác đang thở
function randChar() {
  const s = RAIN.charset;
  return s.charAt(Math.floor(Math.random() * s.length));
}
function initRain() {
  gRain = createGraphics(width, height);
  gRain.pixelDensity(5);
  gRain.textFont('IBM Plex Mono, monospace');
  gRain.textSize(RAIN.fontSize);
  gRain.textAlign(LEFT, TOP);
  gRain.clear();

  const cols = Math.ceil(width / RAIN.fontSize);
  rainCols = new Array(cols).fill().map((_, i) => ({
    x: i * RAIN.fontSize,
    y: Math.floor(random(-20, height / 2)),
    speed: random(RAIN.speedMin, RAIN.speedMax)
  }));
}
function drawRain() {
  gRain.clear();
  for (let c of rainCols) {
    if (random() > RAIN.density) {
      c.y += c.speed;
      if (c.y > height + 10 * RAIN.fontSize) {
        c.y = random(-200, 0);
        c.speed = random(RAIN.speedMin, RAIN.speedMax);
      }
      continue;
    }
    gRain.fill(...RAIN.headColor);
    gRain.text(randChar(), c.x, c.y);

    gRain.fill(...RAIN.bodyColor);
    const trailLen = 8;
    for (let k = 1; k < trailLen; k++) {
      gRain.text(randChar(), c.x, c.y - k * RAIN.fontSize);
    }

    c.y += c.speed;
    if (c.y > height + trailLen * RAIN.fontSize) {
      c.y = random(-200, 0);
      c.speed = random(RAIN.speedMin, RAIN.speedMax);
    }
  }
}
// ---------- END RAIN ----------


// ---------- POINT-CLOUD EXPLOSION ----------
let explode = false;
let particles = [];
let explosionStart = 0;

const EXPLODE_TIME = 2000; 
const POINT_STEP    = 2;  
const POINT_SIZE    = 10;   

function prepareParticles() {
  particles = [];
  if (!headModel || !headModel.vertices) return;

  const vs = headModel.vertices;
  const ns = headModel.normals || [];
  for (let i = 0; i < vs.length; i += POINT_STEP) {
    const v = vs[i];
    const n = ns[i] || createVector(0, 0, 1);

    const pos = createVector(v.x, v.y, v.z);
    const spd = random(2.0, 6.0);
    const jitter = p5.Vector.random3D().mult(0.6);
    const vel = p5.Vector.add(n.copy().mult(spd), jitter);

    particles.push({ p: pos, v: vel });
  }
}
function updateParticles(dt) {
  for (const it of particles) {
    const t = (millis() - explosionStart) / 1000;
    const boost = t < 0.2 ? map(t, 0, 0.2, 0.2, 1) : 1; 
    it.v.mult(0.985);
    it.p.add(p5.Vector.mult(it.v, dt * 60 * boost));
  }
}
function drawParticlesWithSameTransform() {
  const BIG = 0.007;
  scale(Math.min(width, height) * BIG);
  rotateX(4);
  rotateY(3);
  rotateZ(-6.6);
  stroke(234, 255, 231, 230);
  strokeWeight(POINT_SIZE);
  noFill();
  beginShape(POINTS);
  for (const it of particles) vertex(it.p.x, it.p.y, it.p.z);
  endShape();
}

// cho script4 gọi
window.triggerHeadExplosion = function () {
  if (explode) return;
  prepareParticles();
  explode = true;
  explosionStart = millis();
};
// ---------- END EXPLOSION ----------


function preload() {
  headModel = loadModel('female_head.obj', true);
  faceSh = loadShader('face.vert', 'face.frag'); 
}

function setup() {
  const c = createCanvas(windowWidth, windowHeight, WEBGL);
  c.parent('webgl');
  pixelDensity(Math.min(1.5, window.devicePixelRatio || 1));
  noStroke();
  perspective(PI/4, width/height, 0.01, 10000);
  initRain();
}

function draw() {
  background(191, 36, 10);


  drawRain();
  push();
  resetMatrix();
  translate(-width/2, -height/2);
  drawingContext.depthMask(false);
  image(gRain, 0, 0, width, height);
  drawingContext.depthMask(true);
  pop();
  // ------------------------

  if (!explode) {

    shader(faceSh);
    faceSh.setUniform('uTime', millis()/1000.0);
    faceSh.setUniform('uAmp',    map(mouseY, 0, height, 0.5, 4.0));
    faceSh.setUniform('uScroll', map(mouseY, 0, height, 0.2, 1.5));
    faceSh.setUniform('uFreq',   map(mouseX, 0, width, 0.02, 0.2));
    faceSh.setUniform('uWarp',   map(mouseX, 0, width, 0.5, 3.0));
    faceSh.setUniform('colorCenter',     [0.600, 0.706, 0.537]);
    faceSh.setUniform('colorBackground', [0.800, 0.902, 0.741]);
    faceSh.setUniform('offset', [
      0.25 * sin(frameCount * 0.01),
      0.15 * cos(frameCount * 0.008)
    ]);
    faceSh.setUniform('uAmbient',      0.60);
    faceSh.setUniform('uSpecStrength', 0.10);
    faceSh.setUniform('uSpecPower',    20.0);
    faceSh.setUniform('uRim',          0.90);
    faceSh.setUniform('uRimPower',     0.99);
    faceSh.setUniform('uGamma',        0.2);

    const BIG = 0.007;
    scale(Math.min(width, height) * BIG);
    rotateX(4);
    rotateY(3);
    rotateZ(-6.6);
    model(headModel);
    resetShader();
  } else {
  
    const dt = deltaTime / 1000.0;
    updateParticles(dt);
    push();
    drawParticlesWithSameTransform();
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(PI/4, width/height, 0.01, 10000);
  initRain();
}
