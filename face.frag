// face.frag — circular gradient + rim/spec + gamma (KHỚP vPosModel/vPosView/vNormalView)

#ifdef GL_ES
precision mediump float;
#endif

// palette & offset
uniform vec3  colorCenter;      // màu ở tâm
uniform vec3  colorBackground;  // màu ở rìa
uniform vec2  offset;           //tâm 

// lighting knobs
uniform float uAmbient;
uniform float uSpecStrength;
uniform float uSpecPower;
uniform float uRim;
uniform float uRimPower;
uniform float uGamma;

// varyings từ face.vert MỚI
varying vec3 vPosModel;
varying vec3 vPosView;
varying vec3 vNormalView;

void main() {
  // ---- GRADIENT
  vec3 p  = normalize(vPosModel / max(1e-6, length(vPosModel)));
  vec2 uv = p.xy + offset;
  float d = clamp(length(uv), 0.0, 1.5);
  float g = smoothstep(1.0, 0.0, d);            // gần tâm = 1
  vec3 base = mix(colorBackground, colorCenter, g);

  // ---- LIGHTING (view space) ----
  vec3 N = normalize(vNormalView);
  vec3 V = normalize(-vPosView);
  vec3 L = normalize(vec3(0.4, 0.6, 0.2));

  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, normalize(L+V)), 0.0), uSpecPower) * uSpecStrength;
  float rim  = pow(1.0 - max(dot(N, V), 0.0), uRimPower) * uRim;

  float lit = uAmbient + diff + spec + rim;
  lit = max(lit, 0.25);              // sàn sáng để khỏi tối sịt
  lit = pow(lit, uGamma);

  gl_FragColor = vec4(base * lit, 1.0);
}
