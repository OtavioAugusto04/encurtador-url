import express from 'express'
import cors from 'cors'
import { nanoid } from 'nanoid'
import 'dotenv/config'
import { pool } from './db.js'

const app = express()
const PORT = process.env.PORT || 3001
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`

app.use(cors())
app.use(express.json())

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

app.post('/api/shorten', async (req, res) => {
  const { url } = req.body

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'URL inválida' })
  }

  const [existing] = await pool.query(
    'SELECT short_code FROM urls WHERE original_url = ? LIMIT 1',
    [url],
  )

  if (existing.length > 0) {
    return res.json({ shortUrl: `${APP_BASE_URL}/${existing[0].short_code}` })
  }

  let shortCode
  let inserted = false

  while (!inserted) {
    shortCode = nanoid(7)
    try {
      await pool.query(
        'INSERT INTO urls (short_code, original_url) VALUES (?, ?)',
        [shortCode, url],
      )
      inserted = true
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error
    }
  }

  res.status(201).json({ shortUrl: `${APP_BASE_URL}/${shortCode}` })
})

app.get('/:code', async (req, res) => {
  const { code } = req.params

  const [rows] = await pool.query(
    'SELECT original_url FROM urls WHERE short_code = ? LIMIT 1',
    [code],
  )

  if (rows.length === 0) {
    return res.status(404).send('URL não encontrada')
  }

  res.redirect(rows[0].original_url)
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
