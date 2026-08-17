import { invocarFuncion } from "../../../nucleo/http/clienteHttp.js";
import {
  actualizarRegistro,
  crearRegistro,
  listarRegistros,
  obtenerRegistroPorId,
} from "../../../nucleo/datos/servicioDatos.js";

export function listarHorarios(opciones = {}) {
  return listarRegistros({
    tabla: "plantillas_horario",
    columnas: `
      id_horario,
      nombre,
      tipo,
      descripcion,
      alcance,
      activo,
      fecha_creacion,
      reglas_dia_horario(
        id_regla,
        dia_semana,
        es_laboral,
        marcaciones_esperadas(
          id_marcacion_esperada,
          tipo,
          hora_objetivo,
          orden
        )
      )
    `,
    orden: "nombre",
    ascendente: true,
    columnasBusqueda: ["nombre", "tipo", "descripcion"],
    ...opciones,
  });
}

export function crearHorario(datos) {
  return crearRegistro("plantillas_horario", datos);
}

export function actualizarHorario(idHorario, datos) {
  return actualizarRegistro("plantillas_horario", "id_horario", idHorario, datos);
}

export async function actualizarMarcacionesHorario(marcaciones) {
  if (!marcaciones.length) {
    return;
  }

  for (const marcacion of marcaciones) {
    await actualizarRegistro(
      "marcaciones_esperadas",
      "id_marcacion_esperada",
      marcacion.id_marcacion_esperada,
      { hora_objetivo: marcacion.hora_objetivo },
    );
  }
}

export async function obtenerHorarioVigente(idFuncionario, fecha) {
  return invocarFuncion("obtener-horario-vigente", {
    id_funcionario: idFuncionario,
    fecha,
  });
}

export async function obtenerDetalleHorario(idHorario) {
  return obtenerRegistroPorId(
    "plantillas_horario",
    "id_horario",
    idHorario,
    `
      id_horario,
      nombre,
      tipo,
      descripcion,
      alcance,
      reglas_dia_horario(
        id_regla,
        dia_semana,
        es_laboral,
        marcaciones_esperadas(
          id_marcacion_esperada,
          tipo,
          hora_objetivo,
          hora_inicio_ventana,
          hora_fin_ventana,
          minutos_tolerancia,
          orden,
          cruza_medianoche,
          obligatorio
        )
      )
    `,
  );
}
