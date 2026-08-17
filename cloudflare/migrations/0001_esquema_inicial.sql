PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS perfiles (
  id_perfil TEXT PRIMARY KEY,
  id_usuario TEXT NOT NULL UNIQUE,
  correo TEXT NOT NULL UNIQUE,
  nombre_mostrado TEXT,
  contrasena_hash TEXT,
  contrasena_salt TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'PENDIENTE')),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sesiones (
  id_sesion TEXT PRIMARY KEY,
  id_usuario TEXT NOT NULL REFERENCES perfiles(id_usuario) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  fecha_expiracion TEXT NOT NULL,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_ultimo_uso TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id_rol TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permisos (
  id_permiso TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios_roles (
  id_usuario TEXT NOT NULL REFERENCES perfiles(id_usuario) ON DELETE CASCADE,
  id_rol TEXT NOT NULL REFERENCES roles(id_rol) ON DELETE CASCADE,
  creado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_rol)
);

CREATE TABLE IF NOT EXISTS roles_permisos (
  id_rol TEXT NOT NULL REFERENCES roles(id_rol) ON DELETE CASCADE,
  id_permiso TEXT NOT NULL REFERENCES permisos(id_permiso) ON DELETE CASCADE,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE IF NOT EXISTS unidades (
  id_unidad TEXT PRIMARY KEY,
  codigo TEXT UNIQUE,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargos (
  id_cargo TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id_funcionario TEXT PRIMARY KEY,
  carnet_identidad TEXT NOT NULL UNIQUE,
  codigo_biometrico TEXT NOT NULL UNIQUE,
  nombres TEXT NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT,
  nombre_completo TEXT,
  id_cargo TEXT REFERENCES cargos(id_cargo),
  id_unidad TEXT REFERENCES unidades(id_unidad),
  fecha_ingreso TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  observacion TEXT,
  creado_por TEXT REFERENCES perfiles(id_usuario),
  actualizado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plantillas_horario (
  id_horario TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'REGULAR',
  alcance TEXT NOT NULL DEFAULT 'GENERAL' CHECK (alcance IN ('GENERAL', 'UNIDAD', 'INDIVIDUAL')),
  id_unidad TEXT REFERENCES unidades(id_unidad),
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reglas_dia_horario (
  id_regla TEXT PRIMARY KEY,
  id_horario TEXT NOT NULL REFERENCES plantillas_horario(id_horario) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  es_laboral INTEGER NOT NULL DEFAULT 1,
  observacion TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_horario, dia_semana)
);

CREATE TABLE IF NOT EXISTS marcaciones_esperadas (
  id_marcacion_esperada TEXT PRIMARY KEY,
  id_regla TEXT NOT NULL REFERENCES reglas_dia_horario(id_regla) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  hora_objetivo TEXT NOT NULL,
  hora_inicio_ventana TEXT NOT NULL,
  hora_fin_ventana TEXT NOT NULL,
  minutos_tolerancia INTEGER NOT NULL DEFAULT 0 CHECK (minutos_tolerancia >= 0),
  orden INTEGER NOT NULL,
  cruza_medianoche INTEGER NOT NULL DEFAULT 0,
  obligatorio INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_regla, orden)
);

CREATE TABLE IF NOT EXISTS asignaciones_horario_funcionario (
  id_asignacion TEXT PRIMARY KEY,
  id_funcionario TEXT NOT NULL REFERENCES funcionarios(id_funcionario) ON DELETE CASCADE,
  id_horario TEXT NOT NULL REFERENCES plantillas_horario(id_horario),
  fecha_desde TEXT NOT NULL,
  fecha_hasta TEXT,
  prioridad INTEGER NOT NULL DEFAULT 100,
  activo INTEGER NOT NULL DEFAULT 1,
  motivo TEXT,
  creado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (fecha_hasta IS NULL OR fecha_hasta >= fecha_desde)
);

CREATE TABLE IF NOT EXISTS feriados (
  id_feriado TEXT PRIMARY KEY,
  fecha TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  alcance TEXT NOT NULL CHECK (alcance IN ('NACIONAL', 'DEPARTAMENTAL', 'MUNICIPAL')),
  aplica INTEGER NOT NULL DEFAULT 1,
  observacion TEXT,
  creado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS excepciones_funcionario (
  id_excepcion TEXT PRIMARY KEY,
  id_funcionario TEXT NOT NULL REFERENCES funcionarios(id_funcionario) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  fecha_desde TEXT NOT NULL,
  fecha_hasta TEXT NOT NULL,
  hora_desde TEXT,
  hora_hasta TEXT,
  motivo TEXT NOT NULL,
  referencia_documento TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO')),
  creado_por TEXT REFERENCES perfiles(id_usuario),
  actualizado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (fecha_hasta >= fecha_desde)
);

CREATE TABLE IF NOT EXISTS registros_horas_extra (
  id_hora_extra TEXT PRIMARY KEY,
  id_funcionario TEXT NOT NULL REFERENCES funcionarios(id_funcionario) ON DELETE CASCADE,
  fecha_hora_extra TEXT NOT NULL,
  minutos_trabajados INTEGER NOT NULL DEFAULT 0 CHECK (minutos_trabajados >= 0),
  aprobado INTEGER NOT NULL DEFAULT 0,
  minutos_tolerancia_otorgados INTEGER NOT NULL DEFAULT 30 CHECK (minutos_tolerancia_otorgados >= 0),
  trasladar_siguiente_laboral INTEGER NOT NULL DEFAULT 0,
  fecha_aplicacion TEXT,
  fecha_aprobacion TEXT,
  aprobado_por TEXT REFERENCES perfiles(id_usuario),
  motivo TEXT,
  origen TEXT NOT NULL DEFAULT 'MANUAL' CHECK (origen IN ('MANUAL', 'AUTOMATICO')),
  detalle_calculo TEXT NOT NULL DEFAULT '{}',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'CONSUMIDO')),
  creado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS periodos_asistencia (
  id_periodo TEXT PRIMARY KEY,
  anio INTEGER NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  fecha_inicio TEXT NOT NULL,
  fecha_fin TEXT NOT NULL,
  id_unidad TEXT REFERENCES unidades(id_unidad),
  estado TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (anio, mes, id_unidad),
  CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS importaciones_excel (
  id_importacion TEXT PRIMARY KEY,
  nombre_archivo TEXT NOT NULL,
  nombre_archivo_normalizado TEXT NOT NULL UNIQUE,
  sha256 TEXT NOT NULL UNIQUE,
  anio INTEGER NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  id_unidad TEXT NOT NULL REFERENCES unidades(id_unidad),
  fecha_minima TEXT,
  fecha_maxima TEXT,
  total_marcaciones INTEGER NOT NULL DEFAULT 0,
  filas_invalidas INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'REVERTIDO')),
  resumen TEXT NOT NULL DEFAULT '{}',
  creado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (anio, mes, id_unidad),
  CHECK (fecha_minima IS NULL OR fecha_maxima IS NULL OR fecha_maxima >= fecha_minima)
);

CREATE TABLE IF NOT EXISTS marcaciones_originales (
  id_marcacion TEXT PRIMARY KEY,
  id_importacion TEXT NOT NULL REFERENCES importaciones_excel(id_importacion) ON DELETE CASCADE,
  id_funcionario TEXT REFERENCES funcionarios(id_funcionario),
  codigo_biometrico TEXT NOT NULL,
  nombre_excel TEXT,
  tiempo_original TEXT NOT NULL,
  fecha_marcacion TEXT NOT NULL,
  estado_excel TEXT,
  dispositivo TEXT,
  tipo_registro TEXT,
  numero_fila INTEGER,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_importacion, codigo_biometrico, fecha_marcacion, dispositivo)
);

CREATE TABLE IF NOT EXISTS asistencias_diarias (
  id_asistencia TEXT PRIMARY KEY,
  id_funcionario TEXT NOT NULL REFERENCES funcionarios(id_funcionario) ON DELETE CASCADE,
  id_periodo TEXT REFERENCES periodos_asistencia(id_periodo),
  id_horario TEXT REFERENCES plantillas_horario(id_horario),
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL,
  minutos_atraso INTEGER NOT NULL DEFAULT 0,
  cantidad_atrasos INTEGER NOT NULL DEFAULT 0,
  cantidad_omisiones INTEGER NOT NULL DEFAULT 0,
  cantidad_faltas INTEGER NOT NULL DEFAULT 0,
  minutos_hora_extra INTEGER NOT NULL DEFAULT 0,
  tolerancia_horas_extra INTEGER NOT NULL DEFAULT 0,
  explicacion TEXT NOT NULL DEFAULT '{}',
  recalculado_por TEXT REFERENCES perfiles(id_usuario),
  fecha_recalculo TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_funcionario, fecha)
);

