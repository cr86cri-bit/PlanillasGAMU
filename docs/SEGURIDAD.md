# Seguridad

## Principios aplicados

- No se exponen claves privadas en frontend, README ni build.
- El navegador no tiene credenciales directas de D1.
- Toda operacion pasa por el Worker bajo `/api/*`.
- Las sesiones usan cookie `HttpOnly` y `SameSite=Lax`.
- Las contrasenas se guardan con PBKDF2, sal individual y hash.
- La autorizacion se resuelve con roles y permisos propios.
- No se otorga acceso anonimo a informacion de funcionarios.

## Roles

- `Administrador`: todos los permisos.
- `Recursos Humanos`: permisos operativos.
- `Consulta`: consulta individual y generacion de reportes.

## Auditoria

La tabla `registros_auditoria` guarda usuario, accion, entidad, ID afectado, datos anteriores/nuevos cuando corresponde, fecha e informacion segura de peticion si esta disponible.

No se guardan contrasenas ni tokens en auditoria.

## Bootstrap del primer administrador

Cuando D1 no tiene usuarios, la pantalla de ingreso permite crear el primer administrador. Despues de eso, el endpoint de bootstrap queda bloqueado porque ya existen perfiles.
