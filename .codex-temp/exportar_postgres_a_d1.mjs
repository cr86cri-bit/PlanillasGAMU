/* global process, console */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const SALIDA = path.resolve(".codex-temp", "d1-import");
const FILAS_POR_INSERT = 250;

const tablas = [
  {
    nombre: "unidades",
    columnas: ["id_unidad", "codigo", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion"],
  },
  {
    nombre: "cargos",
    columnas: ["id_cargo", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion"],
  },
  {
    nombre: "configuraciones_sistema",
    columnas: ["clave", "valor", "descripcion", "fecha_creacion", "fecha_actualizacion"],
    json: ["valor"],
  },
  {
    nombre: "plantillas_horario",
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
  },
  {
    nombre: "reglas_dia_horario",
    columnas: [
      "id_regla",
      "id_horario",
      "dia_semana",
      "es_laboral",
      "observacion",
      "fecha_creacion",
      "fecha_actualizacion",
    ],
  },
  {
    nombre: "marcaciones_esperadas",
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
  },
  {
    nombre: "funcionarios",
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
    anular: ["creado_por", "actualizado_por"],
  },
  {
    nombre: "asignaciones_horario_funcionario",
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
    anular: ["creado_por"],
  },
  {
    nombre: "feriados",
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
    anular: ["creado_por"],
  },
  {
    nombre: "excepciones_funcionario",
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
    anular: ["creado_por", "actualizado_por"],
  },
  {
    nombre: "registros_horas_extra",
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
    anular: ["aprobado_por", "creado_por"],
    json: ["detalle_calculo"],
  },
  {
    nombre: "periodos_asistencia",
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
  {
    nombre: "importaciones_excel",
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
    anular: ["creado_por"],
    json: ["resumen"],
  },
  {
    nombre: "marcaciones_originales",
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
  {
    nombre: "asistencias_diarias",
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
    anular: ["recalculado_por"],
    json: ["explicacion"],
  },
  {
    nombre: "resultados_marcaciones",
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
];

const ordenBorrado = [
  "resultados_marcaciones",
  "asistencias_diarias",
  "marcaciones_originales",
  "importaciones_excel",
  "periodos_asistencia",
  "registros_horas_extra",
  "excepciones_funcionario",
  "feriados",
  "asignaciones_horario_funcionario",
  "funcionarios",
  "marcaciones_esperadas",
  "reglas_dia_horario",
  "plantillas_horario",
  "cargos",
  "unidades",
];

function limpiarDirectorio() {
  fs.rmSync(SALIDA, { recursive: true, force: true });
  fs.mkdirSync(SALIDA, { recursive: true });
}

function valorSql(valor, { json = false } = {}) {
  if (valor === null || valor === undefined) {
    return "NULL";
  }

  if (typeof valor === "boolean") {
    return valor ? "1" : "0";
  }

  if (valor instanceof Date) {
    return textoSql(valor.toISOString());
  }

  if (json || typeof valor === "object") {
    return textoSql(JSON.stringify(valor));
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? String(valor) : "NULL";
  }

  return textoSql(String(valor));
}

function textoSql(texto) {
  return `'${texto.replaceAll("'", "''")}'`;
}

function filaValoresSql(tabla, fila) {
  const anuladas = new Set(tabla.anular ?? []);
  const json = new Set(tabla.json ?? []);
  return `(${tabla.columnas
    .map((columna) =>
      anuladas.has(columna) ? "NULL" : valorSql(fila[columna], { json: json.has(columna) }),
    )
    .join(",")})`;
}

function escribirSql(nombre, contenido) {
  fs.writeFileSync(path.join(SALIDA, nombre), `${contenido.trim()}\n`, "utf8");
}

async function exportarTabla(cliente, tabla, indiceTabla) {
  const columnas = tabla.columnas.map((columna) => `"${columna}"`).join(", ");
  const { rows } = await cliente.query(
    `select ${columnas} from public."${tabla.nombre}" order by 1`,
  );

  if (!rows.length) {
    console.log(`${tabla.nombre}: 0`);
    return 0;
  }

  const columnasSql = tabla.columnas.map((columna) => `"${columna}"`).join(",");
  let indiceArchivo = 0;
  for (let indice = 0; indice < rows.length; indice += FILAS_POR_INSERT) {
    const lote = rows.slice(indice, indice + FILAS_POR_INSERT);
    const valores = lote.map((fila) => filaValoresSql(tabla, fila)).join(",\n");
    escribirSql(
      `${String(indiceTabla).padStart(2, "0")}_${tabla.nombre}_${String(indiceArchivo).padStart(4, "0")}.sql`,
      `INSERT OR REPLACE INTO "${tabla.nombre}" (${columnasSql}) VALUES\n${valores};`,
    );
    indiceArchivo += 1;
  }

  console.log(`${tabla.nombre}: ${rows.length}`);
  return rows.length;
}

async function main() {
  limpiarDirectorio();
  escribirSql(
    "00_limpiar.sql",
    ordenBorrado.map((tabla) => `DELETE FROM "${tabla}";`).join("\n"),
  );

  const cliente = new Client({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE ?? "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await cliente.connect();
  await cliente.query('set role "postgres"');
  const resumen = {};

  try {
    for (let indice = 0; indice < tablas.length; indice += 1) {
      const tabla = tablas[indice];
      resumen[tabla.nombre] = await exportarTabla(cliente, tabla, indice + 1);
    }
  } finally {
    await cliente.end();
  }

  escribirSql("zz_verificar.sql", "SELECT 'ok' AS estado;");
  console.log(JSON.stringify({ salida: SALIDA, resumen }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
