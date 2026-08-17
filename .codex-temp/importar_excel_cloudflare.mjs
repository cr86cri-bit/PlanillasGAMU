/* global process, fetch, console */
import crypto from "node:crypto";
import fs from "node:fs";
import XLSX from "xlsx";
import {
  agruparPorCodigoBiometrico,
  detectarPeriodoMarcaciones,
  normalizarFilaExcel,
  normalizarNombreArchivo,
  validarColumnasExcel,
} from "../src/modulos/importaciones/utilidades/importacionExcel.js";

const BASE_URL = process.env.GAMU_BASE_URL;
const CORREO = process.env.GAMU_CORREO;
const CONTRASENA = process.env.GAMU_CONTRASENA;
const ARCHIVO = process.env.GAMU_EXCEL;
const ID_UNIDAD = process.env.GAMU_ID_UNIDAD;
const ANIO = Number(process.env.GAMU_ANIO ?? new Date().getFullYear());
const MES = Number(process.env.GAMU_MES ?? new Date().getMonth() + 1);
const TAMANO_LOTE = 500;
const TAMANO_LOTE_RECALCULO = 1;

if (!BASE_URL || !CORREO || !CONTRASENA || !ARCHIVO || !ID_UNIDAD) {
  throw new Error("Faltan variables de entorno para importar.");
}

function separarNombreFuncionario(nombreCompleto, codigoBiometrico) {
  const partes = String(nombreCompleto ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return {
      nombres: "Sin nombre",
      apellido_paterno: codigoBiometrico,
      apellido_materno: null,
    };
  }

  if (partes.length === 1) {
    return {
      nombres: partes[0],
      apellido_paterno: codigoBiometrico,
      apellido_materno: null,
    };
  }

  if (partes.length === 2) {
    return {
      nombres: partes[0],
      apellido_paterno: partes[1],
      apellido_materno: null,
    };
  }

  return {
    nombres: partes.slice(0, -2).join(" "),
    apellido_paterno: partes.at(-2),
    apellido_materno: partes.at(-1),
  };
}

function listarFuncionariosExcel(marcaciones) {
  const funcionarios = new Map();

  marcaciones
    .filter((marcacion) => marcacion.valida && marcacion.codigo_biometrico)
    .forEach((marcacion) => {
      if (!funcionarios.has(marcacion.codigo_biometrico)) {
        funcionarios.set(marcacion.codigo_biometrico, {
          codigo_biometrico: marcacion.codigo_biometrico,
          nombre_excel: marcacion.nombre_excel,
        });
      }
    });

  return [...funcionarios.values()].sort((a, b) =>
    a.nombre_excel.localeCompare(b.nombre_excel, "es"),
  );
}

function fechaIngresoDesdePeriodo(periodo) {
  return periodo?.fecha_minima ?? `${ANIO}-${String(MES).padStart(2, "0")}-01`;
}

function leerExcel() {
  const libro = XLSX.readFile(ARCHIVO, { cellDates: false });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });
  const columnas = Object.keys(filas[0] ?? {});
  const faltantes = validarColumnasExcel(columnas);

  if (faltantes.length) {
    throw new Error(`Faltan columnas requeridas: ${faltantes.join(", ")}.`);
  }

  return filas;
}

function hashArchivo() {
  return crypto.createHash("sha256").update(fs.readFileSync(ARCHIVO)).digest("hex");
}

