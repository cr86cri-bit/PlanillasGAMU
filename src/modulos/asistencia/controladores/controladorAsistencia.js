import { traducirError } from "../../../nucleo/errores/manejadorErrores.js";
import { consultarAsistenciaIndividual } from "../servicios/servicioAsistencia.js";

export function crearControladorAsistencia() {
  const fecha = new Date();
  const estado = {
    carnetIdentidad: "",
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    resultado: null,
    estaCargando: false,
    error: null,
  };

  return {
    estado,
    establecerCarnet(valor) {
      estado.carnetIdentidad = valor;
      estado.error = null;
    },
    establecerPeriodo(anio, mes) {
      estado.anio = Number(anio);
      estado.mes = Number(mes);
      estado.resultado = null;
    },
    async consultar() {
      const carnetIdentidad = String(estado.carnetIdentidad ?? "").trim();

      if (!carnetIdentidad) {
        estado.resultado = null;
        estado.error = "Ingresa el carnet de identidad antes de consultar.";
        return;
      }

      estado.carnetIdentidad = carnetIdentidad;
      estado.estaCargando = true;
      estado.error = null;
      estado.resultado = null;
      try {
        estado.resultado = await consultarAsistenciaIndividual({
          carnetIdentidad,
          anio: estado.anio,
          mes: estado.mes,
        });
      } catch (error) {
        estado.error = traducirError(error);
      } finally {
        estado.estaCargando = false;
      }
    },
  };
}
