# Sistema web de control de asistencia GAMU

Aplicacion web para el control individual de asistencia del Gobierno Autonomo Municipal de Uyuni. Corre como Cloudflare Worker con frontend estatico y base de datos Cloudflare D1.

## Caracteristicas

- Autenticacion propia con sesiones `HttpOnly` guardadas en D1.
- Primer administrador creado desde la pantalla inicial cuando aun no existen usuarios.
- Modulos de funcionarios, cargos, unidades, horarios, excepciones, feriados, horas extras, importaciones, asistencia individual, reportes, usuarios, roles y configuracion.
- Importacion Excel con lectura local, SHA-256, previsualizacion, validacion, historial y rollback controlado.
- Motor de asistencia con atrasos, faltas, omisiones, horas extra automaticas y tolerancia del dia siguiente.
- Reporte PDF individual generado desde la vista de asistencia.
- API privada en Worker bajo `/api/*` y assets estaticos servidos desde `dist`.

## Requisitos

- Node.js 22 o compatible.
- npm 10 o compatible.
- Cuenta de Cloudflare con Workers y D1.
- Wrangler autenticado con `npx wrangler login`.

## Desarrollo

```bash
npm install
npm run dev
```

Para probar con Worker y D1 local:

```bash
npm run build
npm run db:migrate:local
npm run dev:cloudflare
```

## Verificacion

```bash
npm run lint
npm test
npm run build
```

## Cloudflare

La configuracion esta en `wrangler.jsonc`.

- Worker: `sistema-planillas-gamu`
- D1: `sistema-planillas-gamu`
- Binding D1: `DB`
- Binding de assets: `ASSETS`
- Cookie de sesion: `gamu_sesion`

La migracion principal esta en:

```text
cloudflare/migrations/0001_esquema_inicial.sql
```

## Despliegue

```bash
npm run deploy
```

El comando compila, aplica migraciones remotas y publica Worker + assets.

## Primer administrador

Al abrir el sistema por primera vez, si D1 no tiene usuarios, la pantalla de ingreso muestra el formulario para crear el administrador inicial. Despues de crearlo, el sistema pasa al login normal.
