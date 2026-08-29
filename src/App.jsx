import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')

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
          readOnly
        />
        <button type="button" className="submit-button">
          Encurtar
        </button>
      </div>
    </main>
  )
}

export default App
