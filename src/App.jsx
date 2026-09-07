import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [urls, setUrls] = useState([])

  useEffect(() => {
    fetchUrls()
  }, [])

  async function fetchUrls() {
    try {
      const response = await fetch(`${API_URL}/api/urls`)
      const data = await response.json()
      if (response.ok) setUrls(data)
    } catch {
      // lista fica vazia se o backend estiver indisponível
    }
  }

  async function handleShorten() {
    if (!url || loading) return

    setLoading(true)
    setShortUrl('')
    setError('')
    setCopied(false)

    try {
      const response = await fetch(`${API_URL}/api/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao encurtar')
        return
      }

      setShortUrl(`${API_URL}/${data.shortCode}`)
      fetchUrls()
    } catch {
      setError('Não foi possível conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete(id) {
    const response = await fetch(`${API_URL}/api/urls/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setUrls((current) => current.filter((item) => item.id !== id))
    }
  }

  return (
    <main className="page">
      <div className="content">
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
            value={error || shortUrl}
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
          {shortUrl && (
            <button
              type="button"
              className="copy-button"
              onClick={handleCopy}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          )}
        </div>

        {urls.length > 0 && (
          <div className="list-card">
            <h2 className="list-title">URLs encurtadas</h2>
            <ul className="list">
              {urls.map((item) => (
                <li key={item.id} className="list-item">
                  <div className="list-item-info">
                    <span className="list-item-code">
                      {API_URL}/{item.short_code}
                    </span>
                    <span className="list-item-original">
                      {item.original_url}
                    </span>
                  </div>
                  <div className="list-item-actions">
                    <span className="list-item-count">
                      {item.access_count} acessos
                    </span>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(item.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
