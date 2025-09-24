// face.vert — ripple theo normal + xuất data cho frag (p5.js / WebGL1)

#ifdef GL_ES
precision mediump float;
#endif

// ----- attributes (từ p5) -----
attribute vec3 aPosition;
attribute vec3 aNormal;

// ----- uniforms (từ p5 + của mình) -----
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uWarp;
uniform float uScroll;

// ----- varyings (phải trùng tên với frag) -----
varying vec3 vPosModel;   // vị trí sau khi đẩy (model space approx)
varying vec3 vPosView;    // vị trí trong view space
varying vec3 vNormalView; // normal trong view space

void main() {
  vec3 pos = aPosition;
  vec3 nrm = normalize(aNormal);

  // --- 3 lớp sóng để nhìn organic ---
  float y = pos.y;
  float b1 = sin(y*uFreq + uTime*uScroll);
  float b2 = sin((y*0.53 + pos.x*uWarp)*(uFreq*1.8) - uTime*(uScroll*1.3));
  float b3 = sin((y*1.7  + pos.z*0.25)*(uFreq*0.6) + uTime*(uScroll*0.6));
  float bands = b1*0.55 + b2*0.30 + b3*0.15;
  bands = clamp(bands, -1.0, 1.0);

  // đẩy theo normal
  pos += nrm * (uAmp * bands);

  // ---- pass sang frag ----
  vPosModel = pos;

  vec4 pv = uModelViewMatrix * vec4(pos, 1.0);
  vPosView = pv.xyz;

  // normal sang view space (ok vì scale đồng nhất)
  vNormalView = normalize(mat3(uModelViewMatrix) * nrm);

  gl_Position = uProjectionMatrix * pv;
}
