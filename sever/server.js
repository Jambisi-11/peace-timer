// server.js (Node 16+)
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
const UPLOAD_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR)

// disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-')
    cb(null, name)
  },
})

const upload = multer({ storage })

app.use('/uploads', express.static(UPLOAD_DIR))

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  // return relative path so frontend can do: http://localhost:4000/uploads/xxx
  res.json({ filename: `uploads/${req.file.filename}` })
})

app.listen(4000, () =>
  console.log('Upload server running on http://localhost:4000')
)
