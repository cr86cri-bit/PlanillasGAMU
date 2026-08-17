import { traducirError } from "../../../nucleo/errores/manejadorErrores.js";
import {
  actualizarFuncionario,
  cambiarEstadoFuncionario,
  crearFuncionario,
  listarFuncionarios,
} from "../servicios/servicioFuncionarios.js";
import {
  listarCargosActivos,
  listarUnidadesActivas,
} from "../../catalogos/servicios/servicioCatalogos.js";

export function crearControladorFuncionarios() {
  const estado = {
    busqueda: "",
    pagina: 1,
    tamanoPagina: 20,
    filas: [],
    cargos: [],
    unidades: [],
    total: 0,
    estaCargando: false,
    estaGuardando: false,
    error: null,
  };

  async function cargarCatalogos() {
    const [cargos, unidades] = await Promise.all([listarCargosActivos(), listarUnidadesActivas()]);
    estado.cargos = cargos;
    estado.unidades = unidades;
  }

  async function cargarFuncionarios() {
    estado.estaCargando = true;
    estado.error = null;

    try {
      const [resultado] = await Promise.all([
        listarFuncionarios({
          busqueda: estado.busqueda,
          pagina: estado.pagina,
          tamanoPagina: estado.tamanoPagina,
        }),
        cargarCatalogos(),
      ]);
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
    cargarFuncionarios,
    async guardarFuncionario(datos, funcionario = null) {
      estado.estaGuardando = true;
      try {
        if (funcionario) {
          await actualizarFuncionario(funcionario.id_funcionario, datos);
        } else {
          await crearFuncionario(datos);
        }
      } finally {
        estado.estaGuardando = false;
      }
    },
    async alternarEstadoFuncionario(funcionario) {
      const estadoNuevo = funcionario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await cambiarEstadoFuncionario(funcionario.id_funcionario, estadoNuevo);
    },
    establecerBusqueda(valor) {
      estado.busqueda = valor;
      estado.pagina = 1;
    },
    establecerPagina(pagina) {
      estado.pagina = pagina;
    },
  };
}
