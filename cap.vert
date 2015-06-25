precision mediump float;

uniform sampler2D wave;
attribute vec3 position;
attribute vec3 normal;
varying vec3 vnormal;
varying vec3 vpos;
uniform mat4 proj;
uniform mat4 view;

#pragma glslify: analyse = require('gl-audio-analyser')

void main() {
  vnormal = normal;
  vpos = position;

  float off = analyse(wave, fract(length(vpos * 0.03125)));
  vpos += vnormal * off * 0.5;

  gl_Position = proj * view * vec4(position + off * vnormal * 0.5, 1);
}
