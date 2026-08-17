import {
  crearAdministradorInicial,
  iniciarSesion,
  obtenerEstadoInicialAutenticacion,
} from "../../nucleo/autenticacion/servicioSesion.js";
import { traducirError } from "../../nucleo/errores/manejadorErrores.js";
import { crearElemento, limpiarNodo } from "../../utilidades/dom.js";
import { Boton } from "../../componentes/Boton/Boton.js";
import { CampoTexto } from "../../componentes/CampoTexto/CampoTexto.js";
import { PanelError } from "../../componentes/Error/PanelError.js";
import { mostrarNotificacion } from "../../componentes/Notificacion/Notificacion.js";

export function PaginaIngreso({ recargarUsuario, configuracionFaltante = [] } = {}) {
  let correo = "";
  let contrasena = "";
  let nombreMostrado = "";
  let requiereConfiguracionInicial = false;
  let verificandoConfiguracionInicial = true;
  let estaCargando = false;
  const formulario = crearElemento("form", { clases: "formulario" });

  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    if (estaCargando) {
      return;
    }

    estaCargando = true;
    renderizarFormulario();

    try {
      if (requiereConfiguracionInicial) {
        await crearAdministradorInicial({ correo, contrasena, nombreMostrado });
      } else {
        await iniciarSesion(correo, contrasena);
      }
      mostrarNotificacion({
        tipo: "exito",
        titulo: requiereConfiguracionInicial ? "Administrador creado" : "Sesión iniciada",
        mensaje: "Bienvenido al sistema de asistencia.",
      });
      await recargarUsuario();
    } catch (error) {
      mostrarNotificacion({
        tipo: "error",
        titulo: "No se pudo iniciar sesión",
        mensaje: traducirError(error),
      });
    } finally {
      estaCargando = false;
      renderizarFormulario();
    }
  };

  function renderizarFormulario() {
    limpiarNodo(formulario);
    formulario.addEventListener("submit", manejarEnvio, { once: true });

    const elementosFormulario = [
      requiereConfiguracionInicial
        ? PanelError({
            titulo: "Configuración inicial",
            detalle:
              "Crea el primer administrador local de Cloudflare. Luego podras crear mas usuarios desde el modulo Usuarios.",
          })
        : null,
      CampoTexto({
        id: "correo",
        etiqueta: "Correo electrónico",
        tipo: "email",
        valor: correo,
        requerido: true,
        autocompletar: "email",
        alCambiar: (valor) => {
          correo = valor;
        },
      }),
      requiereConfiguracionInicial
        ? CampoTexto({
            id: "nombre_mostrado",
            etiqueta: "Nombre mostrado",
            valor: nombreMostrado,
            requerido: true,
            autocompletar: "name",
            alCambiar: (valor) => {
              nombreMostrado = valor;
            },
          })
        : null,
      CampoTexto({
        id: "contrasena",
        etiqueta: requiereConfiguracionInicial ? "Contraseña del administrador" : "Contraseña",
        tipo: "password",
        valor: contrasena,
        requerido: true,
        autocompletar: "current-password",
        alCambiar: (valor) => {
          contrasena = valor;
        },
      }),
      Boton({
        texto: estaCargando
          ? requiereConfiguracionInicial
            ? "Creando..."
            : "Ingresando..."
          : requiereConfiguracionInicial
            ? "Crear administrador"
            : "Ingresar",
        tipo: "submit",
        icono: "I",
        deshabilitado:
          estaCargando || verificandoConfiguracionInicial || configuracionFaltante.length > 0,
      }),
    ].filter(Boolean);

    formulario.append(...elementosFormulario);
  }

  renderizarFormulario();

  obtenerEstadoInicialAutenticacion()
    .then((estadoInicial) => {
      requiereConfiguracionInicial = Boolean(estadoInicial?.requiere_configuracion);
    })
    .catch(() => {
      requiereConfiguracionInicial = false;
    })
    .finally(() => {
      verificandoConfiguracionInicial = false;
      renderizarFormulario();
    });

  return crearElemento("main", { clases: "pantalla-ingreso" }, [
    crearElemento("section", { clases: "panel-ingreso" }, [
      crearElemento("div", { clases: "marca-institucional" }, [
        crearElemento("p", {
          clases: "texto-suave",
          texto: "Gobierno Autónomo Municipal de Uyuni",
        }),
        crearElemento("h1", {
          clases: "marca-institucional__nombre",
          texto: "Control de asistencia",
        }),
        crearElemento("p", {
          clases: "marca-institucional__detalle",
          texto: "Gestión individual de marcaciones, horarios, excepciones y reportes.",
        }),
      ]),
      configuracionFaltante.length
        ? PanelError({
            titulo: "Configuración incompleta",
            detalle: `Faltan variables públicas: ${configuracionFaltante.join(", ")}.`,
          })
        : formulario,
    ]),
  ]);
}
