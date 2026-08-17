import { usuarioTienePermisoLocal } from "../nucleo/autenticacion/permisos.js";
import { listarRegistros } from "../nucleo/datos/servicioDatos.js";
import { traducirError } from "../nucleo/errores/manejadorErrores.js";
import { crearElemento, limpiarNodo, textoSeguro } from "../utilidades/dom.js";
import { crearAntirebote } from "../utilidades/consultas.js";
import {
  actualizarRegistroCatalogo,
  crearRegistroCatalogo,
} from "./catalogos/servicios/servicioCatalogos.js";
import { BarraFiltros } from "../componentes/BarraFiltros/BarraFiltros.js";
import { Boton } from "../componentes/Boton/Boton.js";
import { EtiquetaEstado } from "../componentes/EtiquetaEstado/EtiquetaEstado.js";
import { IndicadorCarga } from "../componentes/IndicadorCarga/IndicadorCarga.js";
import { Modal } from "../componentes/Modal/Modal.js";
import { mostrarNotificacion } from "../componentes/Notificacion/Notificacion.js";
import { PanelError } from "../componentes/Error/PanelError.js";
import { TablaDatos } from "../componentes/TablaDatos/TablaDatos.js";
import { Tarjeta } from "../componentes/Tarjeta/Tarjeta.js";

const camposBaseCatalogo = [
  { clave: "nombre", etiqueta: "Nombre", requerido: true },
  { clave: "descripcion", etiqueta: "Descripcion", tipo: "textarea" },
  {
    clave: "activo",
    etiqueta: "Estado",
    tipo: "booleano",
    valorInicial: true,
    opciones: [
      { valor: true, etiqueta: "Activo" },
      { valor: false, etiqueta: "Inactivo" },
    ],
  },
];

function resolverCamposFormulario(camposFormulario, opcionesFormulario) {
  return camposFormulario.map((campo) => {
    if (!campo.fuenteOpciones) {
      return campo;
    }

    return {
      ...campo,
      opciones: opcionesFormulario[campo.fuenteOpciones] ?? campo.opciones ?? [],
    };
  });
}

function crearCampoFormulario(campo, fila = {}) {
  const idCampo = `campo-${campo.clave}-${crypto.randomUUID()}`;
  const valor = fila[campo.clave] ?? campo.valorInicial ?? "";
  let opciones =
    campo.placeholder && valor === ""
      ? [{ valor: "", etiqueta: campo.placeholder, deshabilitado: true }, ...(campo.opciones ?? [])]
      : (campo.opciones ?? []);

  if (
    valor !== "" &&
    (campo.tipo === "select" || campo.tipo === "booleano") &&
    !opciones.some((opcion) => String(opcion.valor) === String(valor))
  ) {
    opciones = [{ valor, etiqueta: "Valor actual" }, ...opciones];
  }

  if (campo.tipo === "select" || campo.tipo === "booleano") {
    const entrada = crearElemento(
      "select",
      {
        atributos: {
          id: idCampo,
          name: campo.clave,
          required: campo.requerido,
        },
      },
      opciones.map((opcion) =>
        crearElemento("option", {
          texto: opcion.etiqueta,
          atributos: {
            value: String(opcion.valor),
            selected: String(opcion.valor) === String(valor),
            disabled: opcion.deshabilitado,
          },
        }),
      ),
    );

    entrada.dataset.tipo = campo.tipo;
    return crearElemento("div", { clases: "campo" }, [
      crearElemento("label", { atributos: { for: idCampo }, texto: campo.etiqueta }),
      entrada,
      campo.ayuda ? crearElemento("span", { clases: "campo__ayuda", texto: campo.ayuda }) : null,
    ]);
  }

  if (campo.tipo === "checkbox") {
    const entrada = crearElemento("input", {
      atributos: {
        id: idCampo,
        name: campo.clave,
        type: "checkbox",
        checked: Boolean(valor),
      },
    });
    entrada.dataset.tipo = campo.tipo;

    return crearElemento("div", { clases: "campo campo--checkbox" }, [
      crearElemento("label", { atributos: { for: idCampo } }, [
        entrada,
        crearElemento("span", { texto: campo.etiqueta }),
      ]),
      campo.ayuda ? crearElemento("span", { clases: "campo__ayuda", texto: campo.ayuda }) : null,
    ]);
  }

  const etiqueta = campo.tipo === "textarea" ? "textarea" : "input";
  const entrada = crearElemento(etiqueta, {
    atributos: {
      id: idCampo,
      name: campo.clave,
      type: campo.tipo ?? "text",
      required: campo.requerido,
      value: etiqueta === "input" ? valor : null,
      rows: campo.tipo === "textarea" ? 4 : null,
    },
    texto: etiqueta === "textarea" ? valor : undefined,
  });
  entrada.dataset.tipo = campo.tipo ?? "text";

  return crearElemento("div", { clases: "campo" }, [
    crearElemento("label", { atributos: { for: idCampo }, texto: campo.etiqueta }),
    entrada,
    campo.ayuda ? crearElemento("span", { clases: "campo__ayuda", texto: campo.ayuda }) : null,
  ]);
}

