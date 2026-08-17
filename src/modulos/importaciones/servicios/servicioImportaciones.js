import { invocarFuncion } from "../../../nucleo/http/clienteHttp.js";
import {
  actualizarRegistro,
  crearRegistro,
  crearRegistros,
  seleccionarRegistros,
} from "../../../nucleo/datos/servicioDatos.js";
import {
  agruparPorCodigoBiometrico,
  detectarDuplicadosMarcaciones,
  detectarPeriodoMarcaciones,
  normalizarFilaExcel,
  normalizarNombreArchivo,
  validarColumnasExcel,
} from "../utilidades/importacionExcel.js";

const tamanoLote = 500;

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

function resumirMarcacionesPorMes(marcaciones) {
  return marcaciones
    .filter((marcacion) => marcacion.valida)
    .reduce((resumen, marcacion) => {
      const clave = marcacion.fecha_marcacion_iso.slice(0, 7);
      resumen[clave] = (resumen[clave] ?? 0) + 1;
      return resumen;
    }, {});
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

function fechaIngresoDesdePrevisualizacion(previsualizacion) {
  if (previsualizacion.periodoDetectado?.fecha_minima) {
    return previsualizacion.periodoDetectado.fecha_minima;
  }

  return `${previsualizacion.anio}-${String(previsualizacion.mes).padStart(2, "0")}-01`;
}

export async function calcularSha256Archivo(archivo) {
  const buffer = await archivo.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function leerArchivoExcel(archivo) {
  const XLSX = await import("xlsx");
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: "array", cellDates: false });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });
  const columnas = Object.keys(filas[0] ?? {});
  const faltantes = validarColumnasExcel(columnas);

  if (faltantes.length) {
    throw new Error(`Faltan columnas requeridas: ${faltantes.join(", ")}.`);
  }

  return filas;
}

export async function previsualizarImportacion({ archivo, anio, mes, idUnidad }) {
  const [filas, sha256] = await Promise.all([
    leerArchivoExcel(archivo),
    calcularSha256Archivo(archivo),
  ]);
  const marcaciones = filas.map(normalizarFilaExcel);
  const filasInvalidas = marcaciones.filter((marcacion) => !marcacion.valida);
  const marcacionesValidas = marcaciones.filter((marcacion) => marcacion.valida);
  const periodoDetectado = detectarPeriodoMarcaciones(marcaciones);
  const duplicados = detectarDuplicadosMarcaciones(marcaciones);
  const codigosEncontrados = agruparPorCodigoBiometrico(marcaciones);
  const funcionariosExcel = listarFuncionariosExcel(marcaciones);
  const funcionarios = await buscarFuncionariosPorCodigos(codigosEncontrados);
  const codigosVinculados = new Set(
    funcionarios.map((funcionario) => funcionario.codigo_biometrico),
  );
  const codigosDesconocidos = codigosEncontrados.filter((codigo) => !codigosVinculados.has(codigo));
  const funcionariosDesconocidos = funcionariosExcel.filter((funcionario) =>
    codigosDesconocidos.includes(funcionario.codigo_biometrico),
  );

  return {
    archivo,
    nombre_archivo: archivo.name,
    nombre_archivo_normalizado: normalizarNombreArchivo(archivo.name),
    sha256,
    anio,
    mes,
    id_unidad: idUnidad,
    filas,
    marcaciones,
    marcacionesValidas,
    filasInvalidas,
    periodoDetectado,
    resumenPorMes: resumirMarcacionesPorMes(marcaciones),
    duplicados,
    funcionarios,
    funcionariosExcel,
    funcionariosDesconocidos,
    codigosEncontrados,
    codigosDesconocidos,
  };
}

export async function buscarFuncionariosPorCodigos(codigos) {
  if (!codigos.length) {
    return [];
  }

  return seleccionarRegistros({
    tabla: "funcionarios",
    columnas: "id_funcionario,codigo_biometrico,carnet_identidad,nombre_completo",
    filtrosIn: { codigo_biometrico: codigos },
    limite: codigos.length,
  });
}

