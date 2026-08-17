# Despliegue

## Plataforma

El sistema se despliega en Cloudflare Workers con D1 y Static Assets.

- Worker: `sistema-planillas-gamu`
- Base D1: `sistema-planillas-gamu`
- Binding D1: `DB`
- Assets: `dist`

## Comandos

```bash
npm ci
npm run lint
npm test
npm run build
npm run deploy
```

`npm run deploy` ejecuta:

```bash
npm run build
wrangler d1 migrations apply DB --remote
wrangler deploy
```

## Login de Wrangler

Antes de desplegar desde una maquina nueva:

```bash
npx wrangler login
```

El login abre Cloudflare en el navegador y guarda la autorizacion local de Wrangler.

## URL de produccion

La URL publicada por Wrangler es:

```text
https://sistema-planillas-gamu.gamu-asistencia-cr86cri.workers.dev
```

Si el subdominio `workers.dev` acaba de crearse, HTTPS puede tardar unos minutos en terminar de activar certificado/DNS.
