import {
  MINUTOS_MINIMOS_HORA_EXTRA_AUTOMATICA,
  MINUTOS_TOLERANCIA_HORA_EXTRA,
  calcularAsistenciaDiaria,
} from "../src/modulos/asistencia/utilidades/motorAsistencia.js";

const DIAS_SESION = 7;
const TAMANO_MAXIMO_LOTE = 500;
const LIMITE_VARIABLES_SQL_D1 = 80;
const ITERACIONES_PBKDF2 = 100000;

const METADATOS_TABLAS = {
  perfiles: {
    pk: "id_perfil",
    columnas: [
      "id_perfil",
      "id_usuario",
      "correo",
      "nombre_mostrado",
      "contrasena_hash",
      "contrasena_salt",
      "estado",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    ocultas: ["contrasena_hash", "contrasena_salt"],
  },
  roles: {
    pk: "id_rol",
    columnas: ["id_rol", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion"],
    booleanas: ["activo"],
  },
  permisos: {
    pk: "id_permiso",
    columnas: ["id_permiso", "nombre", "descripcion", "fecha_creacion"],
  },
  usuarios_roles: {
    columnas: ["id_usuario", "id_rol", "creado_por", "fecha_creacion"],
  },
  roles_permisos: {
    columnas: ["id_rol", "id_permiso", "fecha_creacion"],
  },
  unidades: {
    pk: "id_unidad",
    columnas: ["id_unidad", "codigo", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion"],
    booleanas: ["activo"],
  },
  cargos: {
    pk: "id_cargo",
    columnas: ["id_cargo", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion"],
    booleanas: ["activo"],
  },
  funcionarios: {
    pk: "id_funcionario",
    columnas: [
      "id_funcionario",
      "carnet_identidad",
      "codigo_biometrico",
      "nombres",
      "apellido_paterno",
      "apellido_materno",
      "nombre_completo",
      "id_cargo",
      "id_unidad",
      "fecha_ingreso",
      "estado",
      "observacion",
      "creado_por",
      "actualizado_por",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
  },
  plantillas_horario: {
    pk: "id_horario",
    columnas: [
      "id_horario",
      "nombre",
      "tipo",
      "alcance",
      "id_unidad",
      "descripcion",
      "activo",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    booleanas: ["activo"],
  },
  reglas_dia_horario: {
    pk: "id_regla",
    columnas: [
      "id_regla",
      "id_horario",
      "dia_semana",
      "es_laboral",
      "observacion",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    booleanas: ["es_laboral"],
  },
  marcaciones_esperadas: {
    pk: "id_marcacion_esperada",
    columnas: [
      "id_marcacion_esperada",
      "id_regla",
      "tipo",
      "hora_objetivo",
      "hora_inicio_ventana",
      "hora_fin_ventana",
      "minutos_tolerancia",
      "orden",
      "cruza_medianoche",
      "obligatorio",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    booleanas: ["cruza_medianoche", "obligatorio"],
  },
  asignaciones_horario_funcionario: {
    pk: "id_asignacion",
    columnas: [
      "id_asignacion",
      "id_funcionario",
      "id_horario",
      "fecha_desde",
      "fecha_hasta",
      "prioridad",
      "activo",
      "motivo",
      "creado_por",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    booleanas: ["activo"],
  },
  feriados: {
    pk: "id_feriado",
    columnas: [
      "id_feriado",
      "fecha",
      "nombre",
      "alcance",
      "aplica",
      "observacion",
      "creado_por",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    booleanas: ["aplica"],
  },
  excepciones_funcionario: {
    pk: "id_excepcion",
    columnas: [
      "id_excepcion",
      "id_funcionario",
      "tipo",
      "fecha_desde",
      "fecha_hasta",
      "hora_desde",
      "hora_hasta",
      "motivo",
      "referencia_documento",
      "estado",
      "creado_por",
      "actualizado_por",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
  },
  registros_horas_extra: {
    pk: "id_hora_extra",
    columnas: [
      "id_hora_extra",
      "id_funcionario",
      "fecha_hora_extra",
      "minutos_trabajados",
      "aprobado",
      "minutos_tolerancia_otorgados",
      "trasladar_siguiente_laboral",
      "fecha_aplicacion",
      "fecha_aprobacion",
      "aprobado_por",
      "motivo",
      "origen",
      "detalle_calculo",
      "estado",
      "creado_por",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    booleanas: ["aprobado", "trasladar_siguiente_laboral"],
    json: ["detalle_calculo"],
  },
  periodos_asistencia: {
    pk: "id_periodo",
    columnas: [
      "id_periodo",
      "anio",
      "mes",
      "fecha_inicio",
      "fecha_fin",
      "id_unidad",
      "estado",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
  },
  importaciones_excel: {
    pk: "id_importacion",
    columnas: [
      "id_importacion",
      "nombre_archivo",
      "nombre_archivo_normalizado",
      "sha256",
      "anio",
      "mes",
      "id_unidad",
      "fecha_minima",
      "fecha_maxima",
      "total_marcaciones",
      "filas_invalidas",
      "estado",
      "resumen",
      "creado_por",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    json: ["resumen"],
  },
  marcaciones_originales: {
    pk: "id_marcacion",
    columnas: [
      "id_marcacion",
      "id_importacion",
      "id_funcionario",
      "codigo_biometrico",
      "nombre_excel",
      "tiempo_original",
      "fecha_marcacion",
      "estado_excel",
      "dispositivo",
      "tipo_registro",
      "numero_fila",
      "fecha_creacion",
    ],
  },
  asistencias_diarias: {
    pk: "id_asistencia",
    columnas: [
      "id_asistencia",
      "id_funcionario",
      "id_periodo",
      "id_horario",
      "fecha",
      "estado",
      "minutos_atraso",
      "cantidad_atrasos",
      "cantidad_omisiones",
      "cantidad_faltas",
      "minutos_hora_extra",
      "tolerancia_horas_extra",
      "explicacion",
      "recalculado_por",
      "fecha_recalculo",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
    json: ["explicacion"],
  },
  resultados_marcaciones: {
    pk: "id_resultado",
    columnas: [
      "id_resultado",
      "id_asistencia",
      "id_marcacion_esperada",
      "id_marcacion",
      "tipo",
      "estado",
      "hora_objetivo",
      "fecha_marcacion",
      "minutos_atraso",
      "explicacion",
      "fecha_creacion",
    ],
  },
  configuraciones_sistema: {
    pk: "clave",
    columnas: ["clave", "valor", "descripcion", "fecha_creacion", "fecha_actualizacion"],
    json: ["valor"],
  },
  registros_auditoria: {
    pk: "id_auditoria",
    columnas: [
      "id_auditoria",
      "id_usuario",
      "accion",
      "entidad",
      "id_entidad",
      "datos_anteriores",
      "datos_nuevos",
      "ip",
      "informacion_peticion",
      "fecha_creacion",
    ],
    json: ["datos_anteriores", "datos_nuevos", "informacion_peticion"],
  },
};

const PERMISOS_LECTURA = {
  perfiles: ["usuarios.gestionar"],
  roles: ["roles.gestionar"],
  permisos: ["roles.gestionar"],
  usuarios_roles: ["roles.gestionar", "usuarios.gestionar"],
  roles_permisos: ["roles.gestionar"],
  funcionarios: ["funcionarios.ver", "horarios.gestionar", "asistencia.ver", "importaciones.ver"],
  cargos: ["funcionarios.ver"],
  unidades: ["funcionarios.ver", "importaciones.ver"],
  plantillas_horario: ["horarios.gestionar", "asistencia.ver", "importaciones.ver"],
  reglas_dia_horario: ["horarios.gestionar", "asistencia.ver", "importaciones.ver"],
  marcaciones_esperadas: ["horarios.gestionar", "asistencia.ver", "importaciones.ver"],
  asignaciones_horario_funcionario: ["horarios.gestionar", "asistencia.ver"],
  feriados: ["feriados.gestionar", "asistencia.ver", "importaciones.ver"],
  excepciones_funcionario: ["excepciones.gestionar", "asistencia.ver"],
  registros_horas_extra: ["horas_extras.gestionar", "asistencia.ver"],
  periodos_asistencia: ["asistencia.ver", "importaciones.ver"],
  importaciones_excel: ["importaciones.ver"],
  marcaciones_originales: ["importaciones.ver", "asistencia.ver"],
  asistencias_diarias: ["asistencia.ver"],
  resultados_marcaciones: ["asistencia.ver"],
  configuraciones_sistema: ["configuracion.gestionar", "reportes.generar"],
  registros_auditoria: ["configuracion.gestionar"],
};

const PERMISOS_ESCRITURA = {
  perfiles: ["usuarios.gestionar"],
  roles: ["roles.gestionar"],
  usuarios_roles: ["roles.gestionar", "usuarios.gestionar"],
  funcionarios: ["funcionarios.crear", "funcionarios.editar"],
  cargos: ["funcionarios.editar"],
  unidades: ["funcionarios.editar"],
  plantillas_horario: ["horarios.gestionar"],
  reglas_dia_horario: ["horarios.gestionar"],
  marcaciones_esperadas: ["horarios.gestionar"],
  asignaciones_horario_funcionario: ["horarios.gestionar"],
  feriados: ["feriados.gestionar"],
  excepciones_funcionario: ["excepciones.gestionar"],
  registros_horas_extra: ["horas_extras.gestionar", "asistencia.recalcular"],
  periodos_asistencia: ["asistencia.recalcular"],
  importaciones_excel: ["importaciones.crear", "asistencia.recalcular"],
  marcaciones_originales: ["importaciones.crear"],
  asistencias_diarias: ["asistencia.recalcular"],
  resultados_marcaciones: ["asistencia.recalcular"],
  configuraciones_sistema: ["configuracion.gestionar"],
};

export default {
  async fetch(solicitud, env) {
    const url = new URL(solicitud.url);

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(solicitud);
    }

    try {
      return await manejarApi(solicitud, env, url);
    } catch (error) {
      console.error(error);
      return responderJson(
        {
          correcto: false,
          mensaje: error?.message ?? "Ocurrio un error inesperado.",
        },
        error?.estadoHttp ?? 500,
      );
    }
  },
};

async function manejarApi(solicitud, env, url) {
  if (solicitud.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const ruta = url.pathname.replace(/^\/api\/?/, "");

  if (ruta === "salud") {
    return responderJson({ correcto: true, mensaje: "API Cloudflare activa." });
  }

  if (ruta === "auth/estado-inicial" && solicitud.method === "GET") {
    return manejarEstadoInicial(env);
  }

  if (ruta === "auth/setup" && solicitud.method === "POST") {
    return manejarSetupInicial(solicitud, env);
  }

  if (ruta === "auth/login" && solicitud.method === "POST") {
    return manejarLogin(solicitud, env);
  }

  const usuario = await obtenerUsuarioDesdeSesion(solicitud, env);

  if (ruta === "auth/logout" && solicitud.method === "POST") {
    return manejarLogout(solicitud, env);
  }

  if (ruta === "auth/user" && solicitud.method === "GET") {
    return responderJson({ correcto: true, datos: usuario ?? null });
  }

  if (!usuario) {
    return responderJson({ correcto: false, mensaje: "La sesion no esta activa." }, 401);
  }

  if (ruta.startsWith("datos/")) {
    return manejarDatos(solicitud, env, usuario, ruta.replace("datos/", ""));
  }

  if (ruta.startsWith("funciones/")) {
    return manejarFuncion(solicitud, env, usuario, ruta.replace("funciones/", ""));
  }

  return responderJson({ correcto: false, mensaje: "Ruta de API no encontrada." }, 404);
}

async function manejarEstadoInicial(env) {
  const total = await obtenerValor(env.DB, "SELECT COUNT(*) AS total FROM perfiles");
  return responderJson({ correcto: true, datos: { requiere_configuracion: Number(total ?? 0) === 0 } });
}

async function manejarSetupInicial(solicitud, env) {
  const total = await obtenerValor(env.DB, "SELECT COUNT(*) AS total FROM perfiles");

  if (Number(total ?? 0) > 0) {
    return responderJson({ correcto: false, mensaje: "El administrador inicial ya fue creado." }, 409);
  }

  const cuerpo = await leerJson(solicitud);
  const correo = normalizarCorreo(cuerpo.correo);
  const contrasena = String(cuerpo.contrasena ?? "");
  const nombre = String(cuerpo.nombre_mostrado ?? correo).trim();

  validarCredencialesUsuario(correo, contrasena);
  const usuario = await crearPerfilConContrasena(env.DB, {
    correo,
    contrasena,
    nombre_mostrado: nombre,
    estado: "ACTIVO",
  });

  await env.DB.prepare(
    "INSERT OR IGNORE INTO usuarios_roles (id_usuario, id_rol, creado_por) VALUES (?, ?, ?)",
  )
    .bind(usuario.id_usuario, "11111111-1111-4111-8111-111111111111", usuario.id_usuario)
    .run();

  await registrarAuditoria(env.DB, usuario, "crear_administrador_inicial", "perfiles", usuario.id_usuario, {
    correo,
  });

  const respuesta = await crearSesionRespuesta(solicitud, env, usuario);
  return respuesta;
}

async function manejarLogin(solicitud, env) {
  const cuerpo = await leerJson(solicitud);
  const correo = normalizarCorreo(cuerpo.correo);
  const contrasena = String(cuerpo.contrasena ?? "");

  const perfil = await env.DB.prepare("SELECT * FROM perfiles WHERE correo = ? LIMIT 1")
    .bind(correo)
    .first();

  if (!perfil || perfil.estado !== "ACTIVO") {
    return responderJson({ correcto: false, mensaje: "Correo o contrasena incorrectos." }, 401);
  }

  const contrasenaCorrecta = await verificarContrasena(
    contrasena,
    perfil.contrasena_salt,
    perfil.contrasena_hash,
  );

  if (!contrasenaCorrecta) {
    return responderJson({ correcto: false, mensaje: "Correo o contrasena incorrectos." }, 401);
  }

  return crearSesionRespuesta(solicitud, env, perfil);
}

async function manejarLogout(solicitud, env) {
  const token = obtenerCookie(solicitud, nombreCookieSesion(env));

  if (token) {
    const hash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM sesiones WHERE token_hash = ?").bind(hash).run();
  }

  return responderJson(
    { correcto: true },
    200,
    {
      "Set-Cookie": construirCookieSesion("", solicitud, env, { maxAge: 0 }),
    },
  );
}

async function crearSesionRespuesta(solicitud, env, perfil) {
  const token = crearTokenSeguro();
  const tokenHash = await sha256Hex(token);
  const expiracion = new Date(Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO sesiones (id_sesion, id_usuario, token_hash, fecha_expiracion) VALUES (?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), perfil.id_usuario, tokenHash, expiracion)
    .run();

  const usuario = await construirUsuarioActual(env.DB, perfil.id_usuario);
  return responderJson(
    { correcto: true, datos: usuario },
    200,
    {
      "Set-Cookie": construirCookieSesion(token, solicitud, env),
    },
  );
}

async function obtenerUsuarioDesdeSesion(solicitud, env) {
  const token = obtenerCookie(solicitud, nombreCookieSesion(env));

  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const sesion = await env.DB.prepare(
    `SELECT s.id_sesion, s.id_usuario, s.fecha_expiracion, p.correo, p.estado
     FROM sesiones s
     JOIN perfiles p ON p.id_usuario = s.id_usuario
     WHERE s.token_hash = ?
     LIMIT 1`,
  )
    .bind(tokenHash)
    .first();

  if (!sesion || sesion.estado !== "ACTIVO" || sesion.fecha_expiracion < new Date().toISOString()) {
    if (sesion?.id_sesion) {
      await env.DB.prepare("DELETE FROM sesiones WHERE id_sesion = ?").bind(sesion.id_sesion).run();
    }

    return null;
  }

  await env.DB.prepare(
    "UPDATE sesiones SET fecha_ultimo_uso = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id_sesion = ?",
  )
    .bind(sesion.id_sesion)
    .run();

  return construirUsuarioActual(env.DB, sesion.id_usuario);
}

async function construirUsuarioActual(db, idUsuario) {
  const perfil = await db
    .prepare("SELECT id_usuario, correo, nombre_mostrado, estado FROM perfiles WHERE id_usuario = ?")
    .bind(idUsuario)
    .first();

  if (!perfil) {
    return null;
  }

  return {
    id_usuario: perfil.id_usuario,
    correo: perfil.correo,
    nombre_mostrado: perfil.nombre_mostrado,
    permisos: await obtenerPermisosUsuario(db, perfil.id_usuario),
  };
}

async function obtenerPermisosUsuario(db, idUsuario) {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT p.nombre
       FROM usuarios_roles ur
       JOIN roles r ON r.id_rol = ur.id_rol AND r.activo = 1
       JOIN roles_permisos rp ON rp.id_rol = r.id_rol
       JOIN permisos p ON p.id_permiso = rp.id_permiso
       WHERE ur.id_usuario = ?
       ORDER BY p.nombre`,
    )
    .bind(idUsuario)
    .all();

  return (results ?? []).map((fila) => fila.nombre);
}

async function manejarDatos(solicitud, env, usuario, accion) {
  if (solicitud.method !== "POST") {
    return responderJson({ correcto: false, mensaje: "Metodo no permitido." }, 405);
  }

  const cuerpo = await leerJson(solicitud);
  const tabla = validarTabla(cuerpo.tabla);

  if (accion === "listar") {
    exigirPermisoTabla(usuario, tabla, "leer");
    const resultado = await listarRegistrosD1(env.DB, cuerpo);
    return responderJson({ correcto: true, datos: resultado });
  }

  if (accion === "seleccionar") {
    exigirPermisoTabla(usuario, tabla, "leer");
    const filas = await seleccionarRegistrosD1(env.DB, cuerpo);
    return responderJson({ correcto: true, datos: filas });
  }

  if (accion === "obtener") {
    exigirPermisoTabla(usuario, tabla, "leer");
    const fila = await obtenerRegistroD1(env.DB, cuerpo);
    return responderJson({ correcto: true, datos: fila });
  }

  if (accion === "crear") {
    exigirPermisoTabla(usuario, tabla, "escribir");
    const filas = await insertarRegistrosD1(env.DB, tabla, cuerpo.datos, usuario);
    return responderJson({ correcto: true, datos: Array.isArray(cuerpo.datos) ? filas : (filas[0] ?? null) });
  }

  if (accion === "actualizar") {
    exigirPermisoTabla(usuario, tabla, "escribir");
    const fila = await actualizarRegistroD1(env.DB, tabla, cuerpo.columnaId, cuerpo.id, cuerpo.datos, usuario);
    return responderJson({ correcto: true, datos: fila });
  }

  if (accion === "eliminar") {
    exigirPermisoTabla(usuario, tabla, "escribir");
    await eliminarRegistroD1(env.DB, tabla, cuerpo.columnaId, cuerpo.id);
    return responderJson({ correcto: true });
  }

  return responderJson({ correcto: false, mensaje: "Accion de datos no encontrada." }, 404);
}

async function manejarFuncion(solicitud, env, usuario, nombreFuncion) {
  if (solicitud.method !== "POST") {
    return responderJson({ correcto: false, mensaje: "Metodo no permitido." }, 405);
  }

  const cuerpo = await leerJson(solicitud);

  if (nombreFuncion === "recalcular-asistencia") {
    exigirPermiso(usuario, ["asistencia.recalcular"]);
    const resultado = await recalcularAsistencia(env.DB, usuario, cuerpo);
    return responderJson({ correcto: true, datos: resultado });
  }

  if (nombreFuncion === "obtener-horario-vigente") {
    exigirPermiso(usuario, ["horarios.gestionar", "asistencia.ver"]);
    const idHorario = await obtenerHorarioVigenteDB(env.DB, cuerpo.id_funcionario, cuerpo.fecha);
    return responderJson({ correcto: true, datos: idHorario });
  }

  if (nombreFuncion === "crear-usuario") {
    exigirPermiso(usuario, ["usuarios.gestionar"]);
    const creado = await crearUsuario(env.DB, usuario, cuerpo);
    return responderJson({ correcto: true, datos: creado });
  }

  if (nombreFuncion === "actualizar-usuario") {
    exigirPermiso(usuario, ["usuarios.gestionar"]);
    const actualizado = await actualizarUsuario(env.DB, usuario, cuerpo);
    return responderJson({ correcto: true, datos: actualizado });
  }

  if (nombreFuncion === "desactivar-usuario") {
    exigirPermiso(usuario, ["usuarios.gestionar"]);
    await env.DB.prepare("UPDATE perfiles SET estado = 'INACTIVO', fecha_actualizacion = ? WHERE id_usuario = ?")
      .bind(new Date().toISOString(), cuerpo.id_usuario)
      .run();
    await env.DB.prepare("DELETE FROM sesiones WHERE id_usuario = ?").bind(cuerpo.id_usuario).run();
    return responderJson({ correcto: true });
  }

  if (nombreFuncion === "asignar-rol") {
    exigirPermiso(usuario, ["roles.gestionar", "usuarios.gestionar"]);
    await env.DB.prepare(
      "INSERT OR IGNORE INTO usuarios_roles (id_usuario, id_rol, creado_por) VALUES (?, ?, ?)",
    )
      .bind(cuerpo.id_usuario, cuerpo.id_rol, usuario.id_usuario)
      .run();
    return responderJson({ correcto: true });
  }

  if (nombreFuncion === "revertir-importacion") {
    return responderJson(
      {
        correcto: false,
        mensaje:
          "El rollback destructivo queda pendiente de habilitacion explicita para evitar borrar asistencia calculada por accidente.",
      },
      409,
    );
  }

  return responderJson({ correcto: false, mensaje: "Funcion no encontrada." }, 404);
}

async function listarRegistrosD1(db, opciones = {}) {
  const tabla = validarTabla(opciones.tabla);
  const meta = METADATOS_TABLAS[tabla];
  const pagina = Math.max(1, Number(opciones.pagina ?? 1));
  const tamanoPagina = Math.min(500, Math.max(1, Number(opciones.tamanoPagina ?? 20)));
  const offset = (pagina - 1) * tamanoPagina;
  const orden = validarColumna(tabla, opciones.orden ?? meta.pk ?? "fecha_creacion");
  const ascendente = opciones.ascendente !== false;
  const where = construirWhere(tabla, opciones);
  const total = await obtenerValor(
    db,
    `SELECT COUNT(*) AS total FROM ${tabla}${where.sql}`,
    where.parametros,
  );
  const filas = await consultarFilas(
    db,
    `SELECT * FROM ${tabla}${where.sql} ORDER BY ${orden} ${ascendente ? "ASC" : "DESC"} LIMIT ? OFFSET ?`,
    [...where.parametros, tamanoPagina, offset],
    tabla,
    opciones.columnas,
  );

  return {
    filas,
    total: Number(total ?? 0),
  };
}

async function seleccionarRegistrosD1(db, opciones = {}) {
  const tabla = validarTabla(opciones.tabla);
  const meta = METADATOS_TABLAS[tabla];
  const filtroGrande = obtenerFiltroInGrande(opciones);

  if (filtroGrande) {
    return seleccionarRegistrosD1EnLotes(db, opciones, filtroGrande);
  }

  const where = construirWhere(tabla, opciones);
  const orden = opciones.orden ? validarColumna(tabla, opciones.orden) : meta.pk;
  const limite = opciones.limite ? Math.min(1000, Math.max(1, Number(opciones.limite))) : null;
  const sql = [
    `SELECT * FROM ${tabla}${where.sql}`,
    orden ? `ORDER BY ${orden} ${opciones.ascendente === false ? "DESC" : "ASC"}` : "",
    limite ? "LIMIT ?" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const parametros = limite ? [...where.parametros, limite] : where.parametros;
  const filas = await consultarFilas(db, sql, parametros, tabla, opciones.columnas);

  if (opciones.single || opciones.maybeSingle) {
    return filas[0] ?? null;
  }

  return filas;
}

async function seleccionarRegistrosD1EnLotes(db, opciones, [columna, valores]) {
  const tabla = validarTabla(opciones.tabla);
  const lista = Array.isArray(valores)
    ? [...new Set(valores.filter((valor) => valor !== undefined))]
    : [];
  const filas = [];

  for (let indice = 0; indice < lista.length; indice += LIMITE_VARIABLES_SQL_D1) {
    const filtrosIn = {
      ...(opciones.filtrosIn ?? {}),
      [columna]: lista.slice(indice, indice + LIMITE_VARIABLES_SQL_D1),
    };
    const lote = await seleccionarRegistrosD1(db, {
      ...opciones,
      filtrosIn,
      limite: null,
      single: false,
      maybeSingle: false,
    });
    filas.push(...lote);
  }

  const filasUnicas = quitarFilasDuplicadas(tabla, filas);
  const orden = opciones.orden
    ? validarColumna(tabla, opciones.orden)
    : METADATOS_TABLAS[tabla].pk;
  ordenarFilasEnMemoria(filasUnicas, orden, opciones.ascendente !== false);

  const limite = opciones.limite ? Math.min(1000, Math.max(1, Number(opciones.limite))) : null;
  const salida = limite ? filasUnicas.slice(0, limite) : filasUnicas;

  if (opciones.single || opciones.maybeSingle) {
    return salida[0] ?? null;
  }

  return salida;
}

function obtenerFiltroInGrande(opciones = {}) {
  return Object.entries(opciones.filtrosIn ?? {}).find(([, valores]) => {
    const lista = Array.isArray(valores) ? valores.filter((valor) => valor !== undefined) : [];
    return lista.length > LIMITE_VARIABLES_SQL_D1;
  });
}

function quitarFilasDuplicadas(tabla, filas) {
  const pk = METADATOS_TABLAS[tabla].pk;

  if (!pk) {
    return filas;
  }

  const vistas = new Set();
  return filas.filter((fila) => {
    const clave = fila?.[pk];

    if (!clave || vistas.has(clave)) {
      return false;
    }

    vistas.add(clave);
    return true;
  });
}

function ordenarFilasEnMemoria(filas, columna, ascendente = true) {
  if (!columna) {
    return filas;
  }

  filas.sort((a, b) => {
    const valorA = a?.[columna] ?? "";
    const valorB = b?.[columna] ?? "";

    if (typeof valorA === "number" && typeof valorB === "number") {
      return ascendente ? valorA - valorB : valorB - valorA;
    }

    return ascendente
      ? String(valorA).localeCompare(String(valorB), "es")
      : String(valorB).localeCompare(String(valorA), "es");
  });

  return filas;
}

async function obtenerRegistroD1(db, opciones = {}) {
  const tabla = validarTabla(opciones.tabla);
  const columnaId = validarColumna(tabla, opciones.columnaId ?? METADATOS_TABLAS[tabla].pk);
  const filas = await consultarFilas(
    db,
    `SELECT * FROM ${tabla} WHERE ${columnaId} = ? LIMIT 1`,
    [opciones.id],
    tabla,
    opciones.columnas,
  );

  return filas[0] ?? null;
}

async function insertarRegistrosD1(db, tabla, datos, usuario) {
  const registros = (Array.isArray(datos) ? datos : [datos]).map((fila) =>
    prepararFilaEntrada(tabla, fila, usuario, "crear"),
  );

  if (registros.length > TAMANO_MAXIMO_LOTE) {
    throw crearError(`El lote supera ${TAMANO_MAXIMO_LOTE} filas.`, 422);
  }

  if (!registros.length) {
    return [];
  }

  const sentencias = registros.map((registro) => {
    const columnas = Object.keys(registro);
    const placeholders = columnas.map(() => "?").join(", ");
    const sql = `INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES (${placeholders})`;
    return db.prepare(sql).bind(...columnas.map((columna) => registro[columna]));
  });

  await db.batch(sentencias);

  const meta = METADATOS_TABLAS[tabla];
  if (!meta.pk) {
    return registros.map((registro) => normalizarSalida(tabla, registro));
  }

  const ids = registros.map((registro) => registro[meta.pk]).filter(Boolean);
  return seleccionarRegistrosD1(db, {
    tabla,
    filtrosIn: { [meta.pk]: ids },
    columnas: "*",
  });
}

async function actualizarRegistroD1(db, tabla, columnaId, id, datos, usuario) {
  const columna = validarColumna(tabla, columnaId ?? METADATOS_TABLAS[tabla].pk);
  const registro = prepararFilaEntrada(tabla, datos, usuario, "actualizar");
  delete registro[METADATOS_TABLAS[tabla].pk];

  const columnas = Object.keys(registro);
  if (!columnas.length) {
    return obtenerRegistroD1(db, { tabla, columnaId: columna, id });
  }

  const asignaciones = columnas.map((item) => `${item} = ?`).join(", ");
  await db
    .prepare(`UPDATE ${tabla} SET ${asignaciones} WHERE ${columna} = ?`)
    .bind(...columnas.map((item) => registro[item]), id)
    .run();

  return obtenerRegistroD1(db, { tabla, columnaId: columna, id });
}

async function eliminarRegistroD1(db, tabla, columnaId, id) {
  const columna = validarColumna(tabla, columnaId ?? METADATOS_TABLAS[tabla].pk);
  await db.prepare(`DELETE FROM ${tabla} WHERE ${columna} = ?`).bind(id).run();
}

function construirWhere(tabla, opciones = {}) {
  const condiciones = [];
  const parametros = [];

  Object.entries(opciones.filtros ?? {}).forEach(([columna, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      condiciones.push(`${validarColumna(tabla, columna)} = ?`);
      parametros.push(prepararValorFiltro(tabla, columna, valor));
    }
  });

  Object.entries(opciones.filtrosIn ?? {}).forEach(([columna, valores]) => {
    const lista = Array.isArray(valores) ? valores.filter((valor) => valor !== undefined) : [];
    const columnaSql = validarColumna(tabla, columna);

    if (!lista.length) {
      condiciones.push("1 = 0");
      return;
    }

    condiciones.push(`${columnaSql} IN (${lista.map(() => "?").join(", ")})`);
    parametros.push(...lista.map((valor) => prepararValorFiltro(tabla, columna, valor)));
  });

  Object.entries(opciones.filtrosGte ?? {}).forEach(([columna, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      condiciones.push(`${validarColumna(tabla, columna)} >= ?`);
      parametros.push(valor);
    }
  });

  Object.entries(opciones.filtrosLte ?? {}).forEach(([columna, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      condiciones.push(`${validarColumna(tabla, columna)} <= ?`);
      parametros.push(valor);
    }
  });

  (opciones.notNull ?? []).forEach((columna) => {
    condiciones.push(`${validarColumna(tabla, columna)} IS NOT NULL`);
  });

  if (opciones.busqueda && opciones.columnasBusqueda?.length) {
    const texto = `%${String(opciones.busqueda).toLowerCase()}%`;
    const partes = opciones.columnasBusqueda.map((columna) => {
      parametros.push(texto);
      return `LOWER(COALESCE(${validarColumna(tabla, columna)}, '')) LIKE ?`;
    });
    condiciones.push(`(${partes.join(" OR ")})`);
  }

  return {
    sql: condiciones.length ? ` WHERE ${condiciones.join(" AND ")}` : "",
    parametros,
  };
}

async function consultarFilas(db, sql, parametros, tabla, columnasSolicitadas = "*") {
  const consulta = db.prepare(sql);
  const { results } = parametros.length ? await consulta.bind(...parametros).all() : await consulta.all();
  const filas = (results ?? []).map((fila) => normalizarSalida(tabla, fila));
  return expandirRelaciones(db, tabla, filas, columnasSolicitadas);
}

async function expandirRelaciones(db, tabla, filas, columnasSolicitadas = "") {
  if (!filas.length) {
    return filas;
  }

  const columnas = String(columnasSolicitadas ?? "");

  if (tabla === "funcionarios") {
    if (columnas.includes("cargos")) {
      const cargos = await mapaPorId(db, "cargos", "id_cargo", filas.map((fila) => fila.id_cargo));
      filas.forEach((fila) => {
        fila.cargos = fila.id_cargo ? cargos.get(fila.id_cargo) ?? null : null;
      });
    }

    if (columnas.includes("unidades")) {
      const unidades = await mapaPorId(db, "unidades", "id_unidad", filas.map((fila) => fila.id_unidad));
      filas.forEach((fila) => {
        fila.unidades = fila.id_unidad ? unidades.get(fila.id_unidad) ?? null : null;
      });
    }
  }

  if (tabla === "plantillas_horario" && columnas.includes("reglas_dia_horario")) {
    const reglas = await seleccionarRegistrosD1(db, {
      tabla: "reglas_dia_horario",
      filtrosIn: { id_horario: filas.map((fila) => fila.id_horario) },
      orden: "dia_semana",
      ascendente: true,
      columnas: columnas.includes("marcaciones_esperadas") ? "marcaciones_esperadas" : "*",
    });
    const porHorario = agrupar(reglas, "id_horario");
    filas.forEach((fila) => {
      fila.reglas_dia_horario = porHorario.get(fila.id_horario) ?? [];
    });
  }

  if (tabla === "reglas_dia_horario" && columnas.includes("marcaciones_esperadas")) {
    const marcaciones = await seleccionarRegistrosD1(db, {
      tabla: "marcaciones_esperadas",
      filtrosIn: { id_regla: filas.map((fila) => fila.id_regla) },
      orden: "orden",
      ascendente: true,
    });
    const porRegla = agrupar(marcaciones, "id_regla");
    filas.forEach((fila) => {
      fila.marcaciones_esperadas = porRegla.get(fila.id_regla) ?? [];
    });
  }

  if (["excepciones_funcionario", "registros_horas_extra"].includes(tabla) && columnas.includes("funcionarios")) {
    const funcionarios = await mapaPorId(
      db,
      "funcionarios",
      "id_funcionario",
      filas.map((fila) => fila.id_funcionario),
    );
    filas.forEach((fila) => {
      fila.funcionarios = funcionarios.get(fila.id_funcionario) ?? null;
    });
  }

  if (tabla === "importaciones_excel" && columnas.includes("unidades")) {
    const unidades = await mapaPorId(db, "unidades", "id_unidad", filas.map((fila) => fila.id_unidad));
    filas.forEach((fila) => {
      fila.unidades = unidades.get(fila.id_unidad) ?? null;
    });
  }

  if (tabla === "asistencias_diarias" && columnas.includes("resultados_marcaciones")) {
    const resultados = await seleccionarRegistrosD1(db, {
      tabla: "resultados_marcaciones",
      filtrosIn: { id_asistencia: filas.map((fila) => fila.id_asistencia) },
      orden: "fecha_creacion",
      ascendente: true,
      columnas: columnas.includes("marcaciones_esperadas") ? "marcaciones_esperadas" : "*",
    });
    const porAsistencia = agrupar(resultados, "id_asistencia");
    filas.forEach((fila) => {
      fila.resultados_marcaciones = (porAsistencia.get(fila.id_asistencia) ?? []).sort(
        (a, b) => Number(a.marcaciones_esperadas?.orden ?? 0) - Number(b.marcaciones_esperadas?.orden ?? 0),
      );
    });
  }

  if (tabla === "resultados_marcaciones" && columnas.includes("marcaciones_esperadas")) {
    const marcaciones = await mapaPorId(
      db,
      "marcaciones_esperadas",
      "id_marcacion_esperada",
      filas.map((fila) => fila.id_marcacion_esperada),
    );
    filas.forEach((fila) => {
      fila.marcaciones_esperadas = marcaciones.get(fila.id_marcacion_esperada) ?? null;
    });
  }

  return filas;
}

async function mapaPorId(db, tabla, columna, valores) {
  const ids = [...new Set((valores ?? []).filter(Boolean))];

  if (!ids.length) {
    return new Map();
  }

  const filas = await seleccionarRegistrosD1(db, {
    tabla,
    filtrosIn: { [columna]: ids },
    limite: ids.length,
  });
  return new Map(filas.map((fila) => [fila[columna], fila]));
}

function prepararFilaEntrada(tabla, fila, usuario, modo) {
  const meta = METADATOS_TABLAS[tabla];
  const ahora = new Date().toISOString();
  const datos = {};

  Object.entries(fila ?? {}).forEach(([columna, valor]) => {
    if (!meta.columnas.includes(columna) || meta.ocultas?.includes(columna)) {
      return;
    }

    if (valor === undefined) {
      return;
    }

    datos[columna] = prepararValorEntrada(tabla, columna, valor);
  });

  if (modo === "crear" && meta.pk && !datos[meta.pk]) {
    datos[meta.pk] = crypto.randomUUID();
  }

  if (modo === "crear" && meta.columnas.includes("creado_por") && !datos.creado_por) {
    datos.creado_por = usuario?.id_usuario ?? null;
  }

  if (modo === "actualizar" && meta.columnas.includes("actualizado_por")) {
    datos.actualizado_por = usuario?.id_usuario ?? null;
  }

  if (meta.columnas.includes("fecha_actualizacion")) {
    datos.fecha_actualizacion = ahora;
  }

  if (modo === "crear" && meta.columnas.includes("fecha_creacion") && !datos.fecha_creacion) {
    datos.fecha_creacion = ahora;
  }

  return datos;
}

function prepararValorEntrada(tabla, columna, valor) {
  const meta = METADATOS_TABLAS[tabla];

  if (valor === "") {
    return null;
  }

  if (meta.booleanas?.includes(columna)) {
    return valor === true || valor === 1 || valor === "true" ? 1 : 0;
  }

  if (meta.json?.includes(columna)) {
    return typeof valor === "string" ? valor : JSON.stringify(valor ?? {});
  }

  return valor;
}

function prepararValorFiltro(tabla, columna, valor) {
  const meta = METADATOS_TABLAS[tabla];

  if (meta.booleanas?.includes(columna)) {
    return valor === true || valor === 1 || valor === "true" ? 1 : 0;
  }

  return valor;
}

function normalizarSalida(tabla, fila) {
  const meta = METADATOS_TABLAS[tabla];
  const salida = {};

  Object.entries(fila ?? {}).forEach(([columna, valor]) => {
    if (meta.ocultas?.includes(columna)) {
      return;
    }

    if (meta.booleanas?.includes(columna)) {
      salida[columna] = Boolean(valor);
      return;
    }

    if (meta.json?.includes(columna)) {
      salida[columna] = parsearJsonSeguro(valor);
      return;
    }

    salida[columna] = valor;
  });

  return salida;
}

async function recalcularAsistencia(
  db,
  usuario,
  { id_importacion, ids_funcionarios = [], finalizar = true } = {},
) {
  if (!id_importacion) {
    throw crearError("El ID de importacion es obligatorio.", 422);
  }

  const importacion = await seleccionarRegistrosD1(db, {
    tabla: "importaciones_excel",
    filtros: { id_importacion },
    single: true,
  });

  if (!importacion) {
    throw crearError("La importacion no existe.", 404);
  }

  const idsFuncionarios = Array.isArray(ids_funcionarios)
    ? ids_funcionarios.map((id) => String(id ?? "").trim()).filter(Boolean).slice(0, 100)
    : [];
  const funcionarios = await seleccionarRegistrosD1(db, {
    tabla: "funcionarios",
    filtros: { id_unidad: importacion.id_unidad, estado: "ACTIVO" },
    filtrosIn: idsFuncionarios.length ? { id_funcionario: idsFuncionarios } : {},
    orden: "id_funcionario",
    limite: idsFuncionarios.length || 1000,
  });
  const marcaciones = await seleccionarRegistrosD1(db, {
    tabla: "marcaciones_originales",
    filtros: { id_importacion },
    filtrosIn: idsFuncionarios.length ? { id_funcionario: idsFuncionarios } : {},
    notNull: ["id_funcionario"],
    limite: 50000,
  });
  const horarios = await listarHorariosCompletos(db);
  const feriados = await seleccionarRegistrosD1(db, {
    tabla: "feriados",
    filtrosGte: { fecha: importacion.fecha_minima },
    filtrosLte: { fecha: importacion.fecha_maxima },
    limite: 1000,
  });
  const excepciones = await seleccionarRegistrosD1(db, {
    tabla: "excepciones_funcionario",
    filtrosLte: { fecha_desde: importacion.fecha_maxima },
    filtrosGte: { fecha_hasta: importacion.fecha_minima },
    limite: 5000,
  });
  const asignaciones = await seleccionarRegistrosD1(db, {
    tabla: "asignaciones_horario_funcionario",
    filtros: { activo: true },
    filtrosIn: funcionarios.length
      ? { id_funcionario: funcionarios.map((funcionario) => funcionario.id_funcionario) }
      : {},
    filtrosLte: { fecha_desde: importacion.fecha_maxima },
    limite: 5000,
    orden: "prioridad",
    ascendente: true,
  });
  let horasExtra = await seleccionarRegistrosD1(db, {
    tabla: "registros_horas_extra",
    filtrosGte: { fecha_aplicacion: importacion.fecha_minima },
    filtrosLte: { fecha_aplicacion: importacion.fecha_maxima },
    limite: 5000,
  });

  const fechas = crearRangoFechas(importacion.fecha_minima, importacion.fecha_maxima);
  let calculados = 0;

  for (const funcionario of funcionarios) {
    for (const fecha of fechas) {
      const idHorario = await obtenerHorarioVigenteDB(db, funcionario.id_funcionario, fecha, {
        funcionario,
        horarios,
        asignaciones,
      });
      const horario = horarios.find((item) => item.id_horario === idHorario);
      const marcacionesDia = marcaciones
        .filter(
          (item) =>
            item.id_funcionario === funcionario.id_funcionario &&
            (item.fecha_marcacion.slice(0, 10) === fecha ||
              item.fecha_marcacion.slice(0, 10) === sumarDias(fecha, 1)),
        )
        .map((item) => ({
          ...item,
          fecha: item.fecha_marcacion.slice(0, 10),
          hora: item.fecha_marcacion.slice(11, 16),
        }));
      const resultado = calcularAsistenciaDiaria({
        fecha,
        horario,
        marcaciones: marcacionesDia,
        feriados,
        excepciones: excepciones.filter((item) => item.id_funcionario === funcionario.id_funcionario),
        horasExtra: horasExtra.filter((item) => item.id_funcionario === funcionario.id_funcionario),
      });
      const asistencia = await upsertAsistencia(db, usuario, funcionario, fecha, idHorario, resultado);

      await db
        .prepare("DELETE FROM resultados_marcaciones WHERE id_asistencia = ?")
        .bind(asistencia.id_asistencia)
        .run();

      if (resultado.resultados.length) {
        await insertarRegistrosD1(
          db,
          "resultados_marcaciones",
          resultado.resultados.map((item) => ({
            id_asistencia: asistencia.id_asistencia,
            id_marcacion_esperada: item.id_marcacion_esperada,
            id_marcacion: item.marcacion?.id_marcacion ?? null,
            tipo: item.tipo,
            estado: item.estado,
            hora_objetivo: item.hora_objetivo,
            fecha_marcacion: item.fecha_marcacion
              ? `${item.fecha_marcacion} ${item.hora_marcacion ?? "00:00"}`
              : null,
            minutos_atraso: item.minutos_atraso,
            explicacion: item.explicacion,
          })),
          usuario,
        );
      }

      horasExtra = await sincronizarHoraExtraAutomatica(db, usuario, funcionario, fecha, resultado, horasExtra);
      calculados += 1;
    }
  }

  if (finalizar) {
    await actualizarRegistroD1(
      db,
      "importaciones_excel",
      "id_importacion",
      id_importacion,
      { estado: "COMPLETADO", resumen: { asistencias_calculadas: calculados } },
      usuario,
    );
    await registrarAuditoria(db, usuario, "recalcular_asistencia", "importaciones_excel", id_importacion, {
      asistencias_calculadas: calculados,
    });
  } else {
    await registrarAuditoria(db, usuario, "recalcular_asistencia_lote", "importaciones_excel", id_importacion, {
      asistencias_calculadas: calculados,
      funcionarios_calculados: funcionarios.length,
    });
  }

  return {
    correcto: true,
    mensaje: "La asistencia fue recalculada correctamente.",
    asistencias_calculadas: calculados,
    funcionarios_calculados: funcionarios.length,
    lote: idsFuncionarios.length > 0,
  };
}

async function upsertAsistencia(db, usuario, funcionario, fecha, idHorario, resultado) {
  const idAsistencia = crypto.randomUUID();
  const ahora = new Date().toISOString();
  const fila = await db
    .prepare(
      `INSERT INTO asistencias_diarias (
        id_asistencia, id_funcionario, id_horario, fecha, estado, minutos_atraso,
        cantidad_atrasos, cantidad_omisiones, cantidad_faltas, minutos_hora_extra,
        tolerancia_horas_extra, explicacion, recalculado_por, fecha_recalculo,
        fecha_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id_funcionario, fecha) DO UPDATE SET
        id_horario = excluded.id_horario,
        estado = excluded.estado,
        minutos_atraso = excluded.minutos_atraso,
        cantidad_atrasos = excluded.cantidad_atrasos,
        cantidad_omisiones = excluded.cantidad_omisiones,
        cantidad_faltas = excluded.cantidad_faltas,
        minutos_hora_extra = excluded.minutos_hora_extra,
        tolerancia_horas_extra = excluded.tolerancia_horas_extra,
        explicacion = excluded.explicacion,
        recalculado_por = excluded.recalculado_por,
        fecha_recalculo = excluded.fecha_recalculo,
        fecha_actualizacion = excluded.fecha_actualizacion
      RETURNING *`,
    )
    .bind(
      idAsistencia,
      funcionario.id_funcionario,
      idHorario,
      fecha,
      resultado.estado,
      resultado.minutos_atraso,
      resultado.cantidad_atrasos,
      resultado.cantidad_omisiones,
      resultado.cantidad_faltas,
      resultado.minutos_hora_extra,
      resultado.tolerancia_horas_extra,
      JSON.stringify({ resumen: resultado.explicacion }),
      usuario.id_usuario,
      ahora,
      ahora,
      ahora,
    )
    .first();

  return normalizarSalida("asistencias_diarias", fila);
}

async function listarHorariosCompletos(db) {
  const horarios = await seleccionarRegistrosD1(db, {
    tabla: "plantillas_horario",
    filtros: { activo: true },
    limite: 1000,
    columnas: "reglas_dia_horario(marcaciones_esperadas)",
  });

  return horarios.map((horario) => ({
    ...horario,
    reglas: (horario.reglas_dia_horario ?? []).map((regla) => ({
      ...regla,
      marcaciones_esperadas: regla.marcaciones_esperadas ?? [],
    })),
  }));
}

async function obtenerHorarioVigenteDB(db, idFuncionario, fecha, cache = {}) {
  const funcionario =
    cache.funcionario ??
    (await seleccionarRegistrosD1(db, {
      tabla: "funcionarios",
      filtros: { id_funcionario: idFuncionario },
      single: true,
    }));

  if (!funcionario) {
    return null;
  }

  const asignacion =
    cache.asignaciones?.filter(
      (item) =>
        item.id_funcionario === idFuncionario &&
        item.activo &&
        (!item.fecha_desde || item.fecha_desde <= fecha),
    ) ??
    (await seleccionarRegistrosD1(db, {
      tabla: "asignaciones_horario_funcionario",
      filtros: { id_funcionario: idFuncionario, activo: true },
      filtrosLte: { fecha_desde: fecha },
      limite: 20,
      orden: "prioridad",
      ascendente: true,
    }));
  const asignacionVigente = asignacion
    .filter((item) => !item.fecha_hasta || item.fecha_hasta >= fecha)
    .sort((a, b) => a.prioridad - b.prioridad || String(b.fecha_desde).localeCompare(a.fecha_desde))[0];

  if (asignacionVigente) {
    return asignacionVigente.id_horario;
  }

  const horarios = cache.horarios ?? (await listarHorariosCompletos(db));
  const porUnidad = horarios.find(
    (horario) =>
      horario.activo &&
      horario.alcance === "UNIDAD" &&
      horario.id_unidad &&
      horario.id_unidad === funcionario.id_unidad,
  );

  if (porUnidad) {
    return porUnidad.id_horario;
  }

  return horarios.find((horario) => horario.activo && horario.alcance === "GENERAL")?.id_horario ?? null;
}

async function sincronizarHoraExtraAutomatica(db, usuario, funcionario, fecha, resultado, horasExtra) {
  const minutosHoraExtra = Number(resultado.minutos_hora_extra ?? 0);
  const fechaAplicacion = sumarDias(fecha, 1);
  const detalleCalculo = {
    fecha_hora_extra: fecha,
    fecha_aplicacion: fechaAplicacion,
    minutos_hora_extra: minutosHoraExtra,
    minutos_minimos: MINUTOS_MINIMOS_HORA_EXTRA_AUTOMATICA,
    minutos_tolerancia: MINUTOS_TOLERANCIA_HORA_EXTRA,
    regla: "Salida posterior al horario; tolerancia solo el dia calendario siguiente.",
  };
  const existente = await seleccionarRegistrosD1(db, {
    tabla: "registros_horas_extra",
    filtros: {
      id_funcionario: funcionario.id_funcionario,
      fecha_hora_extra: fecha,
      fecha_aplicacion: fechaAplicacion,
      origen: "AUTOMATICO",
    },
    single: true,
  });

  if (minutosHoraExtra < MINUTOS_MINIMOS_HORA_EXTRA_AUTOMATICA) {
    if (existente?.id_hora_extra) {
      await actualizarRegistroD1(
        db,
        "registros_horas_extra",
        "id_hora_extra",
        existente.id_hora_extra,
        {
          aprobado: false,
          estado: "RECHAZADO",
          motivo: "Recalculo automatico: la salida posterior al horario no alcanza media hora.",
          detalle_calculo: detalleCalculo,
        },
        usuario,
      );
    }

    return horasExtra.filter(
      (registro) =>
        !(
          registro.id_funcionario === funcionario.id_funcionario &&
          registro.fecha_hora_extra === fecha &&
          registro.fecha_aplicacion === fechaAplicacion &&
          registro.origen === "AUTOMATICO"
        ),
    );
  }

  const datos = {
    id_funcionario: funcionario.id_funcionario,
    fecha_hora_extra: fecha,
    minutos_trabajados: minutosHoraExtra,
    aprobado: true,
    minutos_tolerancia_otorgados: MINUTOS_TOLERANCIA_HORA_EXTRA,
    trasladar_siguiente_laboral: false,
    fecha_aplicacion: fechaAplicacion,
    fecha_aprobacion: new Date().toISOString(),
    aprobado_por: usuario.id_usuario,
    motivo:
      "Generado automaticamente por salida posterior al horario. Tolerancia valida solo al dia siguiente.",
    estado: "APROBADO",
    creado_por: usuario.id_usuario,
    origen: "AUTOMATICO",
    detalle_calculo: detalleCalculo,
  };
  const guardado = existente?.id_hora_extra
    ? await actualizarRegistroD1(db, "registros_horas_extra", "id_hora_extra", existente.id_hora_extra, datos, usuario)
    : (await insertarRegistrosD1(db, "registros_horas_extra", datos, usuario))[0];

  return [
    ...horasExtra.filter(
      (registro) =>
        !(
          registro.id_funcionario === funcionario.id_funcionario &&
          registro.fecha_hora_extra === fecha &&
          registro.fecha_aplicacion === fechaAplicacion &&
          registro.origen === "AUTOMATICO"
        ),
    ),
    guardado,
  ];
}

async function crearUsuario(db, usuarioActual, datos) {
  const correo = normalizarCorreo(datos.correo);
  const contrasena = String(datos.contrasena ?? crypto.randomUUID()).slice(0, 24);
  validarCredencialesUsuario(correo, contrasena);
  const usuario = await crearPerfilConContrasena(db, {
    correo,
    contrasena,
    nombre_mostrado: datos.nombre_mostrado ?? correo,
    estado: datos.estado ?? "ACTIVO",
  });

  if (datos.id_rol) {
    await db
      .prepare("INSERT OR IGNORE INTO usuarios_roles (id_usuario, id_rol, creado_por) VALUES (?, ?, ?)")
      .bind(usuario.id_usuario, datos.id_rol, usuarioActual.id_usuario)
      .run();
  }

  await registrarAuditoria(db, usuarioActual, "crear_usuario", "perfiles", usuario.id_usuario, { correo });
  return usuario;
}

async function actualizarUsuario(db, usuarioActual, datos) {
  const idUsuario = datos.id_usuario;
  const cambios = {};

  if (datos.correo) {
    cambios.correo = normalizarCorreo(datos.correo);
  }

  if (datos.nombre_mostrado !== undefined) {
    cambios.nombre_mostrado = datos.nombre_mostrado;
  }

  if (datos.estado) {
    cambios.estado = datos.estado;
  }

  if (datos.contrasena) {
    const hash = await hashContrasena(datos.contrasena);
    cambios.contrasena_hash = hash.hash;
    cambios.contrasena_salt = hash.salt;
  }

  const columnas = Object.keys(cambios);
  if (columnas.length) {
    cambios.fecha_actualizacion = new Date().toISOString();
    await db
      .prepare(`UPDATE perfiles SET ${Object.keys(cambios).map((columna) => `${columna} = ?`).join(", ")} WHERE id_usuario = ?`)
      .bind(...Object.values(cambios), idUsuario)
      .run();
  }

  await registrarAuditoria(db, usuarioActual, "actualizar_usuario", "perfiles", idUsuario, {
    campos: columnas,
  });
  return construirUsuarioActual(db, idUsuario);
}

async function crearPerfilConContrasena(db, { correo, contrasena, nombre_mostrado, estado = "ACTIVO" }) {
  const idUsuario = crypto.randomUUID();
  const hash = await hashContrasena(contrasena);
  const perfil = {
    id_perfil: crypto.randomUUID(),
    id_usuario: idUsuario,
    correo,
    nombre_mostrado,
    contrasena_hash: hash.hash,
    contrasena_salt: hash.salt,
    estado,
  };
  await db
    .prepare(
      `INSERT INTO perfiles
       (id_perfil, id_usuario, correo, nombre_mostrado, contrasena_hash, contrasena_salt, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      perfil.id_perfil,
      perfil.id_usuario,
      perfil.correo,
      perfil.nombre_mostrado,
      perfil.contrasena_hash,
      perfil.contrasena_salt,
      perfil.estado,
    )
    .run();
  return perfil;
}

async function registrarAuditoria(db, usuario, accion, entidad, idEntidad, datosNuevos) {
  await db
    .prepare(
      `INSERT INTO registros_auditoria
       (id_auditoria, id_usuario, accion, entidad, id_entidad, datos_nuevos)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      usuario?.id_usuario ?? null,
      accion,
      entidad,
      idEntidad ?? null,
      JSON.stringify(datosNuevos ?? {}),
    )
    .run();
}

async function hashContrasena(contrasena, salt = crearTokenSeguro(18)) {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(contrasena),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64UrlADatos(salt),
      iterations: ITERACIONES_PBKDF2,
    },
    clave,
    256,
  );

  return {
    salt,
    hash: datosABase64Url(new Uint8Array(bits)),
  };
}

async function verificarContrasena(contrasena, salt, hashEsperado) {
  if (!salt || !hashEsperado) {
    return false;
  }

  const { hash } = await hashContrasena(contrasena, salt);
  return comparacionConstante(hash, hashEsperado);
}

async function sha256Hex(texto) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function crearTokenSeguro(bytes = 32) {
  const datos = new Uint8Array(bytes);
  crypto.getRandomValues(datos);
  return datosABase64Url(datos);
}

function datosABase64Url(datos) {
  let binario = "";
  datos.forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlADatos(texto) {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(texto.length / 4) * 4, "=");
  const binario = atob(base64);
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
}

function comparacionConstante(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let diferencia = 0;
  for (let indice = 0; indice < a.length; indice += 1) {
    diferencia |= a.charCodeAt(indice) ^ b.charCodeAt(indice);
  }
  return diferencia === 0;
}

function construirCookieSesion(token, solicitud, env, { maxAge = DIAS_SESION * 24 * 60 * 60 } = {}) {
  const url = new URL(solicitud.url);
  const partes = [
    `${nombreCookieSesion(env)}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (url.protocol === "https:") {
    partes.push("Secure");
  }

  return partes.join("; ");
}

function nombreCookieSesion(env) {
  return env.SESSION_COOKIE_NAME || "gamu_sesion";
}

function obtenerCookie(solicitud, nombre) {
  const cabecera = solicitud.headers.get("Cookie") ?? "";
  return cabecera
    .split(";")
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${nombre}=`))
    ?.slice(nombre.length + 1);
}

async function leerJson(solicitud) {
  if (!solicitud.body) {
    return {};
  }

  return solicitud.json();
}

function responderJson(datos, estado = 200, cabeceras = {}) {
  return Response.json(datos, {
    status: estado,
    headers: cabeceras,
  });
}

async function obtenerValor(db, sql, parametros = []) {
  const consulta = db.prepare(sql);
  const fila = parametros.length ? await consulta.bind(...parametros).first() : await consulta.first();
  return fila ? Object.values(fila)[0] : null;
}

function validarTabla(tabla) {
  if (!METADATOS_TABLAS[tabla]) {
    throw crearError(`Tabla no permitida: ${tabla}.`, 422);
  }

  return tabla;
}

function validarColumna(tabla, columna) {
  const meta = METADATOS_TABLAS[tabla];

  if (!meta?.columnas.includes(columna)) {
    throw crearError(`Columna no permitida: ${tabla}.${columna}.`, 422);
  }

  return columna;
}

function exigirPermisoTabla(usuario, tabla, modo) {
  const permisos = modo === "leer" ? PERMISOS_LECTURA[tabla] : PERMISOS_ESCRITURA[tabla];
  exigirPermiso(usuario, permisos ?? []);
}

function exigirPermiso(usuario, permisos = []) {
  if (!permisos.length) {
    return;
  }

  if (!permisos.some((permiso) => usuario.permisos?.includes(permiso))) {
    throw crearError("Tu usuario no tiene permisos para realizar esta accion.", 403);
  }
}

function validarCredencialesUsuario(correo, contrasena) {
  if (!correo.includes("@")) {
    throw crearError("Ingresa un correo valido.", 422);
  }

  if (contrasena.length < 8) {
    throw crearError("La contrasena debe tener al menos 8 caracteres.", 422);
  }
}

function normalizarCorreo(correo) {
  return String(correo ?? "").trim().toLowerCase();
}

function parsearJsonSeguro(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor !== "string") {
    return valor;
  }

  try {
    return JSON.parse(valor);
  } catch {
    return valor;
  }
}

function agrupar(filas, columna) {
  return filas.reduce((mapa, fila) => {
    const clave = fila[columna];
    const grupo = mapa.get(clave) ?? [];
    grupo.push(fila);
    mapa.set(clave, grupo);
    return mapa;
  }, new Map());
}

function crearRangoFechas(inicio, fin) {
  const fechas = [];
  let actual = inicio;

  while (actual <= fin) {
    fechas.push(actual);
    actual = sumarDias(actual, 1);
  }

  return fechas;
}

function sumarDias(fecha, dias) {
  const objeto = new Date(`${fecha}T00:00:00`);
  objeto.setDate(objeto.getDate() + dias);
  return objeto.toISOString().slice(0, 10);
}

function crearError(mensaje, estadoHttp = 400) {
  const error = new Error(mensaje);
  error.estadoHttp = estadoHttp;
  return error;
}
