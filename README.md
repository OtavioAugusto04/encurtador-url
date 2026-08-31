# Encurtador de URL

Projeto de encurtador de URLs com frontend em Vite + React (JavaScript) e backend em Node.js + Express + MySQL.

## Estrutura

- `/` — frontend (Vite + React)
- `/server` — backend (Express + MySQL)

## Backend

1. Crie o banco e a tabela rodando o script SQL:

   ```
   mysql -u root -p < server/schema.sql
   ```

2. Entre na pasta do servidor, instale as dependências e configure as variáveis de ambiente:

   ```
   cd server
   npm install
   cp .env.example .env
   ```

   Edite o `.env` com as credenciais do seu MySQL local (`DB_USER`, `DB_PASSWORD`, etc).

3. Inicie o servidor:

   ```
   npm start
   ```

   O backend sobe em `http://localhost:3001`.

## Frontend

Na raiz do projeto:

```
npm install
npm run dev
```

Depois abra o endereço exibido no terminal (geralmente `http://localhost:5173`) no navegador.

> O backend precisa estar rodando para o botão "Encurtar" funcionar.

## Outros comandos

**Frontend** (raiz do projeto):
- `npm run build` — gera a versão de produção na pasta `dist`
- `npm run preview` — serve a build de produção localmente
- `npm run lint` — executa o linter (oxlint)

**Backend** (`/server`):
- `npm run dev` — sobe o servidor com reinício automático ao salvar arquivos
