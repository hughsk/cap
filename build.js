const obj = require('parse-obj')
const fs  = require('fs')

obj(fs.createReadStream('cap.obj'), function(err, data) {
  if (err) throw err
  fs.writeFileSync('cap.json', JSON.stringify({
    positions: data.vertexPositions,
    cells: data.facePositions
  }))
})
