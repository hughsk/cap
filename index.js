(function() {

const canvas    = document.body.appendChild(document.createElement('canvas'))
const gl        = require('gl-context')(canvas, render)
const cursor    = require('touch-position')(window)
const Analyser  = require('gl-audio-analyser')
const badge     = require('soundcloud-badge')
const camera    = require('lookat-camera')()
const findup    = require('findup-element')
const Touch     = require('touch-position')
const triangle  = require('a-big-triangle')
const Texture   = require('gl-texture2d')
const Geom      = require('gl-geometry')
const model     = require('./cap.json')
const cl        = require('class-list')
const eye       = require('eye-vector')
const icosphere = require('icosphere')
const Shader    = require('gl-shader')
const mat4      = require('gl-mat4')
const glslify   = require('glslify')
const normals   = require('normals')
const FBO       = require('gl-fbo')

if (!gl) {
  return cl(document.body).add('nowebgl')
}

const touch = Touch()
const sphere = scale(icosphere(3))

sphere.normals = normals.vertexNormals(sphere.cells, sphere.positions)
model.normals  = normals.vertexNormals(model.cells, model.positions)

var texture1
var texture2
var textureLut

const fbo  = FBO(gl, [2, 2])
const img1 = new Image
const img2 = new Image
const lut  = new Image
const proj = new Float32Array(16)
const view = new Float32Array(16)
const eyev = new Float32Array(3)
const geom = Geom(gl)
  .attr('position', model)
  .attr('normal', model.normals)

const bg = Geom(gl)
  .attr('position', sphere)
  .attr('normal', sphere.normals)

var start = Date.now()

const shader = Shader(gl
  , glslify('./cap.vert')
  , glslify('./cap.frag')
)

const post = Shader(gl
  , glslify('./post.vert')
  , glslify('./post.frag')
)

var analyser
var audio

var brightness = 1
var camSpd = 0
var camSet = 0
var camPos = [ [0, 0, 0], [80, 200, 80], [0, 50, 0] ]
var camTar = [ [0, 0, 0], [0, 40, 0], [0, -300, 0] ]
var ttfp   = document.querySelector('.ttfp')

var movieSel = 6
var movieTex = Texture(gl, [2, 2])
var movies   = [
  'GIF1.webm',
  'GIF2.webm',
  'GIF3.webm',
  'GIF4.webm',
  'GIF5.webm',
  'cap.webm',
  'cap.webm'
].map(function(src) {
  var video  = document.createElement('video')
  video.src  = src
  video.loop = true
  video.addEventListener('canplay', function() {
    video.play()
  }, false)

  return video
})

// var bel = badge({
//   client_id: 'ded451c6d8f9ff1c62f72523f49dab68',
//   song: 'https://soundcloud.com/djcasket/back-to-the-future-theme-song-casket-remix',
//   dark: false
// }, function(err, src, json) {
//   if (err) throw err

  audio = new Audio
  audio.crossOrigin = 'Anonymous'
  audio.src = 'song.mp3'

  audio.loop = true
  audio.addEventListener('canplay', function() {
    audio.play()
    analyser = Analyser(gl, audio)
  })

  // var np = bel
  //   .querySelectorAll('.npm-scb-now-playing, .npm-scb-now-playing a')
  //
  // for (var i = 0; i < np.length; i++) {
  //   np[i].style.color = '#eb3c76'
  // }
// })

lut.onload = function() {
  textureLut = Texture(gl, lut)
  textureLut.minFilter = gl.LINEAR
  textureLut.magFilter = gl.LINEAR
}
img1.onload = function() {
  texture1 = Texture(gl, img1)
  texture1.wrap = [gl.REPEAT, gl.REPEAT]
}
img2.onload = function() {
  texture2 = Texture(gl, img2)
  texture2.wrap = [gl.REPEAT, gl.REPEAT]
}

img1.src = 'cap.jpg'
img2.src = 'grime.jpg'
lut.src = 'lut.png'

canvas.style.cursor = 'pointer'
window.addEventListener('click', function(e) {
  const mute = findup(e.target, function(el) {
    return el.classList && el.classList.contains('mute')
  })

  if (mute) return toggleMute()

  const back = findup(e.target, function(el) {
    return el.classList && el.classList.contains('back')
  })

  if (movieSel === 5 && !back) return

  movieSel = (movieSel + 1) % movies.length

  if (movieSel === 5) {
    document.body.classList.add('has-cap')
  } else {
    document.body.classList.remove('has-cap')
  }
}, false)

function toggleMute() {
  audio.volume = audio.volume ? 0 : 1
  document.querySelector('.mute')
    .classList.toggle('enabled')
}

function render () {
  if (!textureLut) return
  if (!texture1) return
  if (!texture2) return
  if (!analyser) return

  const width  = gl.drawingBufferWidth
  const height = gl.drawingBufferHeight
  const tx = (touch[0] / width) * 2 - 1
  const ty = (touch[1] / height) * 2 - 1

  fbo.bind()
  fbo.shape = [width, height]

  gl.viewport(0, 0, width, height)
  gl.clearColor(1, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  mat4.perspective(proj, Math.PI / 4, width / height, 0.1, 1000)

  brightness += ((movieSel === 6 ? 1 : 0) - brightness) * 0.065
  camSpd = movieSel === 6 ? 0.035 : 0.015
  camSet = movieSel === 5 ? 1 : movieSel === 6 ? 2 : 0
  camera.position[0] += ((camPos[camSet][0] + tx * 250) - camera.position[0]) * camSpd
  camera.position[1] += ((camPos[camSet][1] + ty * 250) - camera.position[1]) * camSpd
  camera.position[2] += (camPos[camSet][2] - camera.position[2]) * camSpd

  camera.target[0] += (camTar[camSet][0] - camera.target[0]) * camSpd
  camera.target[1] += (camTar[camSet][1] - camera.target[1]) * camSpd
  camera.target[2] += (camTar[camSet][2] - camera.target[2]) * camSpd

  camera.view(view)
  eye(view, eyev)

  var tidx = analyser.bindWaveform(3)

  start += Math.pow(analyser.frequencies()[25], 3) * 0.0001

  if (movieSel >= 5) {
    geom.bind(shader)
    shader.uniforms.proj  = proj
    shader.uniforms.view  = view
    shader.uniforms.eye   = eyev
    shader.uniforms.grad  = texture1.bind(0)
    shader.uniforms.grime = texture2.bind(1)
    shader.uniforms.time  = (Date.now() - start) / 1000
    shader.uniforms.wave  = tidx
    geom.draw()
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, width, height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  movieTex.shape = [movies[movieSel].videoWidth, movies[movieSel].videoHeight]
  movieTex.setPixels(movies[movieSel])

  post.bind()
  post.uniforms.mouse      = [cursor[0], cursor[1]]
  post.uniforms.data       = fbo.color[0].bind(0)
  post.uniforms.back       = movieTex.bind(1)
  post.uniforms.wave       = tidx
  post.uniforms.time       = (Date.now() - start) / 1000
  post.uniforms.lut        = textureLut.bind(2)
  post.uniforms.useLUT     = movieSel >= 5 ? 0.5 : 0
  post.uniforms.distortion = movieSel === 5 ? 1 : 0
  post.uniforms.brightness = brightness
  triangle(gl)
}

window.addEventListener('resize'
  , require('canvas-fit')(canvas)
  , false
)

function scale(mesh) {
  var pos = mesh.positions
  var cel = mesh.cells

  for (var i = 0; i < pos.length; i++) {
    pos[i][0] *= 250
    pos[i][1] *= 250
    pos[i][2] *= 250
  }

  for (var i = 0; i < cel.length; i++) {
    cel[i] = [cel[i][1], cel[i][0], cel[i][2]]
  }

  return mesh
}

})()
