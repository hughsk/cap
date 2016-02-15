precision mediump float;

attribute vec2 position;
varying vec2 uv;

void main() {
  gl_Position = vec4(position, 1, 1);
  uv = position * 0.5 + 0.5;
}
