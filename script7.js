// Đây là script7 nó tạo ra grain overlay lên các trang




(() => {
  // ====== Tweakable ======
  const TILE_SIZE = 100;      
  const FLICKER_EVERY = 3;    // đổi tile mỗi N frame (0=không đổi)
  const TARGET_FPS = 30;      // giới hạn FPS để nhẹ
  const OPACITY = 10;       // độ đậm overlay (cũng có trong CSS)

  // chuyển động
  const SPEED_PX_PER_S = 18;  // tốc độ trượt hạt (px/giây)
  const WANDER = 0.6;         // 0..1: mức “đổi hướng” ngẫu nhiên mỗi frame
  const ROTATE_DEG = 0.0;     // xoay nhẹ pattern (0 = không xoay)

  // ====== Canvas overlay ======
  const cvs = document.createElement('canvas');
  cvs.id = 'grainOverlay';
  cvs.style.opacity = OPACITY;
  document.body.appendChild(cvs);
  const ctx = cvs.getContext('2d');

  // Tile noise (offscreen)
  const tile = document.createElement('canvas');
  tile.width = TILE_SIZE;
  tile.height = TILE_SIZE;
  const tctx = tile.getContext('2d');

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cvs.width  = Math.round(innerWidth * dpr);
    cvs.height = Math.round(innerHeight * dpr);
    cvs.style.width = innerWidth + 'px';
    cvs.style.height = innerHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset; ta sẽ set sau
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  function regenTile() {
    const img = tctx.createImageData(TILE_SIZE, TILE_SIZE);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const g = (Math.random() * 255) | 0;
      data[i] = data[i + 1] = data[i + 2] = g;
      data[i + 3] = 28; // alpha mỗi hạt
    }
    tctx.putImageData(img, 0, 0);
  }
  regenTile();

  let pattern = ctx.createPattern(tile, 'repeat');
  let lastTs = 0, frame = 0;

  // trạng thái chuyển động
  let offX = 0, offY = 0;   // offset (px)
  let vx = SPEED_PX_PER_S, vy = 0; // vector ban đầu (px/s)
  const rot = ROTATE_DEG * Math.PI / 180; // rad

  function updateVelocity() {
    // wander = đổi hướng nhẹ nhàng
    const ang = Math.atan2(vy, vx);
    const newAng = ang + (Math.random() - 0.5) * 0.2 * WANDER; // +- ~0.1 rad
    const spd = SPEED_PX_PER_S * (0.85 + 0.3 * Math.random() * WANDER);
    vx = Math.cos(newAng) * spd;
    vy = Math.sin(newAng) * spd;
  }

  function draw(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.06); // giây
    if (ts - lastTs < 1000 / TARGET_FPS) { requestAnimationFrame(draw); return; }
    lastTs = ts;

    // đổi tile theo nhịp để “flicker”
    if (FLICKER_EVERY && (frame++ % FLICKER_EVERY === 0)) {
      regenTile();
      pattern = ctx.createPattern(tile, 'repeat');
    }

    // cập nhật chuyển động
    if (WANDER > 0) updateVelocity();
    offX += vx * dt;
    offY += vy * dt;

    // vẽ
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.save();
    // áp transform: xoay nhẹ + dịch offset để pattern trượt
    // setTransform(a, b, c, d, e, f): ma trận 2x3
    // ta dùng translate trước rồi rotate
    ctx.translate(offX % TILE_SIZE, offY % TILE_SIZE);
    if (rot) ctx.rotate(rot);

    ctx.fillStyle = pattern;
    // phủ vượt khung để không lộ đường ghép khi offset âm/dương
    const W = cvs.width + TILE_SIZE * 2;
    const H = cvs.height + TILE_SIZE * 2;
    ctx.fillRect(-TILE_SIZE, -TILE_SIZE, W, H);

    ctx.restore();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // API mini
  window.GrainOverlay = {
    enable()  { cvs.style.display = ''; },
    disable() { cvs.style.display = 'none'; },
    setOpacity(o = 0.12) { cvs.style.opacity = o; },
    setSpeed(pxPerSec = 18) { vx = (vx ? vx/Math.hypot(vx,vy) : 1) * pxPerSec; vy = (vy ? vy/Math.hypot(vx,vy) : 0) * pxPerSec; },
  };
})();
