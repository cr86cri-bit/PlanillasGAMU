import { traducirError } from "../../nucleo/errores/manejadorErrores.js";
import { crearElemento, limpiarNodo, textoSeguro } from "../../utilidades/dom.js";
import { crearAntirebote } from "../../utilidades/consultas.js";
import { BarraFiltros } from "../../componentes/BarraFiltros/BarraFiltros.js";
import { Boton } from "../../componentes/Boton/Boton.js";
import { EtiquetaEstado } from "../../componentes/EtiquetaEstado/EtiquetaEstado.js";
import { IndicadorCarga } from "../../componentes/IndicadorCarga/IndicadorCarga.js";
import { Modal } from "../../componentes/Modal/Modal.js";
import { mostrarNotificacion } from "../../componentes/Notificacion/Notificacion.js";
import { PanelError } from "../../componentes/Error/PanelError.js";
import { TablaDatos } from "../../componentes/TablaDatos/TablaDatos.js";
import { Tarjeta } from "../../componentes/Tarjeta/Tarjeta.js";
import {
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  listarUsuarios,
} from "./servicios/servicioUsuarios.js";
import { listarRoles } from "../roles/servicios/servicioRoles.js";

function crearCampo({ clave, etiqueta, tipo = "text", requerido = false, valor = "", ayuda = "" }) {
  const idCampo = `${clave}-${crypto.randomUUID()}`;
  return crearElemento("div", { clases: "campo" }, [
    crearElemento("label", { atributos: { for: idCampo }, texto: etiqueta }),
    crearElemento("input", {
      atributos: { id: idCampo, name: clave, type: tipo, required: requerido, value: valor ?? "" },
    }),
    ayuda ? crearElemento("span", { clases: "campo__ayuda", texto: ayuda }) : null,
  ]);
}

function crearSelector({ clave, etiqueta, valor = "", opciones = [] }) {
  const idCampo = `${clave}-${crypto.randomUUID()}`;
  return crearElemento("div", { clases: "campo" }, [
    crearElemento("label", { atributos: { for: idCampo }, texto: etiqueta }),
    crearElemento(
      "select",
      { atributos: { id: idCampo, name: clave } },
      opciones.map((opcion) =>
        crearElemento("option", {
          texto: opcion.etiqueta,
          atributos: {
            value: opcion.valor,
            selected: String(opcion.valor) === String(valor),
          },
        }),
      ),
    ),
  ]);
}

function valorFormulario(formulario, clave) {
  return String(formulario.elements.namedItem(clave)?.value ?? "").trim();
}

