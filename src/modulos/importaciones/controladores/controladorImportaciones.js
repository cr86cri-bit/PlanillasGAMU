import { traducirError } from "../../../nucleo/errores/manejadorErrores.js";
import {
  crearFuncionariosFaltantes as crearFuncionariosFaltantesDesdeExcel,
  listarHistorialImportaciones,
  previsualizarImportacion,
  procesarImportacion,
  recalcularImportacion as recalcularImportacionServicio,
  revertirImportacion as revertirImportacionServicio,
} from "../servicios/servicioImportaciones.js";
import { listarUnidadesActivas } from "../../catalogos/servicios/servicioCatalogos.js";

export function crearControladorImportaciones() {
  const estado = {
    archivo: null,
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    idUnidad: "",
    unidades: [],
    previsualizacion: null,
    estaLeyendo: false,
    estaProcesando: false,
    estaCreandoFuncionarios: false,
    progreso: 0,
    historial: [],
    estaCargandoHistorial: false,
    idImportacionRecalculando: null,
    idImportacionRevirtiendo: null,
    error: null,
  };

  return {
    estado,
    async cargarUnidades() {
      estado.error = null;
      try {
        estado.unidades = await listarUnidadesActivas();
        if (!estado.idUnidad && estado.unidades.length === 1) {
          estado.idUnidad = estado.unidades[0].id_unidad;
        }
      } catch (error) {
        estado.error = traducirError(error);
      }
    },
    async cargarHistorial() {
      estado.estaCargandoHistorial = true;
      estado.error = null;
      try {
        estado.historial = await listarHistorialImportaciones();
      } catch (error) {
        estado.error = traducirError(error);
      } finally {
        estado.estaCargandoHistorial = false;
      }
    },
    establecerArchivo(archivo) {
      estado.archivo = archivo;
      estado.previsualizacion = null;
      estado.error = null;
    },
    establecerPeriodo(anio, mes) {
      estado.anio = Number(anio);
      estado.mes = Number(mes);
      estado.previsualizacion = null;
      estado.error = null;
    },
    establecerUnidad(idUnidad) {
      estado.idUnidad = idUnidad;
      estado.previsualizacion = null;
      estado.error = null;
    },
    async previsualizar() {
      if (!estado.archivo) {
        estado.error = "Selecciona un archivo Excel antes de previsualizar.";
        return;
      }

      if (!estado.idUnidad) {
        estado.error = "Selecciona una unidad antes de previsualizar.";
        return;
      }

      estado.estaLeyendo = true;
      estado.error = null;
      try {
        estado.previsualizacion = await previsualizarImportacion({
          archivo: estado.archivo,
          anio: estado.anio,
          mes: estado.mes,
          idUnidad: estado.idUnidad,
        });
      } catch (error) {
        estado.error = traducirError(error);
      } finally {
        estado.estaLeyendo = false;
      }
    },
    async crearFuncionariosFaltantes() {
      if (!estado.previsualizacion) {
        return 0;
      }

      estado.estaCreandoFuncionarios = true;
      estado.error = null;
      try {
        const funcionarios = await crearFuncionariosFaltantesDesdeExcel(estado.previsualizacion);
        estado.previsualizacion = await previsualizarImportacion({
          archivo: estado.archivo,
          anio: estado.anio,
          mes: estado.mes,
          idUnidad: estado.idUnidad,
        });
        return funcionarios.length;
      } catch (error) {
        estado.error = traducirError(error);
        return 0;
      } finally {
        estado.estaCreandoFuncionarios = false;
      }
    },
    async confirmar() {
      estado.estaProcesando = true;
      estado.error = null;
      try {
        await procesarImportacion(estado.previsualizacion, ({ procesados }) => {
          estado.progreso = procesados;
        });
        estado.archivo = null;
        estado.previsualizacion = null;
        estado.progreso = 0;
        estado.historial = await listarHistorialImportaciones();
      } catch (error) {
        estado.error = traducirError(error);
      } finally {
        estado.estaProcesando = false;
      }
    },
    async recalcularImportacion(idImportacion) {
      estado.idImportacionRecalculando = idImportacion;
      estado.error = null;
      try {
        await recalcularImportacionServicio(idImportacion);
        estado.historial = await listarHistorialImportaciones();
        return true;
      } catch (error) {
        estado.error = traducirError(error);
        return false;
      } finally {
        estado.idImportacionRecalculando = null;
      }
    },
    async revertirImportacion(idImportacion) {
      estado.idImportacionRevirtiendo = idImportacion;
      estado.error = null;
      try {
        await revertirImportacionServicio(idImportacion);
        estado.historial = await listarHistorialImportaciones();
        return true;
      } catch (error) {
        estado.error = traducirError(error);
        return false;
      } finally {
        estado.idImportacionRevirtiendo = null;
      }
    },
  };
}