export async function crearFuncionariosFaltantes(previsualizacion) {
  const funcionarios = previsualizacion.funcionariosDesconocidos ?? [];

  if (!funcionarios.length) {
    return [];
  }

  const registros = funcionarios.map((funcionario) => {
    const nombreCompleto = funcionario.nombre_excel || funcionario.codigo_biometrico;
    const nombres = separarNombreFuncionario(nombreCompleto, funcionario.codigo_biometrico);

    return {
      carnet_identidad: funcionario.codigo_biometrico,
      codigo_biometrico: funcionario.codigo_biometrico,
      ...nombres,
      nombre_completo: nombreCompleto,
      id_unidad: previsualizacion.id_unidad || null,
      fecha_ingreso: fechaIngresoDesdePrevisualizacion(previsualizacion),
      estado: "ACTIVO",
      observacion: "Creado desde archivo de marcaciones biométricas.",
    };
  });

  const creados = [];

  for (let indice = 0; indice < registros.length; indice += tamanoLote) {
    const lote = registros.slice(indice, indice + tamanoLote);
    const data = await crearRegistros("funcionarios", lote);
    creados.push(...(data ?? []));
  }

  return creados;
}

export async function procesarImportacion(previsualizacion, alProgreso = () => {}) {
  const importacion = await crearRegistro("importaciones_excel", {
      nombre_archivo: previsualizacion.nombre_archivo,
      nombre_archivo_normalizado: previsualizacion.nombre_archivo_normalizado,
      sha256: previsualizacion.sha256,
      anio: previsualizacion.anio,
      mes: previsualizacion.mes,
      id_unidad: previsualizacion.id_unidad,
      fecha_minima: previsualizacion.periodoDetectado?.fecha_minima,
      fecha_maxima: previsualizacion.periodoDetectado?.fecha_maxima,
      total_marcaciones: previsualizacion.marcacionesValidas.length,
      filas_invalidas: previsualizacion.filasInvalidas.length,
      estado: "PROCESANDO",
    });

  const mapaFuncionarios = new Map(
    previsualizacion.funcionarios.map((funcionario) => [
      funcionario.codigo_biometrico,
      funcionario.id_funcionario,
    ]),
  );

  const lotes = [];
  for (let indice = 0; indice < previsualizacion.marcacionesValidas.length; indice += tamanoLote) {
    lotes.push(previsualizacion.marcacionesValidas.slice(indice, indice + tamanoLote));
  }

  for (let indice = 0; indice < lotes.length; indice += 1) {
    const lote = lotes[indice].map((marcacion) => ({
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

    await crearRegistros("marcaciones_originales", lote);
    alProgreso({
      procesados: Math.min((indice + 1) * tamanoLote, previsualizacion.marcacionesValidas.length),
    });
  }

  await invocarFuncion("recalcular-asistencia", { id_importacion: importacion.id_importacion });
  await actualizarRegistro("importaciones_excel", "id_importacion", importacion.id_importacion, {
    estado: "COMPLETADO",
  });

  return importacion;
}

export async function listarHistorialImportaciones({ limite = 12 } = {}) {
  return seleccionarRegistros({
    tabla: "importaciones_excel",
    columnas: `
      id_importacion,
      nombre_archivo,
      anio,
      mes,
      estado,
      total_marcaciones,
      filas_invalidas,
      fecha_minima,
      fecha_maxima,
      resumen,
      fecha_creacion,
      unidades(codigo,nombre)
    `,
    orden: "fecha_creacion",
    ascendente: false,
    limite,
  });
}

export function recalcularImportacion(idImportacion) {
  return invocarFuncion("recalcular-asistencia", { id_importacion: idImportacion });
}

export function revertirImportacion(idImportacion) {
  return invocarFuncion("revertir-importacion", { id_importacion: idImportacion });
}
