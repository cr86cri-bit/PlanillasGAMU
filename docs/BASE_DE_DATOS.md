# Base de datos

## Proyecto

- Plataforma: Cloudflare D1.
- Base: `sistema-planillas-gamu`.
- ID: `35124dee-9457-4f3e-a685-082f9dc5d0f9`.
- Binding del Worker: `DB`.

## Tablas principales

- `perfiles`
- `sesiones`
- `roles`
- `permisos`
- `usuarios_roles`
- `roles_permisos`
- `unidades`
- `cargos`
- `funcionarios`
- `plantillas_horario`
- `reglas_dia_horario`
- `marcaciones_esperadas`
- `asignaciones_horario_funcionario`
- `feriados`
- `excepciones_funcionario`
- `registros_horas_extra`
- `periodos_asistencia`
- `importaciones_excel`
- `marcaciones_originales`
- `asistencias_diarias`
- `resultados_marcaciones`
- `configuraciones_sistema`
- `registros_auditoria`

## Datos iniciales

La migracion inserta:

- Roles iniciales: `Administrador`, `Recursos Humanos`, `Consulta`.
- Permisos granulares y relaciones rol-permiso.
- Unidad `GENERAL - General`.
- Cargo `Sin cargo`.
- Plantillas iniciales: Administrativo, Limpieza, Recoleccion de basura, Horario continuo configurable, Serenos y turnos de Terminal de buses.
- Reglas por dia y marcaciones esperadas.
- Configuracion institucional base.

No se insertan funcionarios reales ni usuarios falsos.

## Indices

La migracion agrega indices para carnet, codigo biometrico, funcionario-fecha, unidad, periodo, importacion, fecha de marcacion, estado y relaciones consultadas con frecuencia.

## Acceso

El navegador no consulta D1 directamente. Toda lectura y escritura pasa por el Worker bajo `/api/*`, donde se valida sesion y permisos.
