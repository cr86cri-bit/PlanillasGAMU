# Instrucciones del repositorio

- Mantener todos los identificadores propios del sistema en espanol tecnico sin tildes ni `n`.
- Conservar nombres oficiales de Vite, Cloudflare, Workers, D1, Wrangler, npm y JavaScript cuando sean obligatorios.
- No guardar claves privadas, `service_role`, contrasenas ni tokens en el repositorio.
- Las pantallas deben seguir el flujo `Pagina -> controlador/estado -> servicio -> cliente API/datos -> Worker -> D1`.
- Los componentes visuales no deben consultar D1 directamente.
- Antes de cerrar cambios relevantes, ejecutar `npm run lint`, `npm test` y `npm run build`.