CREATE TABLE IF NOT EXISTS resultados_marcaciones (
  id_resultado TEXT PRIMARY KEY,
  id_asistencia TEXT NOT NULL REFERENCES asistencias_diarias(id_asistencia) ON DELETE CASCADE,
  id_marcacion_esperada TEXT REFERENCES marcaciones_esperadas(id_marcacion_esperada),
  id_marcacion TEXT REFERENCES marcaciones_originales(id_marcacion),
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  estado TEXT NOT NULL CHECK (estado IN ('PUNTUAL', 'ATRASO', 'OMISION', 'FALTA', 'ADICIONAL')),
  hora_objetivo TEXT,
  fecha_marcacion TEXT,
  minutos_atraso INTEGER NOT NULL DEFAULT 0,
  explicacion TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuraciones_sistema (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registros_auditoria (
  id_auditoria TEXT PRIMARY KEY,
  id_usuario TEXT REFERENCES perfiles(id_usuario),
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  id_entidad TEXT,
  datos_anteriores TEXT,
  datos_nuevos TEXT,
  ip TEXT,
  informacion_peticion TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sesiones_token_hash_idx ON sesiones (token_hash);
CREATE INDEX IF NOT EXISTS usuarios_roles_id_usuario_idx ON usuarios_roles (id_usuario);
CREATE INDEX IF NOT EXISTS usuarios_roles_id_rol_idx ON usuarios_roles (id_rol);
CREATE INDEX IF NOT EXISTS roles_permisos_id_rol_idx ON roles_permisos (id_rol);
CREATE INDEX IF NOT EXISTS roles_permisos_id_permiso_idx ON roles_permisos (id_permiso);
CREATE INDEX IF NOT EXISTS funcionarios_carnet_idx ON funcionarios (carnet_identidad);
CREATE INDEX IF NOT EXISTS funcionarios_codigo_biometrico_idx ON funcionarios (codigo_biometrico);
CREATE INDEX IF NOT EXISTS funcionarios_unidad_idx ON funcionarios (id_unidad);
CREATE INDEX IF NOT EXISTS funcionarios_estado_idx ON funcionarios (estado);
CREATE INDEX IF NOT EXISTS plantillas_horario_unidad_idx ON plantillas_horario (id_unidad);
CREATE INDEX IF NOT EXISTS marcaciones_esperadas_regla_idx ON marcaciones_esperadas (id_regla, orden);
CREATE INDEX IF NOT EXISTS asignaciones_horario_funcionario_fecha_idx ON asignaciones_horario_funcionario (id_funcionario, fecha_desde, fecha_hasta);
CREATE INDEX IF NOT EXISTS feriados_fecha_idx ON feriados (fecha);
CREATE INDEX IF NOT EXISTS excepciones_funcionario_fecha_idx ON excepciones_funcionario (id_funcionario, fecha_desde, fecha_hasta, estado);
CREATE INDEX IF NOT EXISTS horas_extra_funcionario_fecha_idx ON registros_horas_extra (id_funcionario, fecha_hora_extra, fecha_aplicacion, estado);
CREATE UNIQUE INDEX IF NOT EXISTS horas_extra_automatica_unica_idx ON registros_horas_extra (id_funcionario, fecha_hora_extra, fecha_aplicacion) WHERE origen = 'AUTOMATICO';
CREATE INDEX IF NOT EXISTS importaciones_excel_periodo_idx ON importaciones_excel (anio, mes, id_unidad);
CREATE INDEX IF NOT EXISTS importaciones_excel_estado_idx ON importaciones_excel (estado);
CREATE INDEX IF NOT EXISTS marcaciones_originales_importacion_idx ON marcaciones_originales (id_importacion);
CREATE INDEX IF NOT EXISTS marcaciones_originales_funcionario_fecha_idx ON marcaciones_originales (id_funcionario, fecha_marcacion);
CREATE INDEX IF NOT EXISTS marcaciones_originales_codigo_fecha_idx ON marcaciones_originales (codigo_biometrico, fecha_marcacion);
CREATE INDEX IF NOT EXISTS asistencias_diarias_funcionario_fecha_idx ON asistencias_diarias (id_funcionario, fecha);
CREATE INDEX IF NOT EXISTS asistencias_diarias_estado_idx ON asistencias_diarias (estado);
CREATE INDEX IF NOT EXISTS resultados_marcaciones_asistencia_idx ON resultados_marcaciones (id_asistencia);
CREATE INDEX IF NOT EXISTS resultados_marcaciones_marcacion_esperada_idx ON resultados_marcaciones (id_marcacion_esperada);

INSERT OR IGNORE INTO roles (id_rol, nombre, descripcion) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Administrador', 'Acceso completo al sistema.'),
  ('22222222-2222-4222-8222-222222222222', 'Recursos Humanos', 'Gestion operativa de asistencia, importaciones y reportes.'),
  ('33333333-3333-4333-8333-333333333333', 'Consulta', 'Consulta individual de asistencia y generacion de reportes.');

INSERT OR IGNORE INTO permisos (id_permiso, nombre, descripcion) VALUES
  ('00000000-0000-4000-8000-000000000001', 'funcionarios.ver', 'Ver funcionarios.'),
  ('00000000-0000-4000-8000-000000000002', 'funcionarios.crear', 'Crear funcionarios.'),
  ('00000000-0000-4000-8000-000000000003', 'funcionarios.editar', 'Editar funcionarios.'),
  ('00000000-0000-4000-8000-000000000004', 'horarios.gestionar', 'Gestionar horarios.'),
  ('00000000-0000-4000-8000-000000000005', 'excepciones.gestionar', 'Gestionar excepciones.'),
  ('00000000-0000-4000-8000-000000000006', 'feriados.gestionar', 'Gestionar feriados.'),
  ('00000000-0000-4000-8000-000000000007', 'horas_extras.gestionar', 'Gestionar horas extras.'),
  ('00000000-0000-4000-8000-000000000008', 'importaciones.crear', 'Crear importaciones.'),
  ('00000000-0000-4000-8000-000000000009', 'importaciones.ver', 'Ver importaciones.'),
  ('00000000-0000-4000-8000-000000000010', 'asistencia.ver', 'Ver asistencia individual.'),
  ('00000000-0000-4000-8000-000000000011', 'asistencia.recalcular', 'Recalcular asistencia.'),
  ('00000000-0000-4000-8000-000000000012', 'reportes.generar', 'Generar reportes.'),
  ('00000000-0000-4000-8000-000000000013', 'usuarios.gestionar', 'Gestionar usuarios.'),
  ('00000000-0000-4000-8000-000000000014', 'roles.gestionar', 'Gestionar roles y permisos.'),
  ('00000000-0000-4000-8000-000000000015', 'configuracion.gestionar', 'Gestionar configuracion.');

INSERT OR IGNORE INTO roles_permisos (id_rol, id_permiso)
SELECT '11111111-1111-4111-8111-111111111111', id_permiso FROM permisos;

INSERT OR IGNORE INTO roles_permisos (id_rol, id_permiso)
SELECT '22222222-2222-4222-8222-222222222222', id_permiso
FROM permisos
WHERE nombre IN (
  'funcionarios.ver',
  'funcionarios.crear',
  'funcionarios.editar',
  'horarios.gestionar',
  'excepciones.gestionar',
  'feriados.gestionar',
  'horas_extras.gestionar',
  'importaciones.crear',
  'importaciones.ver',
  'asistencia.ver',
  'asistencia.recalcular',
  'reportes.generar',
  'configuracion.gestionar'
);

INSERT OR IGNORE INTO roles_permisos (id_rol, id_permiso)
SELECT '33333333-3333-4333-8333-333333333333', id_permiso
FROM permisos
WHERE nombre IN ('asistencia.ver', 'reportes.generar');

INSERT OR IGNORE INTO configuraciones_sistema (clave, valor, descripcion) VALUES
  ('nombre_institucional', '"Gobierno Autonomo Municipal de Uyuni"', 'Nombre oficial usado en reportes.'),
  ('responsable_reporte_nombre', '"Pendiente de configurar"', 'Nombre del responsable que firma el reporte.'),
  ('responsable_reporte_cargo', '"Pendiente de configurar"', 'Cargo del responsable que firma el reporte.'),
  ('zona_horaria', '"America/La_Paz"', 'Zona horaria local para interpretar marcaciones.'),
  ('trasladar_tolerancia_horas_extra', 'true', 'Trasladar tolerancia de horas extras al siguiente dia laboral aplicable.');

INSERT OR IGNORE INTO unidades (id_unidad, codigo, nombre, descripcion, activo) VALUES
  ('005b565f-cfaa-478d-9d0b-ab7025d44964', 'GENERAL', 'General', 'Unidad general para importaciones institucionales.', 1);

INSERT OR IGNORE INTO cargos (id_cargo, nombre, descripcion, activo) VALUES
  ('44444444-4444-4444-8444-444444444444', 'Sin cargo', 'Cargo pendiente de clasificar.', 1);

INSERT OR IGNORE INTO plantillas_horario (id_horario, nombre, tipo, alcance, descripcion) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Administrativo', 'REGULAR', 'GENERAL', 'Lunes a viernes con dos entradas y dos salidas.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Limpieza', 'LIMPIEZA', 'INDIVIDUAL', 'Limpieza: 04:00 a 08:30 y 14:30 a 18:30.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'Recoleccion de basura', 'RECOLECCION_BASURA', 'INDIVIDUAL', 'Recoleccion: lunes y viernes 05:00 a 13:00; martes y jueves 06:00 a 14:00.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Horario continuo configurable', 'HORARIO_CONTINUO', 'INDIVIDUAL', 'Plantilla base para horarios continuos individuales.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'Serenos', 'HORARIO_CONTINUO', 'INDIVIDUAL', 'Serenos: turno nocturno de 19:00 a 07:00.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'Terminal de buses - turno noche', 'HORARIO_CONTINUO', 'INDIVIDUAL', 'Terminal de buses: turno de 23:00 a 07:00.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'Terminal de buses - turno manana', 'HORARIO_CONTINUO', 'INDIVIDUAL', 'Terminal de buses: turno de 07:00 a 15:00.'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'Terminal de buses - turno tarde', 'HORARIO_CONTINUO', 'INDIVIDUAL', 'Terminal de buses: turno de 15:00 a 23:00.');

WITH dias(dia) AS (VALUES (1), (2), (3), (4), (5))
INSERT OR IGNORE INTO reglas_dia_horario (id_regla, id_horario, dia_semana, es_laboral)
SELECT 'bbbbbbbb-bbbb-4bbb-8bbb-0000000000' || dia, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', dia, 1
FROM dias;

WITH marcaciones(tipo, hora_objetivo, hora_inicio_ventana, hora_fin_ventana, minutos_tolerancia, orden, cruza_medianoche) AS (
  VALUES
    ('ENTRADA', '08:30', '06:00', '10:30', 5, 1, 0),
    ('SALIDA', '12:30', '12:00', '13:30', 0, 2, 0),
    ('ENTRADA', '14:30', '13:30', '16:30', 5, 3, 0),
    ('SALIDA', '18:30', '18:00', '00:00', 0, 4, 1)
)
INSERT OR IGNORE INTO marcaciones_esperadas (id_marcacion_esperada, id_regla, tipo, hora_objetivo, hora_inicio_ventana, hora_fin_ventana, minutos_tolerancia, orden, cruza_medianoche, obligatorio)
SELECT printf('cccccccc-cccc-4ccc-8ccc-1%03d%03d00000', r.dia_semana, m.orden), r.id_regla, m.tipo, m.hora_objetivo, m.hora_inicio_ventana, m.hora_fin_ventana, m.minutos_tolerancia, m.orden, m.cruza_medianoche, 1
FROM reglas_dia_horario r
JOIN marcaciones m ON 1 = 1
WHERE r.id_horario = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

WITH dias(dia) AS (VALUES (1), (2), (3), (4), (5))
INSERT OR IGNORE INTO reglas_dia_horario (id_regla, id_horario, dia_semana, es_laboral)
SELECT 'bbbbbbbb-bbbb-4bbb-8bbb-0000000001' || dia, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', dia, 1
FROM dias;

WITH marcaciones(tipo, hora_objetivo, hora_inicio_ventana, hora_fin_ventana, minutos_tolerancia, orden, cruza_medianoche) AS (
  VALUES
    ('ENTRADA', '04:00', '03:30', '05:30', 5, 1, 0),
    ('SALIDA', '08:30', '08:00', '09:30', 0, 2, 0),
    ('ENTRADA', '14:30', '13:30', '16:30', 5, 3, 0),
    ('SALIDA', '18:30', '18:00', '00:00', 0, 4, 1)
)
INSERT OR IGNORE INTO marcaciones_esperadas (id_marcacion_esperada, id_regla, tipo, hora_objetivo, hora_inicio_ventana, hora_fin_ventana, minutos_tolerancia, orden, cruza_medianoche, obligatorio)
SELECT printf('cccccccc-cccc-4ccc-8ccc-2%03d%03d00000', r.dia_semana, m.orden), r.id_regla, m.tipo, m.hora_objetivo, m.hora_inicio_ventana, m.hora_fin_ventana, m.minutos_tolerancia, m.orden, m.cruza_medianoche, 1
FROM reglas_dia_horario r
JOIN marcaciones m ON 1 = 1
WHERE r.id_horario = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';

INSERT OR IGNORE INTO reglas_dia_horario (id_regla, id_horario, dia_semana, es_laboral, observacion) VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000301', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 1, 1, 'Lunes definido.'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000302', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 2, 1, 'Martes definido.'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000304', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 4, 1, 'Jueves definido.'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000305', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 5, 1, 'Viernes definido.');

WITH marcaciones(tipo, minutos_tolerancia, orden) AS (
  VALUES
    ('ENTRADA', 5, 1),
    ('SALIDA', 0, 2)
)
INSERT OR IGNORE INTO marcaciones_esperadas (id_marcacion_esperada, id_regla, tipo, hora_objetivo, hora_inicio_ventana, hora_fin_ventana, minutos_tolerancia, orden, obligatorio)
SELECT printf('cccccccc-cccc-4ccc-8ccc-3%03d%03d00000', r.dia_semana, m.orden), r.id_regla, m.tipo,
  CASE WHEN r.dia_semana IN (1, 5) AND m.orden = 1 THEN '05:00'
       WHEN r.dia_semana IN (1, 5) AND m.orden = 2 THEN '13:00'
       WHEN m.orden = 1 THEN '06:00'
       ELSE '14:00' END,
  CASE WHEN r.dia_semana IN (1, 5) AND m.orden = 1 THEN '04:30'
       WHEN r.dia_semana IN (1, 5) AND m.orden = 2 THEN '12:30'
       WHEN m.orden = 1 THEN '05:30'
       ELSE '13:30' END,
  CASE WHEN r.dia_semana IN (1, 5) AND m.orden = 1 THEN '07:00'
       WHEN r.dia_semana IN (1, 5) AND m.orden = 2 THEN '15:00'
       WHEN m.orden = 1 THEN '08:00'
       ELSE '16:00' END,
  m.minutos_tolerancia, m.orden, 1
FROM reglas_dia_horario r
JOIN marcaciones m ON 1 = 1
WHERE r.id_horario = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

WITH dias(dia) AS (VALUES (1), (2), (3), (4), (5), (6), (7))
INSERT OR IGNORE INTO reglas_dia_horario (id_regla, id_horario, dia_semana, es_laboral)
SELECT printf('bbbbbbbb-bbbb-4bbb-8bbb-%010d', (cast(substr(h.id_horario, -1) AS integer) * 10) + d.dia), h.id_horario, d.dia, 1
FROM plantillas_horario h
JOIN dias d ON 1 = 1
WHERE h.id_horario IN (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'
);

WITH marcaciones(id_horario, tipo, hora_objetivo, hora_inicio_ventana, hora_fin_ventana, minutos_tolerancia, orden, cruza_medianoche) AS (
  VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'ENTRADA', '19:00', '18:00', '21:00', 5, 1, 0),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'SALIDA', '07:00', '23:00', '09:00', 0, 2, 1),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'ENTRADA', '23:00', '22:00', '00:30', 5, 1, 1),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'SALIDA', '07:00', '23:30', '09:00', 0, 2, 1),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'ENTRADA', '07:00', '06:00', '08:30', 5, 1, 0),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'SALIDA', '15:00', '14:30', '16:30', 0, 2, 0),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'ENTRADA', '15:00', '14:00', '16:30', 5, 1, 0),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'SALIDA', '23:00', '22:00', '00:30', 0, 2, 1)
)
INSERT OR IGNORE INTO marcaciones_esperadas (id_marcacion_esperada, id_regla, tipo, hora_objetivo, hora_inicio_ventana, hora_fin_ventana, minutos_tolerancia, orden, cruza_medianoche, obligatorio)
SELECT printf('cccccccc-cccc-4ccc-8ccc-%s%03d%03d000', substr(r.id_horario, -1), r.dia_semana, m.orden), r.id_regla, m.tipo, m.hora_objetivo, m.hora_inicio_ventana, m.hora_fin_ventana, m.minutos_tolerancia, m.orden, m.cruza_medianoche, 1
FROM reglas_dia_horario r
JOIN marcaciones m ON m.id_horario = r.id_horario
WHERE r.id_horario IN (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'
);

