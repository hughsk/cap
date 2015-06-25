precision mediump float;

uniform sampler2D data;
uniform sampler2D back;
uniform sampler2D wave;
uniform float distortion;
uniform float time;
varying vec2 uv;

#pragma glslify: analyse = require('gl-audio-analyser')

void main() {
  vec2 vuv = uv;

  vuv.x += distortion * analyse(wave, abs(vuv.y * 2.0 - 1.0)) * 0.01;

  vec4 inp = texture2D(data, fract(vuv));
  vec3 bgc = texture2D(back, vec2(0, 1) - fract(vuv * 5. + time * 0.01) * vec2(-1, 1)).rgb;

  gl_FragColor = vec4(mix(bgc, inp.rgb, inp.a), 1);
}
