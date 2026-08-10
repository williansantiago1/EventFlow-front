# Playwright smoke (opt-in)

Os testes em `e2e/` **não rodam** no `npm test` padrão.

## Por que opt-in?

- Baixar browsers do Playwright pode falhar por rede/política (App Control no Windows).
- O smoke precisa de API + web + Postgres + Redis + seed rodando.

## Como rodar

```bash
# 1) Stack local (pasta api/)
npm run infra:up
npm run db:push
npm run db:seed
npm run dev

# 2) Browsers (uma vez; opcional se a política bloquear) — pasta web/
npx playwright install chromium

# 3) Smoke — pasta web/
# PowerShell:
$env:E2E = "1"; npm run test:e2e
# bash:
E2E=1 npm run test:e2e
```

Sem `E2E=1`, o spec faz `test.skip` e documenta o happy path.