function leerDatosFormulario(formulario, campos) {
  return campos.reduce((datos, campo) => {
    const entrada = formulario.elements.namedItem(campo.clave);
    const valorCrudo = String(entrada?.value ?? "").trim();

    if (campo.tipo === "booleano") {
      datos[campo.clave] = valorCrudo === "true";
      return datos;
    }

    if (campo.tipo === "checkbox") {
      datos[campo.clave] = Boolean(entrada?.checked);
      return datos;
    }

    if (campo.tipo === "numero") {
      datos[campo.clave] = valorCrudo === "" ? null : Number(valorCrudo);
      return datos;
    }

    datos[campo.clave] = valorCrudo === "" && campo.nuloSiVacio ? null : valorCrudo;
    return datos;
  }, {});
}

function obtenerTextoAlternar(fila, campoActivacion) {
  if (campoActivacion === "estado") {
    return fila.estado === "ACTIVO" ? "Desactivar" : "Activar";
  }

  return fila[campoActivacion] === false ? "Activar" : "Desactivar";
}

function obtenerDatosAlternar(fila, campoActivacion) {
  if (campoActivacion === "estado") {
    return { estado: fila.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO" };
  }

  return { [campoActivacion]: fila[campoActivacion] === false };
}

function crearColumnasCatalogo(
  columnasTabla,
  campoActivacion,
  alEditar,
  alAlternar,
  puedeGestionar,
) {
  const columnas = columnasTabla ?? [
    { titulo: "Nombre", clave: "nombre" },
    {
      titulo: "Descripcion",
      renderizar: (fila) => textoSeguro(fila.descripcion ?? fila.observacion),
    },
    {
      titulo: "Estado",
      renderizar: (fila) =>
        EtiquetaEstado({ estado: fila.estado ?? (fila.activo ? "ACTIVO" : "INACTIVO") }),
    },
  ];

  return [
    ...columnas,
    {
      titulo: "Acciones",
      renderizar: (fila) =>
        crearElemento("div", { clases: "acciones acciones--tabla" }, [
          Boton({
            texto: "Editar",
            variante: "secundario",
            deshabilitado: !puedeGestionar,
            alClick: () => alEditar(fila),
          }),
          campoActivacion
            ? Boton({
                texto: obtenerTextoAlternar(fila, campoActivacion),
                variante: "secundario",
                deshabilitado: !puedeGestionar,
                alClick: () => alAlternar(fila),
              })
            : null,
        ]),
    },
  ];
}

export function crearPaginaCatalogo({
  titulo,
  descripcion,
  tabla,
  columnaId,
  permisoGestion,
  columnasBusqueda = ["nombre"],
  columnasTabla,
  columnasConsulta = "*",
  camposFormulario = camposBaseCatalogo,
  cargarOpcionesFormulario,
  campoActivacion = "activo",
  prepararDatosGuardar = (datos) => datos,
}) {
  return function PaginaCatalogo({ envolverProtegida, ruta, usuarioActual } = {}) {
    const estado = {
      busqueda: "",
      filas: [],
      total: 0,
      estaCargando: true,
      estaGuardando: false,
      error: null,
      pagina: 1,
      opcionesFormulario: {},
    };
    const contenedor = crearElemento("main", { clases: "pagina" });

    const cargar = async () => {
      estado.estaCargando = true;
      estado.error = null;
      renderizar();

      try {
        const [resultado, opcionesFormulario] = await Promise.all([
          listarRegistros({
            tabla,
            columnas: columnasConsulta,
            pagina: estado.pagina,
            tamanoPagina: 20,
            busqueda: estado.busqueda,
            columnasBusqueda,
          }),
          cargarOpcionesFormulario ? cargarOpcionesFormulario() : Promise.resolve({}),
        ]);

        estado.filas = resultado.filas;
        estado.total = resultado.total;
        estado.opcionesFormulario = opcionesFormulario ?? {};
      } catch (error) {
        estado.error = traducirError(error);
      } finally {
        estado.estaCargando = false;
        renderizar();
      }
    };

    const buscarConEspera = crearAntirebote((valor) => {
      estado.busqueda = valor;
      estado.pagina = 1;
      cargar();
    });

    const guardar = async (fila, formulario, modal) => {
      estado.estaGuardando = true;
      const campos = resolverCamposFormulario(camposFormulario, estado.opcionesFormulario);
      const datos = prepararDatosGuardar(leerDatosFormulario(formulario, campos), fila, {
        usuarioActual,
      });

      try {
        if (fila) {
          await actualizarRegistroCatalogo(tabla, columnaId, fila[columnaId], datos);
        } else {
          await crearRegistroCatalogo(tabla, datos);
        }

        modal.remove();
        mostrarNotificacion({
          titulo: fila ? "Registro actualizado" : "Registro creado",
          mensaje: `${titulo} se guardó correctamente.`,
          tipo: "exito",
        });
        await cargar();
      } catch (error) {
        mostrarNotificacion({
          titulo: "No se pudo guardar",
          mensaje: traducirError(error),
          tipo: "error",
        });
      } finally {
        estado.estaGuardando = false;
      }
    };

    const abrirFormulario = (fila = null) => {
      const campos = resolverCamposFormulario(camposFormulario, estado.opcionesFormulario);
      const formulario = crearElemento("form", { clases: "formulario" }, [
        ...campos.map((campo) => crearCampoFormulario(campo, fila ?? {})),
      ]);

      let modal;
      const botonGuardar = Boton({
        texto: estado.estaGuardando ? "Guardando..." : "Guardar",
        deshabilitado: estado.estaGuardando,
        alClick: () => formulario.requestSubmit(),
      });
      const botonCancelar = Boton({
        texto: "Cancelar",
        variante: "secundario",
        alClick: () => modal.remove(),
      });

      formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        await guardar(fila, formulario, modal);
      });

      modal = Modal({
        titulo: fila ? `Editar ${titulo}` : `Nuevo registro de ${titulo}`,
        cuerpo: formulario,
        pie: [botonCancelar, botonGuardar],
      });
    };

    const alternarEstado = async (fila) => {
      try {
        await actualizarRegistroCatalogo(
          tabla,
          columnaId,
          fila[columnaId],
          obtenerDatosAlternar(fila, campoActivacion),
        );
        await cargar();
      } catch (error) {
        mostrarNotificacion({
          titulo: "No se pudo cambiar el estado",
          mensaje: traducirError(error),
          tipo: "error",
        });
      }
    };

    function renderizar() {
      limpiarNodo(contenedor);

      const puedeGestionar = usuarioTienePermisoLocal(usuarioActual, permisoGestion);
      const columnas = crearColumnasCatalogo(
        columnasTabla,
        campoActivacion,
        abrirFormulario,
        alternarEstado,
        puedeGestionar,
      );

      contenedor.append(
        crearElemento("section", { clases: "pagina__cabecera" }, [
          crearElemento("div", { clases: "pagina__titulo" }, [
            crearElemento("h2", { texto: titulo }),
            crearElemento("p", { texto: descripcion }),
          ]),
          Boton({
            texto: "Nuevo",
            icono: "+",
            variante: "primario",
            deshabilitado: !puedeGestionar,
            titulo: puedeGestionar ? `Nuevo registro de ${titulo}` : "Permiso requerido",
            alClick: () => abrirFormulario(),
          }),
        ]),
        BarraFiltros({
          valorBusqueda: estado.busqueda,
          alBuscar: buscarConEspera,
          alLimpiar: () => {
            estado.busqueda = "";
            cargar();
          },
        }),
        estado.estaCargando
          ? IndicadorCarga({ texto: "Cargando información..." })
          : estado.error
            ? PanelError({ detalle: estado.error })
            : Tarjeta({
                titulo: `${estado.total} registros`,
                cuerpo: [
                  TablaDatos({
                    columnas,
                    filas: estado.filas,
                    obtenerClave: (fila) => fila[columnaId],
                    mensajeVacio: `Sin registros en ${titulo}`,
                  }),
                ],
              }),
      );
    }

    cargar();
    return envolverProtegida(contenedor, ruta);
  };
}
