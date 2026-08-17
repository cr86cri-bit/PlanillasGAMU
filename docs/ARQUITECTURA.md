# Arquitectura

## Tecnologia

- Vite.
- JavaScript moderno con ES Modules.
- HTML semantico y CSS modular.
- Cloudflare Workers para API privada.
- Cloudflare D1 como base SQL.
- Cloudflare Static Assets para servir `dist`.
- Vitest y ESLint.

## Estructura

La aplicacion usa nombres propios en espanol:

```text
src/
├── aplicacion/
├── nucleo/
├── componentes/
├── estructuras/
├── modulos/
├── estilos/
└── utilidades/

worker/
└── index.js

cloudflare/
└── migrations/
```

## Flujo obligatorio

```text
Pagina o componente
→ controlador o estado
→ servicio del modulo
→ cliente API o servicio de datos
→ Worker /api/*
→ D1
```

Los componentes visuales no consultan D1 directamente.

## Rutas

El enrutador usa `window.location.hash`, por ejemplo `#/funcionarios`. Cloudflare sirve la SPA desde assets y el Worker atiende primero `/api/*`.

## Carga dinamica

- `xlsx` se importa solamente dentro del modulo de importaciones.
- `jspdf` se importa solamente al generar un reporte individual.

## Operaciones privadas

El Worker valida la cookie de sesion, consulta roles/permisos en D1 y ejecuta las operaciones con el binding `DB`. Las contrasenas se guardan con hash PBKDF2 y sal individual.
