# Plan de construccion

## Contexto actual

- Repositorio objetivo: `Sistema de Planillas GAMU`.
- Plataforma de produccion: Cloudflare Workers + D1 + Static Assets.
- Base D1 creada: `sistema-planillas-gamu`.
- ID D1: `35124dee-9457-4f3e-a685-082f9dc5d0f9`.
- Worker desplegado: `sistema-planillas-gamu`.

## Convenciones obligatorias

- Todo identificador propio del sistema se escribe en espanol tecnico sin tildes ni `n`.
- Los textos visibles y la documentacion usan espanol.
- Se conservan solamente nombres oficiales de tecnologias y APIs externas, por ejemplo `package.json`, `Worker`, `D1`, `Wrangler` y `fetch`.
- La aplicacion usa Vite, JavaScript moderno con ES Modules, HTML semantico, CSS modular, hash router y salida estatica en `dist`.

## Alcance funcional

1. Interfaz institucional responsive con login, estructura protegida, navegacion lateral adaptable y modulos principales.
2. Componentes reutilizables: botones, campos, selectores, tablas, filtros, tarjetas, modales, confirmaciones, notificaciones, paginacion, estados vacios, carga, errores y selectores de fecha.
3. Servicios, controladores y estado por modulo siguiendo el flujo:
   `Pagina -> controlador/estado -> servicio -> cliente API/datos -> Worker -> D1`.
4. Gestion para funcionarios, cargos, unidades, horarios, excepciones, feriados, horas extra, importaciones, asistencia individual, reportes, usuarios, roles y configuracion.
5. Motor determinista de asistencia en JavaScript con pruebas unitarias.
6. Importacion de Excel con lectura dinamica, hash SHA-256, validaciones, previsualizacion, deteccion de duplicados, historial y rollback controlado.
7. Generacion dinamica de PDF individual.
8. Worker protegido para administracion de usuarios, asignacion de roles, importacion y recalculo.
9. Despliegue con `wrangler deploy`.

## Base de datos y seguridad

1. Mantener migraciones SQL versionadas en `cloudflare/migrations`.
2. Modelar las tablas en espanol:
   `perfiles`, `sesiones`, `roles`, `permisos`, `usuarios_roles`, `roles_permisos`, `unidades`, `cargos`, `funcionarios`, `plantillas_horario`, `reglas_dia_horario`, `marcaciones_esperadas`, `asignaciones_horario_funcionario`, `feriados`, `excepciones_funcionario`, `registros_horas_extra`, `periodos_asistencia`, `importaciones_excel`, `marcaciones_originales`, `asistencias_diarias`, `resultados_marcaciones`, `configuraciones_sistema` y `registros_auditoria`.
3. Usar claves foraneas, restricciones, estados, timestamps e indices.
4. No exponer credenciales directas de D1 al navegador.
5. Autorizar por sesiones, roles y permisos propios en el Worker.
6. No conceder acceso anonimo a informacion de funcionarios.
7. Crear el primer administrador solo desde el bootstrap inicial cuando D1 no tiene usuarios.

## Datos iniciales

- Insertar solamente roles, permisos, relaciones rol-permiso, unidad general, cargo pendiente, plantillas de horario conocidas y configuracion institucional.
- No crear funcionarios reales ni usuarios falsos.
- Dejar firmante y cargo del firmante como `Pendiente de configurar`.

## Pruebas y verificacion

1. Instalar dependencias con lockfile.
2. Ejecutar `npm run lint`, `npm test` y `npm run build`.
3. Validar migraciones locales con `npm run db:migrate:local`.
4. Validar D1 remota con consulta de conteos base.
5. Verificar endpoint `/api/salud` despues del despliegue.

## Decisiones asumidas

- La zona horaria operativa es `America/La_Paz`.
- La regla predeterminada para tolerancia por horas extra automaticas traslada el beneficio al siguiente dia laboral aplicable si el dia siguiente es feriado o no laborable.
- El horario de recoleccion de basura para miercoles queda sin marcaciones esperadas iniciales y se mantiene configurable.
- El horario continuo individual queda modelado como plantilla configurable.
