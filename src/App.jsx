import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleShorten() {
    if (!url || loading) return

    setLoading(true)
    setShortUrl('')

    try {
      const response = await fetch(`${API_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        setShortUrl(data.error || 'Erro ao encurtar')
        return
      }

      setShortUrl(data.shortUrl)
    } catch {
      setShortUrl('Não foi possível conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="card">
        <input
          type="text"
          className="field field-input"
          placeholder="Cole sua URL aqui"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          className="field field-output"
          placeholder="URL encurtada"
          value={shortUrl}
          readOnly
        />
        <button
          type="button"
          className="submit-button"
          onClick={handleShorten}
          disabled={loading}
        >
          {loading ? 'Encurtando...' : 'Encurtar'}
        </button>
      </div>
    </main>
  )
}

export default App
