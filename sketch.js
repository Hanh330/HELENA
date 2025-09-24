
//INDEX 2 ĐỂ TẠO CÁI ASCII ĐỂ USER GẶP HELENA



var txt = "▗!▘@ ▜#▟$▙% ▄^▀&▀*▞W▞ A▚ 1 ▝ T▗1▘N▜ G▟T▙@▄L▀K▐T▌0▞H▚3▝R";
var font = "IBM Plex Mono Medium"; 
let g; 
let cam;
const THRESH = 100; 
const TS = 10;
let base = floor(min(windowWidth, windowHeight) * 0.4);   
let gw = floor(base * 1.6);   
let gh = base;   

  

textFont("IBM Plex Mono Medium");

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(15);

 
  let base = floor(min(windowWidth, windowHeight) * 0.4);

 
  let gw = floor(base * 1.6); 
  let gh = base;               

  g = createGraphics(gw, gh);
  g.pixelDensity(5); 
  g.textFont("IBM Plex Mono Medium");

  cam = createCapture(VIDEO, function() {});
  cam.size(g.width, g.height);
  cam.hide();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);

  let base = floor(min(windowWidth, windowHeight) * 0.4);
  let gw = floor(base * 1.6);
  let gh = base;

  g = createGraphics(gw, gh);
  g.pixelDensity(5);
  g.textFont(font);

  if (cam) {
    cam.size(g.width, g.height);
  }
}


function draw() {
  for (let i = 0; i < 7; i++) {
    var last = txt[txt.length - 1];
    txt = last + txt;
    txt = txt.substr(0, txt.length - 1);
  }

 
  g.background(0);
  let ts = TS;              
  g.textSize(ts);
  g.textAlign(LEFT, TOP);
  g.fill(61, 231, 52);      

  let cw = max(1, g.textWidth('M') * 0.85);
  let ch = max(1, g.textAscent() * 1.02 + g.textDescent() * 0.25);

  let cols = floor(g.width / cw);
  let rows = floor(g.height / ch);

  let camReady = cam && cam.width > 0 && cam.height > 0;
  if (camReady) cam.loadPixels();

  let idx = frameCount % txt.length; 
  for (let r = 0; r < rows; r++){
    for (let c = 0; c < cols; c++){
      let chChar = txt.charAt(idx % txt.length);
      if (camReady) {
        let px = floor((c + 0.5) * cam.width / cols);
        let py = floor((r + 0.5) * cam.height / rows);
        px = constrain(px, 0, cam.width - 1);
        py = constrain(py, 0, cam.height - 1);

        let i = (py * cam.width + px) * 4;
        let rr = cam.pixels[i];
        let gg = cam.pixels[i+1];
        let bb = cam.pixels[i+2];
        let bright = 0.299*rr + 0.587*gg + 0.114*bb; 
        if (bright < THRESH) {
          g.text(chChar, c * cw, r * ch);
        } else {
        }
      } else {
        g.text(chChar, c * cw, r * ch);
      }

      idx++;
    }
  }
  let gx = (width - g.width) / 2;
  let gy = (height - g.height) / 2;

  noStroke();
  fill(0);
  rect(gx - 10, gy - 10, g.width + 20, g.height + 20, 12);
  image(g, gx, gy);

  fill(86, 190, 25);
  textAlign(CENTER);
  textSize(15);
}



