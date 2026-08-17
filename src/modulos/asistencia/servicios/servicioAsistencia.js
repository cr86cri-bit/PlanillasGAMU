import { invocarFuncion } from "../../../nucleo/http/clienteHttp.js";
import { seleccionarRegistros } from "../../../nucleo/datos/servicioDatos.js";
import { buscarFuncionarioPorCarnet } from "../../funcionarios/servicios/servicioFuncionarios.js";

export async function consultarAsistenciaIndividual({ carnetIdentidad, anio, mes }) {
  const funcionario = await buscarFuncionarioPorCarnet(carnetIdentidad);

  if (!funcionario) {
    return {
      funcionario: null,
      asistencias: [],
      totales: crearTotalesVacios(),
    };
  }

  const fechaInicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const fechaFin = new Date(Number(anio), Number(mes), 0).toISOString().slice(0, 10);
  const asistencias =
    (await seleccionarRegistros({
      tabla: "asistencias_diarias",
      columnas: `
      id_asistencia,
      fecha,
      estado,
      minutos_atraso,
      cantidad_atrasos,
      cantidad_omisiones,
      cantidad_faltas,
      minutos_hora_extra,
      tolerancia_horas_extra,
      explicacion,
      resultados_marcaciones(
        tipo,
        estado,
        hora_objetivo,
        fecha_marcacion,
        minutos_atraso,
        marcaciones_esperadas(orden)
      )
    `,
      filtros: { id_funcionario: funcionario.id_funcionario },
      filtrosGte: { fecha: fechaInicio },
      filtrosLte: { fecha: fechaFin },
      orden: "fecha",
      ascendente: true,
      limite: 60,
    })) ?? [];

  return {
    funcionario,
    asistencias,
    totales: calcularTotalesAsistencia(asistencias),
  };
}

export function calcularTotalesAsistencia(asistencias) {
  return asistencias.reduce(
    (totales, asistencia) => ({
      cantidad_atrasos: totales.cantidad_atrasos + Number(asistencia.cantidad_atrasos ?? 0),
      minutos_atraso: totales.minutos_atraso + Number(asistencia.minutos_atraso ?? 0),
      cantidad_omisiones: totales.cantidad_omisiones + Number(asistencia.cantidad_omisiones ?? 0),
      cantidad_faltas: totales.cantidad_faltas + Number(asistencia.cantidad_faltas ?? 0),
      minutos_hora_extra: totales.minutos_hora_extra + Number(asistencia.minutos_hora_extra ?? 0),
      tolerancia_horas_extra:
        totales.tolerancia_horas_extra + Number(asistencia.tolerancia_horas_extra ?? 0),
    }),
    crearTotalesVacios(),
  );
}

function crearTotalesVacios() {
  return {
    cantidad_atrasos: 0,
    minutos_atraso: 0,
    cantidad_omisiones: 0,
    cantidad_faltas: 0,
    minutos_hora_extra: 0,
    tolerancia_horas_extra: 0,
  };
}

export function recalcularAsistencia(cuerpo) {
  return invocarFuncion("recalcular-asistencia", cuerpo);
}
