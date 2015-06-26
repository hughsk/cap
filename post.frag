precision mediump float;

uniform sampler2D data;
uniform sampler2D back;
uniform sampler2D wave;
uniform sampler2D lut;
uniform float useLUT;
uniform float distortion;
uniform float brightness;
uniform float time;
varying vec2 uv;

#pragma glslify: analyse = require('gl-audio-analyser')

vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size) {
  float sliceSize = 1.0 / size;                         // space of 1 slice
  float slicePixelSize = sliceSize / size;              // space of 1 pixel
  float sliceInnerSize = slicePixelSize * (size - 1.0); // space of size pixels
  float zSlice0 = min(floor(texCoord.z * size), size - 1.0);
  float zSlice1 = min(zSlice0 + 1.0, size - 1.0);
  float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
  float s0 = xOffset + (zSlice0 * sliceSize);
  float s1 = xOffset + (zSlice1 * sliceSize);
  vec4 slice0Color = texture2D(tex, vec2(s0, texCoord.y));
  vec4 slice1Color = texture2D(tex, vec2(s1, texCoord.y));
  float zOffset = mod(texCoord.z * size, 1.0);
  return mix(slice0Color, slice1Color, zOffset);
}

void main() {
  vec2 vuv = uv;

  vuv.x += distortion * analyse(wave, abs(vuv.y * 2.0 - 1.0)) * 0.01;

  vec4 inp = texture2D(data, fract(vuv));
  vec3 bgc = texture2D(back, vec2(0, 1) - fract(vuv * 5. + time * 0.01) * vec2(-1, 1)).rgb;

  vec3 inMap  = clamp(brightness + mix(bgc, inp.rgb, inp.a), vec3(0), vec3(1));
  vec3 outMap = sampleAs3DTexture(lut, inMap, 32.0).rgb;

  outMap.g = 1.0 - outMap.g;

  gl_FragColor = vec4(mix(inMap, outMap, useLUT), 1);
}
