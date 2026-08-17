import { traducirError } from "../../../nucleo/errores/manejadorErrores.js";
import {
  actualizarHorario,
  actualizarMarcacionesHorario,
  crearHorario,
  listarHorarios,
} from "../servicios/servicioHorarios.js";

export function crearControladorHorarios() {
  const estado = {
    busqueda: "",
    pagina: 1,
    tamanoPagina: 20,
    filas: [],
    total: 0,
    estaCargando: false,
    estaGuardando: false,
    error: null,
  };

  async function cargarHorarios() {
    estado.estaCargando = true;
    estado.error = null;

    try {
      const resultado = await listarHorarios({
        busqueda: estado.busqueda,
        pagina: estado.pagina,
        tamanoPagina: estado.tamanoPagina,
      });
      estado.filas = resultado.filas;
      estado.total = resultado.total;
    } catch (error) {
      estado.error = traducirError(error);
    } finally {
      estado.estaCargando = false;
    }
  }

  return {
    estado,
    cargarHorarios,
    async guardarHorario(datos, horario = null, marcaciones = []) {
      estado.estaGuardando = true;
      try {
        if (horario) {
          await actualizarHorario(horario.id_horario, datos);
          await actualizarMarcacionesHorario(marcaciones);
        } else {
          await crearHorario(datos);
        }
      } finally {
        estado.estaGuardando = false;
      }
    },
    establecerBusqueda(valor) {
      estado.busqueda = valor;
      estado.pagina = 1;
    },
  };
}
