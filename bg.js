const canvas = document.body.appendChild(document.createElement('canvas'))
const gl = require('gl-context')(canvas, render)
const triangle = require('a-big-triangle')
const loadImages = require('async-image-loader')
const Texture2D = require('gl-texture2d')
const Shader = require('gl-shader')
const glslify = require('glslify')
const Fit = require('canvas-fit')

window.addEventListener('resize', Fit(canvas), false)

const start = Date.now()
const shader = Shader(gl
  , glslify('./bg.vert')
  , glslify('./bg.frag')
)

var lut

loadImages([
  'cap.jpg'
], function (images) {
  lut = Texture2D(gl, images[0])
})

function render () {
  if (!lut) return

  const width = canvas.width
  const height = canvas.height

  gl.viewport(0, 0, width, height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  shader.bind()
  shader.uniforms.time = (Date.now() - start) / 1000
  shader.uniforms.grad = lut.bind(0)
  triangle(gl)
}
