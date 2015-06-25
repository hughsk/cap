const canvas    = document.body.appendChild(document.createElement('canvas'))
const gl        = require('gl-context')(canvas, render)
const Analyser  = require('gl-audio-analyser')
const badge     = require('soundcloud-badge')
const camera    = require('lookat-camera')()
const triangle  = require('a-big-triangle')
const Texture   = require('gl-texture2d')
const Geom      = require('gl-geometry')
const model     = require('./cap.json')
const eye       = require('eye-vector')
const icosphere = require('icosphere')
const Shader    = require('gl-shader')
const mat4      = require('gl-mat4')
const glslify   = require('glslify')
const normals   = require('normals')
const FBO       = require('gl-fbo')

const sphere = scale(icosphere(3))

sphere.normals = normals.vertexNormals(sphere.cells, sphere.positions)
model.normals  = normals.vertexNormals(model.cells, model.positions)

var texture1
var texture2

const fbo  = FBO(gl, [2, 2])
const img1 = new Image
const img2 = new Image
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

var movieSel = 1
var movieTex = Texture(gl, [2, 2])
var movies   = [
  'GIF1.webm',
  'GIF2.webm',
  'GIF3.webm',
  'GIF4.webm',
  'GIF5.webm',
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

var bel = badge({
  client_id: 'ded451c6d8f9ff1c62f72523f49dab68',
  song: 'https://soundcloud.com/djcasket/back-to-the-future-theme-song-casket-remix',
  dark: false
}, function(err, src, json) {
  if (err) throw err

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
})


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

canvas.style.cursor = 'pointer'
canvas.addEventListener('click', function() {
  movieSel = (movieSel + 1) % movies.length
}, false)

function render () {
  if (!texture1) return
  if (!texture2) return
  if (!analyser) return

  const width  = gl.drawingBufferWidth
  const height = gl.drawingBufferHeight

  fbo.bind()
  fbo.shape = [width, height]

  gl.viewport(0, 0, width, height)
  gl.clearColor(1, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  mat4.perspective(proj, Math.PI / 4, width / height, 0.1, 1000)
  camera.position = [80, 200, 80]
  camera.target = [0, 40, 0]
  camera.view(view)
  eye(view, eyev)

  var tidx = analyser.bindWaveform(3)

  start += Math.pow(analyser.frequencies()[25], 3) * 0.0001

  if (movieSel === 5) {
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
  post.uniforms.data = fbo.color[0].bind(0)
  post.uniforms.back = movieTex.bind(1)
  post.uniforms.wave = tidx
  post.uniforms.time = (Date.now() - start) / 1000
  post.uniforms.distortion = movieSel === 5 ? 1 : 0
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
