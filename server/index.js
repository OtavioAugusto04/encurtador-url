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

app.get('/api/urls', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, short_code, original_url, created_at, access_count FROM urls ORDER BY created_at DESC',
  )

  res.json(rows)
})

app.get('/api/urls/:id', async (req, res) => {
  const { id } = req.params

  const [rows] = await pool.query(
    'SELECT id, short_code, original_url, created_at, access_count FROM urls WHERE id = ? LIMIT 1',
    [id],
  )

  if (rows.length === 0) {
    return res.status(404).json({ error: 'URL não encontrada' })
  }

  res.json(rows[0])
})

app.delete('/api/urls/:id', async (req, res) => {
  const { id } = req.params

  const [result] = await pool.query('DELETE FROM urls WHERE id = ?', [id])

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'URL não encontrada' })
  }

  res.status(204).end()
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

  await pool.query(
    'UPDATE urls SET access_count = access_count + 1 WHERE short_code = ?',
    [code],
  )

  res.redirect(rows[0].original_url)
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
