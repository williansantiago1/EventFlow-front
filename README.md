# EventFlow Web

React + Vite. Precisa da API em `:3001` (e do worker, se for testar checkout/filas).

```bash
cp .env.example .env
npm install
npm run dev
```

Abre em http://localhost:5174.

Na pasta `api/`, em terminais separados:

```bash
npm run dev         # API
npm run dev:worker  # filas
```
# EventFlow-front