export function PaginaUsuarios({ envolverProtegida, ruta } = {}) {
  const estado = {
    busqueda: "",
    usuarios: [],
    roles: [],
    total: 0,
    estaCargando: true,
    error: null,
  };
  const contenedor = crearElemento("main", { clases: "pagina" });

  async function cargar() {
    estado.estaCargando = true;
    estado.error = null;
    renderizar();

    try {
      const [usuarios, roles] = await Promise.all([
        listarUsuarios({ busqueda: estado.busqueda, pagina: 1, tamanoPagina: 50 }),
        listarRoles({ pagina: 1, tamanoPagina: 50 }),
      ]);
      estado.usuarios = usuarios.filas;
      estado.total = usuarios.total;
      estado.roles = roles.filas.filter((rol) => rol.activo);
    } catch (error) {
      estado.error = traducirError(error);
    } finally {
      estado.estaCargando = false;
      renderizar();
    }
  }

  const buscarConEspera = crearAntirebote((valor) => {
    estado.busqueda = valor;
    cargar();
  });

  async function guardar(formulario, modal, usuario = null) {
    try {
      const datos = {
        id_usuario: usuario?.id_usuario,
        correo: valorFormulario(formulario, "correo"),
        nombre_mostrado: valorFormulario(formulario, "nombre_mostrado"),
        contrasena: valorFormulario(formulario, "contrasena"),
        estado: valorFormulario(formulario, "estado"),
        id_rol: valorFormulario(formulario, "id_rol") || null,
      };

      if (usuario) {
        await actualizarUsuario(datos);
      } else {
        await crearUsuario(datos);
      }

      modal.remove();
      mostrarNotificacion({
        titulo: usuario ? "Usuario actualizado" : "Usuario creado",
        mensaje: "La operacion termino correctamente.",
        tipo: "exito",
      });
      await cargar();
    } catch (error) {
      mostrarNotificacion({
        titulo: "No se pudo guardar el usuario",
        mensaje: traducirError(error),
        tipo: "error",
      });
    }
  }

  function abrirFormulario(usuario = null) {
    const opcionesRoles = [
      { valor: "", etiqueta: "Sin rol inicial" },
      ...estado.roles.map((rol) => ({ valor: rol.id_rol, etiqueta: rol.nombre })),
    ];
    const formulario = crearElemento("form", { clases: "formulario" }, [
      crearCampo({
        clave: "correo",
        etiqueta: "Correo",
        tipo: "email",
        requerido: true,
        valor: usuario?.correo,
      }),
      crearCampo({
        clave: "nombre_mostrado",
        etiqueta: "Nombre mostrado",
        valor: usuario?.nombre_mostrado,
      }),
      crearCampo({
        clave: "contrasena",
        etiqueta: usuario ? "Nueva contrasena opcional" : "Contrasena temporal",
        tipo: "password",
        requerido: !usuario,
        ayuda: usuario ? "Deja vacio para mantener la contrasena actual." : "",
      }),
      usuario
        ? crearSelector({
            clave: "estado",
            etiqueta: "Estado",
            valor: usuario.estado,
            opciones: [
              { valor: "ACTIVO", etiqueta: "Activo" },
              { valor: "INACTIVO", etiqueta: "Inactivo" },
              { valor: "PENDIENTE", etiqueta: "Pendiente" },
            ],
          })
        : crearSelector({
            clave: "id_rol",
            etiqueta: "Rol inicial",
            opciones: opcionesRoles,
          }),
    ]);

    let modal;
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      await guardar(formulario, modal, usuario);
    });

    modal = Modal({
      titulo: usuario ? "Editar usuario" : "Nuevo usuario",
      cuerpo: formulario,
      pie: [
        Boton({ texto: "Cancelar", variante: "secundario", alClick: () => modal.remove() }),
        Boton({ texto: "Guardar", icono: "✓", alClick: () => formulario.requestSubmit() }),
      ],
    });
  }

  async function desactivar(usuario) {
    try {
      await desactivarUsuario(usuario.id_usuario);
      await cargar();
    } catch (error) {
      mostrarNotificacion({
        titulo: "No se pudo desactivar",
        mensaje: traducirError(error),
        tipo: "error",
      });
    }
  }

  function renderizar() {
    limpiarNodo(contenedor);
    contenedor.append(
      crearElemento("section", { clases: "pagina__cabecera" }, [
        crearElemento("div", { clases: "pagina__titulo" }, [
          crearElemento("h2", { texto: "Usuarios" }),
          crearElemento("p", {
            texto: "Cuentas de acceso locales guardadas en Cloudflare D1.",
          }),
        ]),
        Boton({
          texto: "Nuevo",
          icono: "+",
          variante: "primario",
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
        ? IndicadorCarga({ texto: "Cargando usuarios..." })
        : estado.error
          ? PanelError({ detalle: estado.error })
          : Tarjeta({
              titulo: `${estado.total} usuarios`,
              cuerpo: [
                TablaDatos({
                  filas: estado.usuarios,
                  obtenerClave: (usuario) => usuario.id_perfil,
                  mensajeVacio: "Sin usuarios registrados",
                  columnas: [
                    { titulo: "Correo", clave: "correo" },
                    {
                      titulo: "Nombre",
                      renderizar: (usuario) => textoSeguro(usuario.nombre_mostrado),
                    },
                    {
                      titulo: "Estado",
                      renderizar: (usuario) => EtiquetaEstado({ estado: usuario.estado }),
                    },
                    {
                      titulo: "Acciones",
                      renderizar: (usuario) =>
                        crearElemento("div", { clases: "acciones acciones--tabla" }, [
                          Boton({
                            texto: "Editar",
                            variante: "secundario",
                            alClick: () => abrirFormulario(usuario),
                          }),
                          Boton({
                            texto: "Desactivar",
                            variante: "secundario",
                            deshabilitado: usuario.estado === "INACTIVO",
                            alClick: () => desactivar(usuario),
                          }),
                        ]),
                    },
                  ],
                }),
              ],
            }),
    );
  }

  cargar();
  return envolverProtegida(contenedor, ruta);
}
