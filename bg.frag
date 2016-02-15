precision mediump float;

varying vec2 uv;
uniform float time;
uniform sampler2D grad;

#define ptpi 1385.4557313670110891409199368797 //powten(pi)
#define pipi  36.462159607207911770990826022692 //pi pied, pi^pi
#define picu  31.006276680299820175476315067101 //pi cubed, pi^3
#define pepi  23.140692632779269005729086367949 //powe(pi);
#define chpi  11.59195327552152062775175205256  //cosh(pi)
#define shpi  11.548739357257748377977334315388 //sinh(pi)
#define pisq  9.8696044010893586188344909998762 //pi squared, pi^2
#define twpi  6.283185307179586476925286766559  //two pi, 2*pi
#define pi    3.1415926535897932384626433832795 //pi
#define e     2.7182818284590452353602874713526 //eulers number
#define sqpi  1.7724538509055160272981674833411 //square root of pi
#define phi   1.6180339887498948482045868343656 //golden ratio
#define hfpi  1.5707963267948966192313216916398 //half pi, 1/pi
#define cupi  1.4645918875615232630201425272638 //cube root of pi
#define prpi  1.4396194958475906883364908049738 //pi root of pi
#define lnpi  1.1447298858494001741434273513531 //logn(pi);
#define trpi  1.0471975511965977461542144610932 //one third of pi, pi/3
#define thpi  0.99627207622074994426469058001254//tanh(pi)
#define lgpi  0.4971498726941338543512682882909 //log(pi)
#define rcpi  0.31830988618379067153776752674503// reciprocal of pi  , 1/pi
#define rcpipi  0.0274256931232981061195562708591 // reciprocal of pipi  , 1/pipi

#pragma glslify: noise = require('glsl-noise/simplex/4d')
#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: cookt = require('glsl-specular-cook-torrance')
#pragma glslify: analyse = require('gl-audio-analyser')
#pragma glslify: hsv = require('glsl-hsv2rgb')
#pragma glslify: hsl = require('glsl-hsl2rgb')
#pragma glslify: fog = require('glsl-fog')
#pragma glslify: square = require('glsl-square-frame')

vec3 rotate(vec3 vec, vec3 axis, float ang)
{
    return vec * cos(ang) + cross(axis, vec) * sin(ang) + axis * dot(axis, vec) * (1.0 - cos(ang));
}

vec3 pin(vec3 v)
{
    vec3 q = vec3(0.0);

    q.x += sin(v.x)*0.5+0.5;
    q.y += sin(v.y+0.66666667*pi)*0.5+0.5;
    q.z += sin(v.z+1.33333333*pi)*0.5+0.5;

    return (q);
}

vec3 spin(vec3 v)
{
    for(int i = 1; i <3; i++)
    {
        v=pin(rotate((v),pin(v),float(i*i)))*e;
    }
    return (v.xyz);
}

vec3 fin(vec3 v){

	vec4 vt = vec4(v,(v.x+v.y+v.z)/pi);
	vec4 vs = vt;
	vt.xyz  += pin(vs.xyz);
	vt.xyz  += pin(vs.yzw);
	vt.xyz  += pin(vs.zwx);
	vt.xyz  += pin(vs.wxy);
	return spin(vt.xyz/pisq);
}


vec3 sfin(vec3 v)
{
    for(int i = 1; i < 5; i++)
    {
        v =(v+fin(v*float(i)));
    }
    return (normalize((pin(v.zxy)))+(spin(v.zxy*rcpi)));
}

void main() {
  vec3 vpos = vec3(uv.xy * 80., 0.5);

  float r = noise(vec4(vpos * 0.05 * vec3(1, 1, 0.25) + 2023.0, time)) * 1.0
          + noise(vec4(vpos * 0.08 + 1023.0, time)) * 0.5;

  float t = time * 0.05;

  r /= 1.5;
  // float g = noise(vec4(vpos * 0.01 + 5023.0, time)) + noise(vec4(vpos * 0.02 + 3023.0, time));
  // float b = noise(vec4(vpos * 0.01 + 3023.0, time)) + noise(vec4(vpos * 0.02 + 4023.0, time));

  vec3 ridges = vec3(0);//sin(vpos * 30.0); // sin(vpos * 30.0);
  // vec3 normal = normalize(vnormal + ridges * 0.03);
  // vec3 vdir = normalize(eye - vpos);
  // vec3 ldir = normalize(vec3(0, 1, 0));
  // vec3 grimeCol1 = texture2D(grime, vpos.xz * 2.5 + vec2(5.1)).rgb;
  // vec3 grimeCol2 = texture2D(grime, vpos.xz * 0.005 + vec2(5.1)).rgb;

  vec3 mat = hsl(r * 0.5 + 0.5, 0.1, 0.25);
  // * pow(1.0 - grimeCol1, vec3(2.0));

  // float dif  = max(0.0, dot(ldir, normal)) * 0.5 + 0.1;
  // float spec = cookt(ldir, vdir, normal, 1.9, 0.0);
  vec3 color = mat * mix(0.7, 1.0, length(ridges * 0.5 + 0.5));
  // * dif * mat + spec * 2.0;

  vec3 spos = vpos + vec3(0, 1, 0) * noise2(vec2(vpos.x, 0.5)) * 0.25;
  float lut = (sfin((spos * 0.03+sin(t/pi)*twpi)*pi)).r;

  color = mix(color, texture2D(grad, vec2(lut)).rgb, 0.8);
  // color *= mix(vec3(0.8), vec3(1.1), grimeCol2);
  // color = mix(color, vec3(1.0), fog(length(eye - vpos), 0.0015));

  // float amp = analyse(wave, fract(length(vpos)));

  gl_FragColor = vec4(color, 1);
}