async function api(ruta, { metodo = "GET", cuerpo, cookie } = {}) {
  const respuesta = await fetch(`${BASE_URL.replace(/\/$/, "")}/api/${ruta}`, {
    method: metodo,
    headers: {
      ...(cuerpo === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok || datos?.correcto === false) {
    throw new Error(datos?.mensaje ?? `Error HTTP ${respuesta.status}`);
  }

  return { datos: datos?.datos ?? datos, cookie: respuesta.headers.get("set-cookie") };
}

async function seleccionar(cookie, cuerpo) {
  const { datos } = await api("datos/seleccionar", {
    metodo: "POST",
    cookie,
    cuerpo,
  });
  return datos;
}

async function crear(cookie, tabla, datos) {
  const { datos: respuesta } = await api("datos/crear", {
    metodo: "POST",
    cookie,
    cuerpo: { tabla, datos },
  });
  return respuesta;
}

async function actualizar(cookie, tabla, columnaId, id, datos) {
  const { datos: respuesta } = await api("datos/actualizar", {
    metodo: "POST",
    cookie,
    cuerpo: { tabla, columnaId, id, datos },
  });
  return respuesta;
}

async function invocar(cookie, funcion, cuerpo) {
  const { datos } = await api(`funciones/${funcion}`, {
    metodo: "POST",
    cookie,
    cuerpo,
  });
  return datos;
}

async function crearEnLotes(cookie, tabla, registros) {
  const creados = [];
  for (let indice = 0; indice < registros.length; indice += TAMANO_LOTE) {
    const lote = registros.slice(indice, indice + TAMANO_LOTE);
    const respuesta = await crear(cookie, tabla, lote);
    creados.push(...(respuesta ?? []));
    console.log(`${tabla}: ${Math.min(indice + TAMANO_LOTE, registros.length)}/${registros.length}`);
  }
  return creados;
}

async function main() {
  const login = await api("auth/login", {
    metodo: "POST",
    cuerpo: { correo: CORREO, contrasena: CONTRASENA },
  });
  const cookie = login.cookie?.split(";")[0];

  if (!cookie) {
    throw new Error("No se obtuvo cookie de sesión.");
  }

  const filas = leerExcel();
  const marcaciones = filas.map(normalizarFilaExcel);
  const marcacionesValidas = marcaciones.filter((marcacion) => marcacion.valida);
  const periodo = detectarPeriodoMarcaciones(marcaciones);
  const codigos = agruparPorCodigoBiometrico(marcaciones);
  const funcionariosExistentes = await seleccionar(cookie, {
    tabla: "funcionarios",
    columnas: "id_funcionario,codigo_biometrico,carnet_identidad,nombre_completo",
    filtrosIn: { codigo_biometrico: codigos },
    limite: codigos.length,
  });
  const codigosExistentes = new Set(
    funcionariosExistentes.map((funcionario) => funcionario.codigo_biometrico),
  );
  const funcionariosExcel = listarFuncionariosExcel(marcaciones);
  const faltantes = funcionariosExcel.filter(
    (funcionario) => !codigosExistentes.has(funcionario.codigo_biometrico),
  );

  console.log(
    JSON.stringify({
      filas: filas.length,
      marcacionesValidas: marcacionesValidas.length,
      codigos: codigos.length,
      funcionariosExistentes: funcionariosExistentes.length,
      funcionariosFaltantes: faltantes.length,
      periodo,
    }),
  );

  if (faltantes.length) {
    const fechaIngreso = fechaIngresoDesdePeriodo(periodo);
    const registrosFuncionarios = faltantes.map((funcionario) => {
      const nombreCompleto = funcionario.nombre_excel || funcionario.codigo_biometrico;
      return {
        carnet_identidad: funcionario.codigo_biometrico,
        codigo_biometrico: funcionario.codigo_biometrico,
        ...separarNombreFuncionario(nombreCompleto, funcionario.codigo_biometrico),
        nombre_completo: nombreCompleto,
        id_unidad: ID_UNIDAD,
        fecha_ingreso: fechaIngreso,
        estado: "ACTIVO",
        observacion: "Creado desde archivo de marcaciones biométricas migrado desde Supabase.",
      };
    });
    await crearEnLotes(cookie, "funcionarios", registrosFuncionarios);
  }

  const funcionarios = await seleccionar(cookie, {
    tabla: "funcionarios",
    columnas: "id_funcionario,codigo_biometrico,carnet_identidad,nombre_completo",
    filtrosIn: { codigo_biometrico: codigos },
    limite: codigos.length,
  });
  const mapaFuncionarios = new Map(
    funcionarios.map((funcionario) => [funcionario.codigo_biometrico, funcionario.id_funcionario]),
  );

  const nombreArchivo = ARCHIVO.split(/[\\/]/).at(-1);
  const importacionesPrevias = await seleccionar(cookie, {
    tabla: "importaciones_excel",
    columnas: "id_importacion,nombre_archivo,anio,mes,id_unidad,estado",
    filtros: { anio: ANIO, mes: MES, id_unidad: ID_UNIDAD },
    limite: 10,
  });

  let importacion = importacionesPrevias.find((fila) => fila.estado !== "REVERTIDO");
  if (!importacion) {
    importacion = await crear(cookie, "importaciones_excel", {
      nombre_archivo: nombreArchivo,
      nombre_archivo_normalizado: normalizarNombreArchivo(nombreArchivo),
      sha256: hashArchivo(),
      anio: ANIO,
      mes: MES,
      id_unidad: ID_UNIDAD,
      fecha_minima: periodo?.fecha_minima,
      fecha_maxima: periodo?.fecha_maxima,
      total_marcaciones: marcacionesValidas.length,
      filas_invalidas: marcaciones.length - marcacionesValidas.length,
      estado: "PROCESANDO",
    });

    const registrosMarcaciones = marcacionesValidas.map((marcacion) => ({
      id_importacion: importacion.id_importacion,
      id_funcionario: mapaFuncionarios.get(marcacion.codigo_biometrico) ?? null,
      codigo_biometrico: marcacion.codigo_biometrico,
      nombre_excel: marcacion.nombre_excel,
      tiempo_original: marcacion.tiempo_original,
      fecha_marcacion: `${marcacion.fecha_marcacion_iso} ${marcacion.hora_marcacion}`,
      estado_excel: marcacion.estado_excel,
      dispositivo: marcacion.dispositivo,
      tipo_registro: marcacion.tipo_registro,
      numero_fila: marcacion.numero_fila,
    }));

    await crearEnLotes(cookie, "marcaciones_originales", registrosMarcaciones);
  } else {
    console.log(`Importación ya existente: ${importacion.id_importacion}`);
  }

  let asistenciasCalculadas = 0;
  for (let indice = 0; indice < funcionarios.length; indice += TAMANO_LOTE_RECALCULO) {
    const loteFuncionarios = funcionarios.slice(indice, indice + TAMANO_LOTE_RECALCULO);
    const resultado = await invocar(cookie, "recalcular-asistencia", {
      id_importacion: importacion.id_importacion,
      ids_funcionarios: loteFuncionarios.map((funcionario) => funcionario.id_funcionario),
      finalizar: false,
    });
    asistenciasCalculadas += Number(resultado?.asistencias_calculadas ?? 0);
    console.log(
      `recalculo: ${Math.min(indice + TAMANO_LOTE_RECALCULO, funcionarios.length)}/${funcionarios.length}`,
    );
  }

  await actualizar(cookie, "importaciones_excel", "id_importacion", importacion.id_importacion, {
    estado: "COMPLETADO",
    resumen: { asistencias_calculadas: asistenciasCalculadas },
  });

  console.log(
    JSON.stringify({
      importacion: importacion.id_importacion,
      asistenciasCalculadas,
      completado: true,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
